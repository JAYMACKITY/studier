// Stripe Payment Integration
// Product ID: prod_TdO6xr6OLrGCau
// Price: $4.50/month

const STRIPE_PUBLISHABLE_KEY = 'mk_1Sg7J9IzIFcUn6eSLEztJYf0'; // Replace with your Stripe publishable key
const STRIPE_PRODUCT_ID = 'prod_TdO6xr6OLrGCau';
const API_BASE_URL = '/api'; // Replace with your backend API URL

// Initialize Stripe (will be set when script loads)
let stripe = null;

// Initialize Stripe.js
function initStripe() {
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    } else {
        // Load Stripe.js if not already loaded
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = function() {
            if (typeof Stripe !== 'undefined') {
                stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            }
        };
        document.head.appendChild(script);
    }
}

// Create checkout session for premium subscription
async function createCheckoutSession(userEmail, userId) {
    try {
        // In production, this should call your backend API
        // For now, we'll use a placeholder that you'll need to implement
        
        const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                userId: userId,
                productId: STRIPE_PRODUCT_ID,
                price: 450, // $4.50 in cents
                successUrl: `${window.location.origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/pricing.html`
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const session = await response.json();
        return session;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        // Fallback: For development/testing without backend
        // You can use Stripe's test mode directly
        alert('Payment processing is being set up. Please contact support at hello@studier.me for manual subscription setup.');
        throw error;
    }
}

// Redirect to Stripe Checkout
async function redirectToCheckout(userEmail, userId) {
    try {
        if (!stripe) {
            initStripe();
            // Wait a bit for Stripe to load
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const session = await createCheckoutSession(userEmail, userId);
        
        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });

        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Error redirecting to checkout:', error);
        // For development: Show instructions
        if (error.message.includes('Failed to create checkout session')) {
            alert('Backend API endpoint not configured. Please set up your backend API endpoint in stripe.js or contact support.');
        }
    }
}

// Handle checkout success (called from checkout-success.html)
function handleCheckoutSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        // Verify the session with your backend
        verifyCheckoutSession(sessionId);
    }
}

// Verify checkout session and update user plan
async function verifyCheckoutSession(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId })
        });

        if (!response.ok) {
            throw new Error('Failed to verify session');
        }

        const data = await response.json();
        
        // Update user plan in local storage
        if (typeof getCurrentUser !== 'undefined') {
            const user = getCurrentUser();
            if (user) {
                updateUser(user.id, {
                    plan: 'premium',
                    stripeCustomerId: data.customerId,
                    stripeSubscriptionId: data.subscriptionId,
                    trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });
                
                // Update localStorage
                localStorage.setItem('studier_user', JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: 'premium',
                    provider: user.provider
                }));
            }
        }
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error verifying session:', error);
        alert('Payment verified but there was an error updating your account. Please contact support.');
    }
}

// Cancel subscription
async function cancelSubscription(userId) {
    try {
        // Get user to retrieve subscription ID
        if (typeof getCurrentUser === 'undefined') {
            throw new Error('Database functions not loaded');
        }
        
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User not found');
        }
        
        if (!user.stripeSubscriptionId) {
            throw new Error('No active subscription found');
        }

        const response = await fetch(`${API_BASE_URL}/cancel-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: userId,
                subscriptionId: user.stripeSubscriptionId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to cancel subscription');
        }

        // Update user plan
        updateUser(user.id, { plan: 'free' });
        localStorage.setItem('studier_user', JSON.stringify({
            ...user,
            plan: 'free'
        }));

        return true;
    } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStripe);
} else {
    initStripe();
}

