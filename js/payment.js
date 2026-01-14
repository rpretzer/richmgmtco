/**
 * Payment Portal - Stripe-Ready Payment Handler
 * Rich Management Company Website Modernization
 */

(function() {
    'use strict';

    // DOM Elements
    const paymentModal = document.getElementById('paymentModal');
    const autoPayModal = document.getElementById('autoPayModal');
    const paymentForm = document.getElementById('paymentForm');
    const autoPayForm = document.getElementById('autoPayForm');

    // Buttons
    const payOnlineBtn = document.getElementById('payOnlineBtn');
    const autoPayBtn = document.getElementById('autoPayBtn');
    const closePaymentModal = document.getElementById('closePaymentModal');
    const closeAutoPayModal = document.getElementById('closeAutoPayModal');
    const continueToPayment = document.getElementById('continueToPayment');
    const backToStep1 = document.getElementById('backToStep1');
    const closeSuccessModal = document.getElementById('closeSuccessModal');

    // Payment method tabs
    const paymentTabs = document.querySelectorAll('.payment-tab');
    const cardPayment = document.getElementById('cardPayment');
    const bankPayment = document.getElementById('bankPayment');

    // State
    let currentPaymentMethod = 'card';
    let paymentData = {};

    // Initialize
    function init() {
        setupModalHandlers();
        setupPaymentTabs();
        setupPaymentSteps();
        setupFormValidation();
        setupPhoneFormatting();
    }

    // Modal Handlers
    function setupModalHandlers() {
        // Open payment modal
        payOnlineBtn?.addEventListener('click', () => {
            openModal(paymentModal);
        });

        // Open auto-pay modal
        autoPayBtn?.addEventListener('click', () => {
            openModal(autoPayModal);
        });

        // Close buttons
        closePaymentModal?.addEventListener('click', () => {
            closeModal(paymentModal);
            resetPaymentForm();
        });

        closeAutoPayModal?.addEventListener('click', () => {
            closeModal(autoPayModal);
        });

        closeSuccessModal?.addEventListener('click', () => {
            closeModal(paymentModal);
            resetPaymentForm();
        });

        // Click outside to close
        [paymentModal, autoPayModal].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                    if (modal === paymentModal) resetPaymentForm();
                }
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (paymentModal?.classList.contains('active')) {
                    closeModal(paymentModal);
                    resetPaymentForm();
                }
                if (autoPayModal?.classList.contains('active')) {
                    closeModal(autoPayModal);
                }
            }
        });
    }

    function openModal(modal) {
        modal?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Payment Method Tabs
    function setupPaymentTabs() {
        paymentTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const method = tab.dataset.method;
                currentPaymentMethod = method;

                // Update active tab
                paymentTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show correct payment form
                if (method === 'card') {
                    cardPayment?.classList.remove('hidden');
                    bankPayment?.classList.add('hidden');
                } else {
                    cardPayment?.classList.add('hidden');
                    bankPayment?.classList.remove('hidden');
                }

                // Update pay button amount (with or without fee)
                updatePayButtonAmount();
            });
        });
    }

    // Payment Steps
    function setupPaymentSteps() {
        const step1 = document.getElementById('paymentStep1');
        const step2 = document.getElementById('paymentStep2');

        // Continue to payment details
        continueToPayment?.addEventListener('click', () => {
            if (!validatePaymentStep1()) return;

            // Store payment data
            const propertySelect = document.getElementById('paymentProperty');
            paymentData = {
                property: propertySelect?.value,
                propertyName: propertySelect?.options[propertySelect?.selectedIndex]?.text,
                unit: document.getElementById('paymentUnit')?.value,
                email: document.getElementById('paymentEmail')?.value,
                amount: parseFloat(document.getElementById('paymentAmount')?.value) || 0
            };

            // Update summary
            document.getElementById('summaryProperty').textContent = paymentData.propertyName;
            document.getElementById('summaryUnit').textContent = paymentData.unit;
            updatePayButtonAmount();

            // Show step 2
            step1?.classList.add('hidden');
            step2?.classList.remove('hidden');
        });

        // Back to step 1
        backToStep1?.addEventListener('click', () => {
            step1?.classList.remove('hidden');
            step2?.classList.add('hidden');
        });
    }

    function updatePayButtonAmount() {
        const amount = paymentData.amount || 0;
        const feeRate = currentPaymentMethod === 'card' ? 0.029 : 0;
        const fee = amount * feeRate;
        const total = amount + fee;

        document.getElementById('summaryAmount').textContent = formatCurrency(total);
        document.getElementById('payButtonAmount').textContent = formatCurrency(total);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Form Validation
    function setupFormValidation() {
        const inputs = document.querySelectorAll('#paymentModal input, #paymentModal select, #autoPayModal input, #autoPayModal select');
        inputs.forEach(input => {
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

    function validatePaymentStep1() {
        const property = document.getElementById('paymentProperty');
        const unit = document.getElementById('paymentUnit');
        const email = document.getElementById('paymentEmail');
        const amount = document.getElementById('paymentAmount');

        let valid = true;

        [property, unit, email, amount].forEach(field => {
            if (!field?.value.trim()) {
                field?.closest('.form-group')?.classList.add('has-error');
                valid = false;
            }
        });

        if (email?.value && !isValidEmail(email.value)) {
            email.closest('.form-group')?.classList.add('has-error');
            showNotification('Please enter a valid email address', 'error');
            valid = false;
        }

        const amountValue = parseFloat(amount?.value);
        if (!amountValue || amountValue <= 0) {
            amount?.closest('.form-group')?.classList.add('has-error');
            showNotification('Please enter a valid payment amount', 'error');
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

    // Phone Formatting
    function setupPhoneFormatting() {
        const phoneField = document.getElementById('autoPayPhone');
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

    // Reset Payment Form
    function resetPaymentForm() {
        paymentForm?.reset();
        paymentData = {};

        // Show step 1, hide others
        document.getElementById('paymentStep1')?.classList.remove('hidden');
        document.getElementById('paymentStep2')?.classList.add('hidden');
        document.getElementById('paymentSuccess')?.classList.add('hidden');

        // Reset payment method tabs
        paymentTabs.forEach(t => t.classList.remove('active'));
        paymentTabs[0]?.classList.add('active');
        cardPayment?.classList.remove('hidden');
        bankPayment?.classList.add('hidden');
        currentPaymentMethod = 'card';

        // Clear validation errors
        document.querySelectorAll('.form-group.has-error').forEach(group => {
            group.classList.remove('has-error');
        });
    }

    // Payment Form Submission
    paymentForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitPayment');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

        try {
            // In production, this would call Stripe API
            // const stripe = Stripe('pk_live_xxx');
            // const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {...});

            // Simulate payment processing
            await simulatePayment();

            // Generate confirmation number
            const confirmation = generateConfirmationNumber();

            // Update success screen
            document.getElementById('paymentConfirmation').textContent = confirmation;
            document.getElementById('receiptAmount').textContent = formatCurrency(paymentData.amount + (currentPaymentMethod === 'card' ? paymentData.amount * 0.029 : 0));
            document.getElementById('receiptDate').textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            document.getElementById('receiptProperty').textContent = `${paymentData.propertyName} - ${paymentData.unit}`;

            // Show success
            document.getElementById('paymentStep2')?.classList.add('hidden');
            document.getElementById('paymentSuccess')?.classList.remove('hidden');

            showNotification('Payment successful!', 'success');

        } catch (error) {
            console.error('Payment error:', error);
            showNotification('Payment failed. Please try again or contact our office.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Pay ${document.getElementById('payButtonAmount').textContent}`;
        }
    });

    // Auto-Pay Form Submission
    autoPayForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = autoPayForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

        try {
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Log form data
            const formData = new FormData(autoPayForm);
            console.log('Auto-pay request submitted:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            closeModal(autoPayModal);
            autoPayForm.reset();
            showNotification('Auto-pay request submitted! We will call you to complete setup.', 'success');

        } catch (error) {
            console.error('Auto-pay error:', error);
            showNotification('Request failed. Please try again or call our office.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Request Auto-Pay Setup';
        }
    });

    async function simulatePayment() {
        // Simulate network delay and payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, this would be actual Stripe integration:
        // const response = await fetch('/api/payments/create-intent', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         amount: Math.round(paymentData.amount * 100), // Stripe uses cents
        //         property: paymentData.property,
        //         unit: paymentData.unit,
        //         email: paymentData.email
        //     })
        // });
        // const { clientSecret } = await response.json();
        // return stripe.confirmCardPayment(clientSecret, {...});

        console.log('Payment processed:', {
            ...paymentData,
            method: currentPaymentMethod,
            fee: currentPaymentMethod === 'card' ? paymentData.amount * 0.029 : 0
        });

        return { success: true };
    }

    function generateConfirmationNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PMT-${timestamp}-${random}`;
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
        .form-group.has-error .form-input,
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
