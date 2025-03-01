import { API } from './api.js';
import { isAuthenticated, getCurrentUser, showNotification } from './auth.js';

export function initSavedBuilds() {
    document.querySelector('nav a[data-page="saved"]').addEventListener('click', () => {
        loadSavedBuilds();
    });
    
    document.addEventListener('auth:login', () => {
        loadSavedBuilds();
    });
    
    document.addEventListener('auth:logout', () => {
        showLoginPrompt();
    });
    
    if (document.getElementById('saved').classList.contains('active')) {
        loadSavedBuilds();
    }
    
    console.log('Saved Builds module initialized');
}

async function loadSavedBuilds() {
    const savedBuildsContainer = document.getElementById('savedBuildsContainer');
    
    if (!isAuthenticated()) {
        showLoginPrompt();
        return;
    }
    
    try {
        savedBuildsContainer.innerHTML = '<p>Loading your saved builds...</p>';
        
        const user = getCurrentUser();
        const builds = await API.getUserBuilds(user.id);
        
        if (!builds || builds.length === 0) {
            savedBuildsContainer.innerHTML = '<p>You don\'t have any saved builds yet. Go to the PC Builder to create one!</p>';
            return;
        }
        
        builds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        savedBuildsContainer.innerHTML = '';
        builds.forEach(build => {
            const buildCard = createBuildCard(build);
            savedBuildsContainer.appendChild(buildCard);
        });
    } catch (error) {
        console.error('Failed to load saved builds:', error);
        savedBuildsContainer.innerHTML = '<p>Failed to load your saved builds. Please try again later.</p>';
    }
}

function showLoginPrompt() {
    const savedBuildsContainer = document.getElementById('savedBuildsContainer');
    
    savedBuildsContainer.innerHTML = `
        <div class="login-prompt">
            <p>Please log in to view your saved builds</p>
            <button class="login-btn">Login</button>
        </div>
    `;
    
    savedBuildsContainer.querySelector('.login-btn').addEventListener('click', () => {
        document.getElementById('loginBtn').click();
    });
}

function createBuildCard(build) {
    const buildCard = document.createElement('div');
    buildCard.className = 'saved-build-card';
    
    let totalPrice = 0;
    for (const categoryId in build.components) {
        const component = build.components[categoryId];
        if (component && component.price) {
            totalPrice += component.price;
        }
    }
    
    const createdDate = new Date(build.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    let componentsHtml = '';
    for (const categoryId in build.components) {
        const component = build.components[categoryId];
        const categoryName = getCategoryName(categoryId);
        
        if (component) {
            componentsHtml += `
                <div class="saved-component">
                    <span title="${component.componentName || 'Unknown Component'}">${categoryName}</span>
                    <span>$${component.price ? component.price.toFixed(2) : '0.00'}</span>
                </div>
            `;
        }
    }
    
    buildCard.innerHTML = `
        <div class="saved-build-header">
            <h3>${build.name}</h3>
            <div class="saved-build-date">Created on ${createdDate}</div>
        </div>
        <div class="saved-build-components">
            ${componentsHtml}
        </div>
        <div class="saved-build-footer">
            <div class="saved-build-price">$${totalPrice.toFixed(2)}</div>
            <div class="saved-build-actions">
                <button class="load-build-btn" data-build-id="${build.id}">Load</button>
                <button class="share-build-btn" data-build-id="${build.id}">Share</button>
                <button class="delete-build-btn" data-build-id="${build.id}">Delete</button>
            </div>
        </div>
    `;
    
    buildCard.querySelector('.load-build-btn').addEventListener('click', () => {
        loadBuild(build.id);
    });
    
    buildCard.querySelector('.share-build-btn').addEventListener('click', () => {
        shareBuild(build.id);
    });
    
    buildCard.querySelector('.delete-build-btn').addEventListener('click', () => {
        deleteBuild(build.id);
    });
    
    return buildCard;
}

function getCategoryName(categoryId) {
    const category = API.categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
}

function loadBuild(buildId) {
    document.querySelector('nav a[data-page="builder"]').click();
    showNotification('Build loaded', 'success');
}

function shareBuild(buildId) {
    const shareLink = window.location.origin + '/share?build=' + buildId;
    
    const modal = document.getElementById('shareBuildModal');
    document.getElementById('buildShareLink').value = shareLink;
    modal.style.display = 'block';

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const linkInput = document.getElementById('buildShareLink');
        linkInput.select();
        document.execCommand('copy');
        showNotification('Link copied to clipboard', 'success');
    });
}

function deleteBuild(buildId) {
    if (confirm('Are you sure you want to delete this build?')) {
        API.deleteBuild(buildId).then(() => {
            showNotification('Build deleted', 'info');
            loadSavedBuilds();
        }).catch(error => {
            console.error('Failed to delete build:', error);
            showNotification('Failed to delete build', 'error');
        });
    }
}