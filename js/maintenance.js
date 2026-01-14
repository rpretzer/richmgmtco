/**
 * Maintenance Request Form - Smart Multi-Step Handler
 * Rich Management Company Website Modernization
 */

(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('maintenanceForm');
    const progressSteps = document.querySelectorAll('.progress-step');
    const formSteps = document.querySelectorAll('.form-step');
    const categoryCards = document.querySelectorAll('.category-card');
    const priorityCards = document.querySelectorAll('.priority-card');
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('photos');
    const uploadedFilesContainer = document.getElementById('uploadedFiles');
    const emergencyAlert = document.getElementById('emergencyAlert');
    const reviewCard = document.getElementById('reviewCard');
    const trackingNumber = document.getElementById('trackingNumber');

    // Navigation buttons
    const nextStep1 = document.getElementById('nextStep1');
    const nextStep2 = document.getElementById('nextStep2');
    const nextStep3 = document.getElementById('nextStep3');
    const backStep2 = document.getElementById('backStep2');
    const backStep3 = document.getElementById('backStep3');
    const backStep4 = document.getElementById('backStep4');
    const submitAnother = document.getElementById('submitAnother');

    // State
    let currentStep = 1;
    let uploadedFiles = [];
    let formData = {};

    // Emergency keywords that trigger alerts
    const emergencyKeywords = [
        'flood', 'flooding', 'water everywhere', 'burst pipe',
        'gas leak', 'smell gas', 'gas smell', 'carbon monoxide',
        'fire', 'smoke', 'burning',
        'no heat', 'no heating', 'freezing', 'frozen pipes',
        'electrical fire', 'sparks', 'sparking',
        'break in', 'broken into', 'intruder', 'security',
        'sewage', 'raw sewage', 'sewage backup'
    ];

    // Category to response time mapping
    const responseTimeMap = {
        'plumbing': '24-48 hours',
        'electrical': '24-48 hours',
        'hvac': '24 hours (urgent in extreme temps)',
        'appliances': '2-3 business days',
        'locks': '24 hours',
        'structural': '2-3 business days',
        'pests': '3-5 business days',
        'water-damage': 'Same day (emergency)',
        'other': '2-3 business days'
    };

    // Initialize
    function init() {
        setupCategorySelection();
        setupPrioritySelection();
        setupFileUpload();
        setupNavigation();
        setupFormValidation();
        setupEmergencyDetection();
    }

    // Category Selection
    function setupCategorySelection() {
        categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove active state from all cards
                categoryCards.forEach(c => c.classList.remove('selected'));
                // Add active state to clicked card
                this.classList.add('selected');
                // Enable next button
                nextStep1.disabled = false;
                // Store selection
                formData.category = this.dataset.category;
                formData.vendor = this.dataset.vendor;
                formData.categoryName = this.querySelector('.category-name').textContent;
            });
        });
    }

    // Priority Selection
    function setupPrioritySelection() {
        priorityCards.forEach(card => {
            card.addEventListener('click', function() {
                priorityCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                formData.priority = this.dataset.priority;
                formData.priorityName = this.querySelector('.priority-badge').textContent;

                // Show emergency alert for emergency priority
                if (formData.priority === 'emergency') {
                    emergencyAlert.classList.remove('hidden');
                } else {
                    emergencyAlert.classList.add('hidden');
                }
            });
        });
    }

    // File Upload
    function setupFileUpload() {
        if (!fileUpload || !fileInput) return;

        // Click to upload
        fileUpload.addEventListener('click', () => fileInput.click());

        // Drag and drop
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        const maxFiles = 5;
        const maxSize = 10 * 1024 * 1024; // 10MB

        Array.from(files).forEach(file => {
            // Check file count
            if (uploadedFiles.length >= maxFiles) {
                showNotification('Maximum 5 files allowed', 'error');
                return;
            }

            // Check file size
            if (file.size > maxSize) {
                showNotification(`${file.name} is too large (max 10MB)`, 'error');
                return;
            }

            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
            if (!validTypes.includes(file.type)) {
                showNotification(`${file.name} is not a valid file type`, 'error');
                return;
            }

            // Add to uploaded files
            uploadedFiles.push(file);
            renderUploadedFiles();
        });
    }

    function renderUploadedFiles() {
        if (!uploadedFilesContainer) return;

        uploadedFilesContainer.innerHTML = uploadedFiles.map((file, index) => `
            <div class="uploaded-file">
                <span>${file.type.startsWith('image/') ? '📷' : '🎥'}</span>
                <span>${truncateFilename(file.name, 20)}</span>
                <span class="remove-file" data-index="${index}">&times;</span>
            </div>
        `).join('');

        // Add remove handlers
        uploadedFilesContainer.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                uploadedFiles.splice(index, 1);
                renderUploadedFiles();
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

    // Navigation
    function setupNavigation() {
        nextStep1?.addEventListener('click', () => goToStep(2));
        nextStep2?.addEventListener('click', () => {
            if (validateStep2()) goToStep(3);
        });
        nextStep3?.addEventListener('click', () => {
            if (validateStep3()) {
                populateReview();
                goToStep(4);
            }
        });

        backStep2?.addEventListener('click', () => goToStep(1));
        backStep3?.addEventListener('click', () => goToStep(2));
        backStep4?.addEventListener('click', () => goToStep(3));

        submitAnother?.addEventListener('click', resetForm);
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
        formSteps.forEach((el, index) => {
            el.classList.add('hidden');
        });
        document.getElementById(`step${step}`)?.classList.remove('hidden');

        // Scroll to top of form
        document.querySelector('.form-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Validation
    function setupFormValidation() {
        // Real-time validation for required fields
        const inputs = form?.querySelectorAll('input[required], textarea[required], select[required]');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
    }

    function validateField(field) {
        const value = field.value.trim();
        const group = field.closest('.form-group');

        if (!value) {
            group?.classList.add('has-error');
            return false;
        }

        // Email validation
        if (field.type === 'email' && !isValidEmail(value)) {
            group?.classList.add('has-error');
            return false;
        }

        // Phone validation
        if (field.type === 'tel' && !isValidPhone(value)) {
            group?.classList.add('has-error');
            return false;
        }

        group?.classList.remove('has-error');
        return true;
    }

    function clearFieldError(field) {
        const group = field.closest('.form-group');
        group?.classList.remove('has-error');
    }

    function validateStep2() {
        const title = document.getElementById('issueTitle');
        const description = document.getElementById('issueDescription');
        let valid = true;

        if (!title?.value.trim()) {
            title?.closest('.form-group')?.classList.add('has-error');
            valid = false;
        }

        if (!description?.value.trim()) {
            description?.closest('.form-group')?.classList.add('has-error');
            valid = false;
        }

        if (!valid) {
            showNotification('Please fill in all required fields', 'error');
        }

        return valid;
    }

    function validateStep3() {
        const name = document.getElementById('tenantName');
        const phone = document.getElementById('tenantPhone');
        const email = document.getElementById('tenantEmail');
        const property = document.getElementById('property');
        const unit = document.getElementById('unit');
        let valid = true;

        [name, phone, email, property, unit].forEach(field => {
            if (!field?.value.trim()) {
                field?.closest('.form-group')?.classList.add('has-error');
                valid = false;
            }
        });

        if (email?.value && !isValidEmail(email.value)) {
            email?.closest('.form-group')?.classList.add('has-error');
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

    function isValidPhone(phone) {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10;
    }

    // Emergency Detection
    function setupEmergencyDetection() {
        const descriptionField = document.getElementById('issueDescription');
        const titleField = document.getElementById('issueTitle');

        [descriptionField, titleField].forEach(field => {
            field?.addEventListener('input', () => {
                const text = (titleField?.value + ' ' + descriptionField?.value).toLowerCase();
                const isEmergency = emergencyKeywords.some(keyword => text.includes(keyword));

                if (isEmergency) {
                    emergencyAlert?.classList.remove('hidden');
                    // Auto-select emergency priority
                    const emergencyRadio = document.querySelector('input[value="emergency"]');
                    if (emergencyRadio) {
                        emergencyRadio.checked = true;
                        formData.priority = 'emergency';
                        formData.priorityName = 'Emergency';
                        priorityCards.forEach(c => c.classList.remove('selected'));
                        emergencyRadio.closest('.priority-card')?.classList.add('selected');
                    }
                }
            });
        });
    }

    // Review Population
    function populateReview() {
        if (!reviewCard) return;

        const property = document.getElementById('property');
        const propertyName = property?.options[property?.selectedIndex]?.text || 'Not selected';
        const unit = document.getElementById('unit')?.value || '';
        const name = document.getElementById('tenantName')?.value || '';
        const phone = document.getElementById('tenantPhone')?.value || '';
        const email = document.getElementById('tenantEmail')?.value || '';
        const title = document.getElementById('issueTitle')?.value || '';
        const description = document.getElementById('issueDescription')?.value || '';
        const availability = document.getElementById('availability')?.value || 'anytime';
        const entryPermission = document.getElementById('entryPermission')?.value || 'present';
        const hasPets = document.getElementById('hasPets')?.checked || false;
        const accessNotes = document.getElementById('accessNotes')?.value || '';

        const availabilityText = {
            'anytime': 'Anytime',
            'morning': 'Morning (8am - 12pm)',
            'afternoon': 'Afternoon (12pm - 5pm)',
            'evening': 'Evening (5pm - 8pm)'
        };

        const entryText = {
            'present': 'I need to be present',
            'permission': 'OK to enter if I\'m not home'
        };

        const priorityClass = formData.priority || 'normal';
        const estimatedResponse = responseTimeMap[formData.category] || '2-3 business days';

        reviewCard.innerHTML = `
            <div class="review-section">
                <div class="review-row">
                    <div>
                        <h4>Category</h4>
                        <p>${formData.categoryName || 'Not selected'}</p>
                    </div>
                    <div>
                        <h4>Priority</h4>
                        <p><span class="priority-badge ${priorityClass}">${formData.priorityName || 'Normal'}</span></p>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Issue</h4>
                <p><strong>${escapeHtml(title)}</strong></p>
                <p style="margin-top: var(--space-2); color: var(--text-secondary);">${escapeHtml(description)}</p>
                ${uploadedFiles.length > 0 ? `
                    <p style="margin-top: var(--space-2);"><small>${uploadedFiles.length} photo(s) attached</small></p>
                ` : ''}
            </div>

            <div class="review-section">
                <div class="review-row">
                    <div>
                        <h4>Property</h4>
                        <p>${escapeHtml(propertyName)}</p>
                    </div>
                    <div>
                        <h4>Unit</h4>
                        <p>${escapeHtml(unit)}</p>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <div class="review-row">
                    <div>
                        <h4>Name</h4>
                        <p>${escapeHtml(name)}</p>
                    </div>
                    <div>
                        <h4>Phone</h4>
                        <p>${escapeHtml(phone)}</p>
                    </div>
                </div>
                <div style="margin-top: var(--space-3);">
                    <h4>Email</h4>
                    <p>${escapeHtml(email)}</p>
                </div>
            </div>

            <div class="review-section">
                <div class="review-row">
                    <div>
                        <h4>Best Contact Time</h4>
                        <p>${availabilityText[availability]}</p>
                    </div>
                    <div>
                        <h4>Entry Permission</h4>
                        <p>${entryText[entryPermission]}</p>
                    </div>
                </div>
                ${hasPets ? `<p style="margin-top: var(--space-2);"><small>🐾 Pets in unit</small></p>` : ''}
                ${accessNotes ? `
                    <div style="margin-top: var(--space-3);">
                        <h4>Access Notes</h4>
                        <p>${escapeHtml(accessNotes)}</p>
                    </div>
                ` : ''}
            </div>

            <div class="review-section" style="background: var(--info-50); margin: 0 calc(-1 * var(--space-6)); padding: var(--space-4) var(--space-6); margin-bottom: calc(-1 * var(--space-6)); border-radius: 0 0 var(--radius-xl) var(--radius-xl);">
                <h4>Estimated Response Time</h4>
                <p><strong>${estimatedResponse}</strong></p>
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

        const submitBtn = document.getElementById('submitRequest');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

        // Collect all form data
        const submissionData = new FormData(form);

        // Add custom fields
        submissionData.set('category', formData.category);
        submissionData.set('categoryName', formData.categoryName);
        submissionData.set('priority', formData.priority || 'normal');
        submissionData.set('vendor', formData.vendor);

        // Add files
        uploadedFiles.forEach((file, index) => {
            submissionData.append(`photo_${index}`, file);
        });

        // Generate tracking number
        const tracking = generateTrackingNumber();
        submissionData.set('trackingNumber', tracking);

        try {
            // Simulate API call (replace with actual endpoint)
            await simulateSubmission(submissionData);

            // Show success
            trackingNumber.textContent = tracking;
            formSteps.forEach(step => step.classList.add('hidden'));
            document.getElementById('stepSuccess')?.classList.remove('hidden');

            // Update progress to complete
            progressSteps.forEach(step => step.classList.add('completed'));

            // Scroll to success message
            document.querySelector('.form-container')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            showNotification('Request submitted successfully!', 'success');

        } catch (error) {
            console.error('Submission error:', error);
            showNotification('Failed to submit request. Please try again or call us.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Request';
        }
    });

    function generateTrackingNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `MR-${year}-${random}`;
    }

    async function simulateSubmission(data) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In production, this would be:
        // const response = await fetch('/api/maintenance', {
        //     method: 'POST',
        //     body: data
        // });
        // if (!response.ok) throw new Error('Submission failed');
        // return response.json();

        // Log submission data for testing
        console.log('Maintenance request submitted:');
        for (let [key, value] of data.entries()) {
            if (value instanceof File) {
                console.log(`${key}: [File] ${value.name}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }

        return { success: true };
    }

    // Reset Form
    function resetForm() {
        form?.reset();
        currentStep = 1;
        uploadedFiles = [];
        formData = {};

        // Reset UI states
        categoryCards.forEach(c => c.classList.remove('selected'));
        priorityCards.forEach(c => c.classList.remove('selected'));
        uploadedFilesContainer.innerHTML = '';
        emergencyAlert?.classList.add('hidden');
        nextStep1.disabled = true;

        // Reset progress
        progressSteps.forEach((el, index) => {
            el.classList.remove('active', 'completed');
            if (index === 0) el.classList.add('active');
        });

        // Show first step
        formSteps.forEach(step => step.classList.add('hidden'));
        document.getElementById('step1')?.classList.remove('hidden');

        // Scroll to top
        document.querySelector('.form-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Notification helper
    function showNotification(message, type = 'info') {
        // Check if notification container exists, if not create it
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
