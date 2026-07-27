import { onAuthStateChanged, signOut, updateProfile, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { debounce } from '../utils/debounce.js';

export class ProfileController {
    constructor() {
        this.currentUser = null;

        // DOM Elements
        this.displayNameInput = document.getElementById('display-name');
        this.emailInput = document.getElementById('email-address');
        this.defaultCityInput = document.getElementById('default-city');
        this.themeSwitch = document.getElementById('theme-switch');
        this.unitRadios = document.getElementsByName('units');
        
        this.btnLogout = document.getElementById('btn-logout');
        this.btnDelete = document.getElementById('btn-delete-account');

        this.init();
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(user);
                this.bindEvents();
            } else {
                window.location.replace('/auth.html');
            }
        });
    }

    async loadUserData(user) {
        try {
            this.emailInput.value = user.email;
            this.displayNameInput.value = user.displayName || '';

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                const settings = data.settings || {};

                if (settings.defaultCity) {
                    this.defaultCityInput.value = settings.defaultCity;
                }

                if (settings.units === 'imperial') {
                    document.getElementById('unit-f').checked = true;
                } else {
                    document.getElementById('unit-c').checked = true;
                }

                const isDark = settings.theme === 'dark';
                this.themeSwitch.checked = isDark;
                this.applyTheme(settings.theme);
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }

    bindEvents() {
        const debouncedSaveName = debounce((val) => this.updateDisplayName(val), 800);
        const debouncedSaveCity = debounce((val) => this.saveSetting('defaultCity', val), 800);

        this.displayNameInput.addEventListener('input', (e) => debouncedSaveName(e.target.value.trim()));
        this.defaultCityInput.addEventListener('input', (e) => debouncedSaveCity(e.target.value.trim()));

        this.themeSwitch.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            this.applyTheme(newTheme);
            this.saveSetting('theme', newTheme);
        });

        this.unitRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.saveSetting('units', e.target.value);
                }
            });
        });

        // Danger Zone Actions
        this.btnLogout.addEventListener('click', () => this.handleLogout());
        this.btnDelete.addEventListener('click', () => this.handleDeleteAccount());
    }

    async updateDisplayName(newName) {
        if (!newName || newName === this.currentUser.displayName) return;

        try {
            // Update Firebase Auth Profile
            await updateProfile(this.currentUser, { displayName: newName });
            
            // Sync with Firestore document
            const userRef = doc(db, 'users', this.currentUser.uid);
            await updateDoc(userRef, { displayName: newName });
            
            console.log("Display name updated successfully.");
        } catch (error) {
            console.error("Failed to update display name:", error);
        }
    }

    async saveSetting(settingKey, value) {
        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                [`settings.${settingKey}`]: value
            });
            console.log(`${settingKey} saved as ${value}`);
        } catch (error) {
            console.error(`Failed to save ${settingKey}:`, error);
        }
    }

    applyTheme(theme) {
        // Instantly update the UI and local storage for immediate feedback
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Handle custom slider dot animation
        const sliderDot = document.querySelector('.slider-dot');
        const sliderBg = document.querySelector('.slider.round');
        
        if (theme === 'dark') {
            sliderDot.style.transform = 'translateX(24px)';
            sliderBg.style.backgroundColor = 'rgba(255,255,255,0.2)';
        } else {
            sliderDot.style.transform = 'translateX(0px)';
            sliderBg.style.backgroundColor = 'rgba(0,0,0,0.2)';
        }
    }

    async handleLogout() {
        try {
            await signOut(auth);
            // Redirection is handled automatically by the auth state listener in init()
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    async handleDeleteAccount() {
        const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone and will erase all your saved locations.");
        
        if (!confirmDelete) return;

        try {
            // 1. Delete user document from Firestore
            const userRef = doc(db, 'users', this.currentUser.uid);
            await deleteDoc(userRef);

            // 2. Delete user from Firebase Auth
            await deleteUser(this.currentUser);
            
            alert("Account deleted successfully.");
            window.location.replace('/auth.html');
        } catch (error) {
            console.error("Account deletion failed:", error);
            // If it fails, they likely need to re-authenticate (Firebase security rule)
            if (error.code === 'auth/requires-recent-login') {
                alert("For security reasons, please log out and log back in before deleting your account.");
            } else {
                alert("Failed to delete account. Please try again later.");
            }
        }
    }
}