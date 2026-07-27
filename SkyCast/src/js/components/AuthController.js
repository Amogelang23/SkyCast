import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { registerUser, loginWithGoogle } from '../firebase/auth.js';

export class AuthController {
    constructor() {
        // Form Elements
        this.loginForm = document.getElementById('form-login');
        this.registerForm = document.getElementById('form-register');
        this.forgotForm = document.getElementById('form-forgot');
        
        // Header Elements
        this.authTitle = document.getElementById('auth-title');
        this.authSubtitle = document.getElementById('auth-subtitle');

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
    }

    checkAuthState() {
        // If a user is already logged in, instantly route them to the dashboard
        onAuthStateChanged(auth, (user) => {
            if (user) {
                window.location.replace('/');
            }
        });
    }

    bindEvents() {
        // --- Form Navigation Toggles ---
        document.getElementById('link-register').addEventListener('click', () => this.switchForm('register'));
        document.getElementById('link-login-from-reg').addEventListener('click', () => this.switchForm('login'));
        document.getElementById('link-forgot').addEventListener('click', () => this.switchForm('forgot'));
        document.getElementById('link-login-from-forgot').addEventListener('click', () => this.switchForm('login'));

        // --- Submissions ---
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        
        // Google Sign In
        document.getElementById('btn-google-login').addEventListener('click', () => this.handleGoogleLogin());
    }

    switchForm(formType) {
        // Hide all forms and clear errors
        this.loginForm.classList.add('hidden');
        this.registerForm.classList.add('hidden');
        this.forgotForm.classList.add('hidden');
        this.clearErrors();

        // Reveal requested form and update headers
        if (formType === 'login') {
            this.loginForm.classList.remove('hidden');
            this.authTitle.textContent = 'Welcome Back';
            this.authSubtitle.textContent = 'Sign in to sync your weather insights.';
        } else if (formType === 'register') {
            this.registerForm.classList.remove('hidden');
            this.authTitle.textContent = 'Create Account';
            this.authSubtitle.textContent = 'Join Aero to save your favorite locations.';
        } else if (formType === 'forgot') {
            this.forgotForm.classList.remove('hidden');
            this.authTitle.textContent = 'Reset Password';
            this.authSubtitle.textContent = 'We will send you a reset link.';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.clearErrors();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = this.loginForm.querySelector('button[type="submit"]');
        
        this.setLoading(btn, true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirection is handled automatically by checkAuthState()
        } catch (error) {
            this.showError(this.loginForm, this.getFriendlyErrorMessage(error.code));
            this.setLoading(btn, false, 'Sign In');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.clearErrors();

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = this.registerForm.querySelector('button[type="submit"]');

        if (password.length < 8) {
            this.showError(this.registerForm, 'Password must be at least 8 characters.');
            return;
        }

        this.setLoading(btn, true);

        try {
            const user = await registerUser(email, password);
            
            // Update the display name in Firebase Auth
            await updateProfile(user, { displayName: name });
            
            // Redirection handled by checkAuthState()
        } catch (error) {
            this.showError(this.registerForm, this.getFriendlyErrorMessage(error.code));
            this.setLoading(btn, false, 'Create Account');
        }
    }

    async handleGoogleLogin() {
        this.clearErrors();
        const btn = document.getElementById('btn-google-login');
        const originalContent = btn.innerHTML;
        
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting...`;
        btn.disabled = true;

        try {
            await loginWithGoogle();
            // Redirection handled by checkAuthState()
        } catch (error) {
            // Usually triggered if the user closes the popup
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        this.clearErrors();

        const email = document.getElementById('reset-email').value;
        const btn = this.forgotForm.querySelector('button[type="submit"]');

        this.setLoading(btn, true);

        try {
            await sendPasswordResetEmail(auth, email);
            this.showSuccess(this.forgotForm, 'Password reset link sent! Check your inbox.');
            this.setLoading(btn, false, 'Send Reset Link');
            document.getElementById('reset-email').value = ''; // Clear input
        } catch (error) {
            this.showError(this.forgotForm, this.getFriendlyErrorMessage(error.code));
            this.setLoading(btn, false, 'Send Reset Link');
        }
    }

    // --- UI Helpers ---

    setLoading(button, isLoading, originalText = '') {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Please wait...`;
        } else {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    showError(formElement, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-message error-message';
        errorDiv.style.color = '#f87171';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '8px';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = message;
        
        // Insert right above the submit button
        const btn = formElement.querySelector('button[type="submit"]');
        formElement.insertBefore(errorDiv, btn);
    }

    showSuccess(formElement, message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'form-message success-message';
        successDiv.style.color = '#4ade80';
        successDiv.style.fontSize = '0.85rem';
        successDiv.style.marginTop = '8px';
        successDiv.style.textAlign = 'center';
        successDiv.textContent = message;
        
        const btn = formElement.querySelector('button[type="submit"]');
        formElement.insertBefore(successDiv, btn);
    }

    clearErrors() {
        document.querySelectorAll('.form-message').forEach(el => el.remove());
    }

    getFriendlyErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email': return 'Invalid email format.';
            case 'auth/user-not-found': return 'No account found with this email.';
            case 'auth/wrong-password': return 'Incorrect password.';
            case 'auth/email-already-in-use': return 'An account already exists with this email.';
            case 'auth/weak-password': return 'Password is too weak.';
            case 'auth/too-many-requests': return 'Too many failed attempts. Try again later.';
            default: return 'An error occurred. Please try again.';
        }
    }
}