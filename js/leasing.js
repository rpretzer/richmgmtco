/**
 * Leasing Application Form - Multi-Step Wizard Handler
 * Rich Management Company Website Modernization
 */

(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('leasingForm');
    const progressSteps = document.querySelectorAll('.progress-step');
    const formSteps = document.querySelectorAll('.form-step');
    const applicationReview = document.getElementById('applicationReview');
    const applicationNumber = document.getElementById('applicationNumber');

    // File upload containers
    const uploadAreas = {
        id: {
            upload: document.getElementById('idUpload'),
            input: document.getElementById('idFile'),
            list: document.getElementById('idFilesList'),
            files: []
        },
        income: {
            upload: document.getElementById('incomeUpload'),
            input: document.getElementById('incomeFiles'),
            list: document.getElementById('incomeFilesList'),
            files: []
        },
        other: {
            upload: document.getElementById('otherUpload'),
            input: document.getElementById('otherFiles'),
            list: document.getElementById('otherFilesList'),
            files: []
        }
    };

    // State
    let currentStep = 1;
    const totalSteps = 6;

    // Initialize
    function init() {
        setupNavigation();
        setupFileUploads();
        setupConditionalFields();
        setupFormValidation();
        setupDateDefaults();
    }

    // Set minimum date for move-in (today)
    function setupDateDefaults() {
        const moveDate = document.getElementById('moveDate');
        if (moveDate) {
            const today = new Date().toISOString().split('T')[0];
            moveDate.min = today;
        }

        // Set max date for DOB (must be at least 18)
        const dob = document.getElementById('dob');
        if (dob) {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() - 18);
            dob.max = maxDate.toISOString().split('T')[0];
        }
    }

    // Navigation Setup
    function setupNavigation() {
        // Step 1
        document.getElementById('nextStep1')?.addEventListener('click', () => {
            if (validateStep(1)) goToStep(2);
        });

        // Step 2
        document.getElementById('backStep2')?.addEventListener('click', () => goToStep(1));
        document.getElementById('nextStep2')?.addEventListener('click', () => {
            if (validateStep(2)) goToStep(3);
        });

        // Step 3
        document.getElementById('backStep3')?.addEventListener('click', () => goToStep(2));
        document.getElementById('nextStep3')?.addEventListener('click', () => {
            if (validateStep(3)) goToStep(4);
        });

        // Step 4
        document.getElementById('backStep4')?.addEventListener('click', () => goToStep(3));
        document.getElementById('nextStep4')?.addEventListener('click', () => {
            if (validateStep(4)) goToStep(5);
        });

        // Step 5
        document.getElementById('backStep5')?.addEventListener('click', () => goToStep(4));
        document.getElementById('nextStep5')?.addEventListener('click', () => {
            if (validateStep(5)) {
                populateReview();
                goToStep(6);
            }
        });

        // Step 6
        document.getElementById('backStep6')?.addEventListener('click', () => goToStep(5));
    }

    function goToStep(step) {
        currentStep = step;

        // Update progress indicator
        progressSteps.forEach((el, index) => {
            el.classList.remove('active', 'completed');
            if (index + 1 < step) {
                el.classList.add('completed');
            } else if (index + 1 === step) {
                el.classList.add('active');
            }
        });

        // Show correct form step
        formSteps.forEach(el => el.classList.add('hidden'));
        document.getElementById(`step${step}`)?.classList.remove('hidden');

        // Scroll to top of form
        document.querySelector('.form-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // File Upload Setup
    function setupFileUploads() {
        Object.keys(uploadAreas).forEach(type => {
            const area = uploadAreas[type];
            if (!area.upload || !area.input) return;

            // Click to upload
            area.upload.addEventListener('click', (e) => {
                if (e.target !== area.input) {
                    area.input.click();
                }
            });

            // Drag and drop
            area.upload.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.upload.classList.add('dragover');
            });

            area.upload.addEventListener('dragleave', () => {
                area.upload.classList.remove('dragover');
            });

            area.upload.addEventListener('drop', (e) => {
                e.preventDefault();
                area.upload.classList.remove('dragover');
                handleFiles(type, e.dataTransfer.files);
            });

            // File input change
            area.input.addEventListener('change', (e) => {
                handleFiles(type, e.target.files);
            });
        });
    }

    function handleFiles(type, files) {
        const area = uploadAreas[type];
        const maxFiles = type === 'id' ? 1 : 5;
        const maxSize = 5 * 1024 * 1024; // 5MB

        Array.from(files).forEach(file => {
            // Check file count
            if (area.files.length >= maxFiles) {
                showNotification(`Maximum ${maxFiles} file(s) allowed for this section`, 'error');
                return;
            }

            // Check file size
            if (file.size > maxSize) {
                showNotification(`${file.name} is too large (max 5MB)`, 'error');
                return;
            }

            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                showNotification(`${file.name} is not a valid file type (use JPG, PNG, or PDF)`, 'error');
                return;
            }

            // For ID, replace existing file
            if (type === 'id') {
                area.files = [file];
            } else {
                area.files.push(file);
            }
        });

        renderUploadedFiles(type);
    }

    function renderUploadedFiles(type) {
        const area = uploadAreas[type];
        if (!area.list) return;

        if (area.files.length === 0) {
            area.list.innerHTML = '';
            return;
        }

        area.list.innerHTML = area.files.map((file, index) => `
            <div class="uploaded-file">
                <span>${file.type === 'application/pdf' ? '📄' : '🖼️'}</span>
                <span>${truncateFilename(file.name, 25)}</span>
                <span class="remove-file" data-type="${type}" data-index="${index}">&times;</span>
            </div>
        `).join('');

        // Add remove handlers
        area.list.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileType = btn.dataset.type;
                const index = parseInt(btn.dataset.index);
                uploadAreas[fileType].files.splice(index, 1);
                renderUploadedFiles(fileType);
            });
        });
    }

    function truncateFilename(name, maxLength) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 4);
        return `${truncatedName}...${ext}`;
    }

    // Conditional Fields
    function setupConditionalFields() {
        // Eviction/broken lease explanation
        const eviction = document.getElementById('eviction');
        const brokenLease = document.getElementById('brokenLease');
        const evictionExplanation = document.getElementById('evictionExplanation');

        function toggleEvictionExplanation() {
            if (eviction?.checked || brokenLease?.checked) {
                evictionExplanation.style.display = 'block';
            } else {
                evictionExplanation.style.display = 'none';
            }
        }

        eviction?.addEventListener('change', toggleEvictionExplanation);
        brokenLease?.addEventListener('change', toggleEvictionExplanation);

        // Co-signer section
        const hasCoSigner = document.getElementById('hasCoSigner');
        const coSignerSection = document.getElementById('coSignerSection');

        hasCoSigner?.addEventListener('change', () => {
            coSignerSection.style.display = hasCoSigner.checked ? 'block' : 'none';
        });

        // Employment status
        const employmentStatus = document.getElementById('employmentStatus');
        const employmentDetails = document.getElementById('employmentDetails');

        employmentStatus?.addEventListener('change', () => {
            const needsEmployer = ['employed-ft', 'employed-pt', 'self-employed'].includes(employmentStatus.value);
            if (employmentDetails) {
                employmentDetails.style.display = needsEmployer ? 'block' : 'none';

                // Update required attributes
                const employerField = document.getElementById('employer');
                const jobTitleField = document.getElementById('jobTitle');
                if (employerField) employerField.required = needsEmployer;
                if (jobTitleField) jobTitleField.required = needsEmployer;
            }
        });

        // SSN formatting
        const ssnField = document.getElementById('ssn');
        ssnField?.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 3 && value.length <= 5) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            } else if (value.length > 5) {
                value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 9);
            }
            e.target.value = value;
        });

        // Phone formatting
        const phoneFields = ['phone', 'emergencyPhone', 'landlordPhone', 'employerPhone', 'coSignerPhone'];
        phoneFields.forEach(id => {
            const field = document.getElementById(id);
            field?.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 3 && value.length <= 6) {
                    value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
                } else if (value.length > 6) {
                    value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
                }
                e.target.value = value;
            });
        });
    }

    // Form Validation
    function setupFormValidation() {
        const inputs = form?.querySelectorAll('input, select, textarea');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.required && !input.value.trim()) {
                    input.closest('.form-group')?.classList.add('has-error');
                }
            });
            input.addEventListener('input', () => {
                input.closest('.form-group')?.classList.remove('has-error');
            });
        });
    }

    function validateStep(step) {
        let valid = true;
        const stepEl = document.getElementById(`step${step}`);
        if (!stepEl) return true;

        // Get required fields for this step
        const requiredFields = stepEl.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.closest('.form-group')?.classList.add('has-error');
                valid = false;
            }
        });

        // Special validation for step 5 (documents)
        if (step === 5) {
            if (uploadAreas.id.files.length === 0) {
                showNotification('Please upload your photo ID', 'error');
                valid = false;
            }
            if (uploadAreas.income.files.length === 0) {
                showNotification('Please upload proof of income', 'error');
                valid = false;
            }
        }

        // Email validation
        const emailField = stepEl.querySelector('input[type="email"]');
        if (emailField && emailField.value && !isValidEmail(emailField.value)) {
            emailField.closest('.form-group')?.classList.add('has-error');
            showNotification('Please enter a valid email address', 'error');
            valid = false;
        }

        if (!valid) {
            showNotification('Please fill in all required fields', 'error');
        }

        return valid;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Populate Review
    function populateReview() {
        if (!applicationReview) return;

        const getValue = (id) => document.getElementById(id)?.value || '';
        const getSelectText = (id) => {
            const select = document.getElementById(id);
            return select?.options[select.selectedIndex]?.text || '';
        };

        const unitTypeMap = {
            'studio': 'Studio',
            '1br': '1 Bedroom',
            '2br': '2 Bedroom',
            '3br': '3 Bedroom'
        };

        const residenceLengthMap = {
            'less-than-1': 'Less than 1 year',
            '1-2': '1-2 years',
            '2-5': '2-5 years',
            '5+': '5+ years'
        };

        const moveDate = new Date(getValue('moveDate'));
        const formattedMoveDate = moveDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        applicationReview.innerHTML = `
            <div class="review-section">
                <h4>Property Selection</h4>
                <div class="review-row">
                    <div>
                        <h4>Property</h4>
                        <p>${escapeHtml(getSelectText('property'))}</p>
                    </div>
                    <div>
                        <h4>Unit Type</h4>
                        <p>${unitTypeMap[getValue('unitType')] || getValue('unitType')}</p>
                    </div>
                </div>
                <div class="review-row" style="margin-top: var(--space-3);">
                    <div>
                        <h4>Move-In Date</h4>
                        <p>${formattedMoveDate}</p>
                    </div>
                    <div>
                        <h4>Occupants</h4>
                        <p>${getSelectText('occupants')}</p>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Personal Information</h4>
                <div class="review-row">
                    <div>
                        <h4>Name</h4>
                        <p>${escapeHtml(getValue('firstName'))} ${escapeHtml(getValue('lastName'))}</p>
                    </div>
                    <div>
                        <h4>Email</h4>
                        <p>${escapeHtml(getValue('email'))}</p>
                    </div>
                </div>
                <div class="review-row" style="margin-top: var(--space-3);">
                    <div>
                        <h4>Phone</h4>
                        <p>${escapeHtml(getValue('phone'))}</p>
                    </div>
                    <div>
                        <h4>Date of Birth</h4>
                        <p>${new Date(getValue('dob')).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Current Address</h4>
                <p>${escapeHtml(getValue('currentAddress'))}</p>
                <p>${escapeHtml(getValue('currentCity'))}, ${escapeHtml(getValue('currentState'))} ${escapeHtml(getValue('currentZip'))}</p>
                <div class="review-row" style="margin-top: var(--space-3);">
                    <div>
                        <h4>Monthly Rent</h4>
                        <p>$${escapeHtml(getValue('currentRent'))}</p>
                    </div>
                    <div>
                        <h4>Time at Address</h4>
                        <p>${residenceLengthMap[getValue('residenceLength')] || getValue('residenceLength')}</p>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Employment & Income</h4>
                <div class="review-row">
                    <div>
                        <h4>Employment Status</h4>
                        <p>${escapeHtml(getSelectText('employmentStatus'))}</p>
                    </div>
                    <div>
                        <h4>Monthly Income</h4>
                        <p>$${escapeHtml(getValue('monthlyIncome'))}${getValue('otherIncome') > 0 ? ' + $' + getValue('otherIncome') + ' other' : ''}</p>
                    </div>
                </div>
                ${getValue('employer') ? `
                <div class="review-row" style="margin-top: var(--space-3);">
                    <div>
                        <h4>Employer</h4>
                        <p>${escapeHtml(getValue('employer'))}</p>
                    </div>
                    <div>
                        <h4>Job Title</h4>
                        <p>${escapeHtml(getValue('jobTitle'))}</p>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="review-section">
                <h4>Emergency Contact</h4>
                <div class="review-row">
                    <div>
                        <h4>Name</h4>
                        <p>${escapeHtml(getValue('emergencyName'))}</p>
                    </div>
                    <div>
                        <h4>Phone</h4>
                        <p>${escapeHtml(getValue('emergencyPhone'))}</p>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Documents Uploaded</h4>
                <ul style="margin: 0; padding-left: var(--space-5);">
                    <li>Photo ID: ${uploadAreas.id.files.length} file(s)</li>
                    <li>Proof of Income: ${uploadAreas.income.files.length} file(s)</li>
                    ${uploadAreas.other.files.length > 0 ? `<li>Additional Documents: ${uploadAreas.other.files.length} file(s)</li>` : ''}
                </ul>
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Form Submission
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate consent checkboxes
        const creditCheck = document.getElementById('creditCheck');
        const truthful = document.getElementById('truthful');
        const appFee = document.getElementById('appFee');

        if (!creditCheck?.checked || !truthful?.checked || !appFee?.checked) {
            showNotification('Please agree to all terms before submitting', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitApplication');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

        // Collect all form data
        const submissionData = new FormData(form);

        // Add files
        uploadAreas.id.files.forEach((file, index) => {
            submissionData.append(`idFile_${index}`, file);
        });
        uploadAreas.income.files.forEach((file, index) => {
            submissionData.append(`incomeFile_${index}`, file);
        });
        uploadAreas.other.files.forEach((file, index) => {
            submissionData.append(`otherFile_${index}`, file);
        });

        // Generate application number
        const appNum = generateApplicationNumber();
        submissionData.set('applicationNumber', appNum);

        try {
            // Simulate API call (replace with actual endpoint)
            await simulateSubmission(submissionData);

            // Show success
            applicationNumber.textContent = appNum;
            formSteps.forEach(step => step.classList.add('hidden'));
            document.getElementById('stepSuccess')?.classList.remove('hidden');

            // Update progress to complete
            progressSteps.forEach(step => step.classList.add('completed'));

            // Scroll to success message
            document.querySelector('.form-container')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            showNotification('Application submitted successfully!', 'success');

        } catch (error) {
            console.error('Submission error:', error);
            showNotification('Failed to submit application. Please try again or call us.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Application';
        }
    });

    function generateApplicationNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `APP-${year}-${random}`;
    }

    async function simulateSubmission(data) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, this would be:
        // const response = await fetch('/api/applications', {
        //     method: 'POST',
        //     body: data
        // });
        // if (!response.ok) throw new Error('Submission failed');
        // return response.json();

        // Log submission data for testing
        console.log('Leasing application submitted:');
        for (let [key, value] of data.entries()) {
            if (value instanceof File) {
                console.log(`${key}: [File] ${value.name}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }

        return { success: true };
    }

    // Notification helper
    function showNotification(message, type = 'info') {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = 'position: fixed; top: 100px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;

        container.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .file-upload.dragover {
            border-color: var(--primary-500);
            background: var(--primary-50);
        }
        .form-group.has-error .form-input,
        .form-group.has-error .form-textarea,
        .form-group.has-error .form-select {
            border-color: var(--error-500);
        }
        .form-group.has-error .form-label {
            color: var(--error-500);
        }
    `;
    document.head.appendChild(style);

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
