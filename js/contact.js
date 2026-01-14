/**
 * Contact Form Handler
 * Rich Management Company Website Modernization
 */

(function() {
    'use strict';

    const form = document.getElementById('contactForm');

    // Initialize
    function init() {
        setupFormValidation();
        setupPhoneFormatting();
        setupFormSubmission();
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

    // Phone Formatting
    function setupPhoneFormatting() {
        const phoneField = document.getElementById('phone');
        phoneField?.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 3 && value.length <= 6) {
                value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
            } else if (value.length > 6) {
                value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
            }
            e.target.value = value;
        });
    }

    // Form Submission
    function setupFormSubmission() {
        form?.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validate form
            if (!validateForm()) return;

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

            try {
                // Collect form data
                const formData = new FormData(form);

                // Simulate API call (replace with actual endpoint)
                await simulateSubmission(formData);

                // Show success message
                showSuccessMessage();
                form.reset();

                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');

            } catch (error) {
                console.error('Form submission error:', error);
                showNotification('Failed to send message. Please try again or call us directly.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    function validateForm() {
        let valid = true;
        const requiredFields = form?.querySelectorAll('[required]');

        requiredFields?.forEach(field => {
            if (!field.value.trim()) {
                field.closest('.form-group')?.classList.add('has-error');
                valid = false;
            }
        });

        // Email validation
        const emailField = document.getElementById('email');
        if (emailField?.value && !isValidEmail(emailField.value)) {
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

    async function simulateSubmission(formData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In production, this would be:
        // const response = await fetch('/api/contact', {
        //     method: 'POST',
        //     body: formData
        // });
        // if (!response.ok) throw new Error('Submission failed');

        // Log form data for testing
        console.log('Contact form submitted:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        return { success: true };
    }

    function showSuccessMessage() {
        // Replace form with success message temporarily
        const formContainer = form.parentElement;
        const originalContent = formContainer.innerHTML;

        formContainer.innerHTML = `
            <div class="success-message" style="text-align: center; padding: var(--space-8);">
                <div class="success-icon" style="font-size: 64px; margin-bottom: var(--space-4);">✅</div>
                <h3 style="color: var(--success-600); margin-bottom: var(--space-4);">Message Sent!</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">Thank you for reaching out. We'll get back to you within 1-2 business days.</p>
                <button type="button" class="btn btn-outline" id="sendAnother">Send Another Message</button>
            </div>
        `;

        // Allow sending another message
        document.getElementById('sendAnother')?.addEventListener('click', () => {
            formContainer.innerHTML = originalContent;
            init(); // Re-initialize form handlers
        });
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

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Add animation and spinner styles
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
