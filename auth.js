// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait for database to be available
    function initAuth() {
        if (typeof getCurrentUser === 'undefined' || typeof createUser === 'undefined') {
            // Database not loaded yet, wait a bit
            setTimeout(initAuth, 100);
            return;
        }
        
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const googleSignIn = document.getElementById('googleSignIn');
        const googleSignUp = document.getElementById('googleSignUp');

    // Initialize Google Sign-In
    function initGoogleSignIn() {
        // Load Google Identity Services library
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
                callback: handleGoogleSignIn
            });
        } else {
            // Fallback: Load the script if not already loaded
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = function() {
                if (google && google.accounts) {
                    google.accounts.id.initialize({
                        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
                        callback: handleGoogleSignIn
                    });
                }
            };
            document.head.appendChild(script);
        }
    }

    // Handle Google Sign-In response
    function handleGoogleSignIn(response) {
        if (response.credential) {
            // Decode the JWT token (you'll need a JWT library or decode it on the backend)
            // For now, we'll simulate the authentication
            try {
                // In production, send this to your backend to verify and decode
                // For now, we'll just store it and redirect
                // Decode JWT token to get user info
                // In production, verify this on the backend
                try {
                    const payload = JSON.parse(atob(response.credential.split('.')[1]));
                    let user = findUserByEmail(payload.email);
                    
                    if (!user) {
                        user = createUser({
                            name: payload.name,
                            email: payload.email,
                            password: '',
                            provider: 'google',
                            plan: 'free'
                        });
                    }
                    
                    const sessionId = createSession(user.id);
                    
                    localStorage.setItem('studier_user', JSON.stringify({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        plan: user.plan,
                        provider: 'google'
                    }));
                    
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    console.error('Error decoding Google token:', error);
                    alert('Error signing in with Google. Please try again.');
                }
            } catch (error) {
                console.error('Error handling Google sign-in:', error);
                alert('Error signing in with Google. Please try again.');
            }
        }
    }

    // Reusable Google OAuth function
    function handleGoogleOAuth() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.oauth2.initTokenClient({
                client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
                scope: 'email profile',
                callback: function(response) {
                    if (response.access_token) {
                        // Fetch user info
                        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                            headers: {
                                'Authorization': 'Bearer ' + response.access_token
                            }
                        })
                        .then(res => res.json())
                        .then(data => {
                            // Check if user exists, if not create one
                            let user = findUserByEmail(data.email);
                            if (!user) {
                                user = createUser({
                                    name: data.name,
                                    email: data.email,
                                    password: '', // No password for Google users
                                    provider: 'google',
                                    plan: 'free'
                                });
                            }
                            
                            // Create session
                            const sessionId = createSession(user.id);
                            
                            localStorage.setItem('studier_user', JSON.stringify({
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                plan: user.plan,
                                provider: 'google'
                            }));
                            window.location.href = 'dashboard.html';
                        })
                        .catch(error => {
                            console.error('Error fetching user info:', error);
                            alert('Error signing in with Google. Please try again.');
                        });
                    }
                }
            }).requestAccessToken();
        } else {
            // Fallback: Show message that Google Sign-In needs to be configured
            alert('Google Sign-In is being set up. Please use email/password for now, or configure your Google Client ID in auth.js');
        }
    }

    // Google Sign-In button handlers
    if (googleSignIn) {
        googleSignIn.addEventListener('click', handleGoogleOAuth);
    }

    if (googleSignUp) {
        googleSignUp.addEventListener('click', handleGoogleOAuth);
    }

        // Handle login
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const remember = document.getElementById('remember').checked;

                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';

                try {
                    // Authenticate user
                    const user = authenticateUser(email, password);
                    
                    // Create session
                    const sessionId = createSession(user.id);
                    
                    // Store user data for easy access
                    localStorage.setItem('studier_user', JSON.stringify({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        plan: user.plan,
                        provider: user.provider
                    }));
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    alert(error.message || 'Login failed. Please check your credentials.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }

        // Handle signup
        if (signupForm) {
            signupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const terms = document.getElementById('terms').checked;

                if (!terms) {
                    alert('Please agree to the Terms of Service and Privacy Policy');
                    return;
                }

                // Show loading state
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';

                try {
                    // Determine plan (check URL params or form selection)
                    const urlParams = new URLSearchParams(window.location.search);
                    const planParam = urlParams.get('plan');
                    const planRadio = document.querySelector('input[name="plan"]:checked');
                    const plan = planParam || (planRadio ? planRadio.value : 'free');
                    
                    // Create user
                    const user = createUser({
                        name: name,
                        email: email,
                        password: password,
                        plan: plan
                    });
                    
                    // Create session
                    const sessionId = createSession(user.id);
                    
                    // Store user data for easy access
                    localStorage.setItem('studier_user', JSON.stringify({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        plan: user.plan,
                        provider: user.provider
                    }));
                    
                    // If premium plan selected, redirect to Stripe checkout
                    if (plan === 'premium' && typeof redirectToCheckout !== 'undefined') {
                        redirectToCheckout(user.email, user.id);
                    } else {
                        // Redirect to dashboard
                        window.location.href = 'dashboard.html';
                    }
                } catch (error) {
                    alert(error.message || 'Signup failed. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }

        // Check if user is logged in (for protected pages)
        function checkAuth() {
            const currentPage = window.location.pathname;
            const protectedPages = ['dashboard.html', 'settings.html'];
            
            if (protectedPages.some(page => currentPage.includes(page))) {
                const user = getCurrentUser();
                if (!user) {
                    window.location.href = 'login.html';
                    return;
                }
                
                // Update localStorage for compatibility
                localStorage.setItem('studier_user', JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                    provider: user.provider
                }));
            }
        }

        // Initialize Google Sign-In
        initGoogleSignIn();

        // Run auth check
        checkAuth();
    }
    
    // Start initialization
    initAuth();
});

