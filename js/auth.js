import { API } from './api.js';

let currentUser = null;

export function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfile = document.querySelector('.user-profile');
    const usernameDisplay = document.getElementById('username');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const savedUser = localStorage.getItem('pcbuilder_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI(true);
        } catch (e) {
            console.error('Failed to parse saved user data', e);
            localStorage.removeItem('pcbuilder_user');
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const user = await API.loginUser(email, password);
            loginUser(user);
            closeAllModals();
            showNotification('Login successful!', 'success');
        } catch (error) {
            console.error('Login failed:', error);
            showNotification('Login failed: Invalid email or password', 'error');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const user = await API.registerUser(username, email, password);
            loginUser(user);
            closeAllModals();
            showNotification('Registration successful!', 'success');
        } catch (error) {
            console.error('Registration failed:', error);
            showNotification('Registration failed: ' + error.message, 'error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        logoutUser();
        showNotification('You have been logged out', 'info');
    });

    loginBtn.addEventListener('click', () => {
        const loginModal = document.getElementById('loginModal');
        loginModal.style.display = 'block';
    });

    registerBtn.addEventListener('click', () => {
        const registerModal = document.getElementById('registerModal');
        registerModal.style.display = 'block';
    });

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    console.log('Auth module initialized');
}

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('pcbuilder_user', JSON.stringify(user));
    updateAuthUI(true);
    
    document.dispatchEvent(new CustomEvent('auth:login', { detail: user }));
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('pcbuilder_user');
    updateAuthUI(false);
    
    document.dispatchEvent(new CustomEvent('auth:logout'));
}

function updateAuthUI(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userProfile = document.querySelector('.user-profile');
    const usernameDisplay = document.getElementById('username');

    if (isLoggedIn && currentUser) {
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        usernameDisplay.textContent = currentUser.username;
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

export function isAuthenticated() {
    return currentUser !== null;
}

export function getCurrentUser() {
    return currentUser;
}

export function requireAuth(callback) {
    if (isAuthenticated()) {
        return callback();
    } else {
        showNotification('Please log in to access this feature', 'warning');
        document.getElementById('loginBtn').click();
        return false;
    }
}