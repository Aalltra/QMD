import { API } from './api.js';
import { getCurrentUser, requireAuth, showNotification, isAuthenticated } from './auth.js';

let currentBuild = {
    components: {},
    totalPrice: 0
};

export function initPCBuilder() {
    loadCategories();
    setupEventListeners();
    
    console.log('PC Builder module initialized');
}

async function loadCategories() {
    try {
        const categories = await API.categories;
        const categoriesList = document.getElementById('componentCategories');
        const categoryFilter = document.getElementById('categoryFilter');
        const itemCategorySelect = document.getElementById('itemCategory');
        
        if (!categories || categories.length === 0) {
            throw new Error('No categories found');
        }
        
        categoriesList.innerHTML = '';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category.name;
            li.setAttribute('data-category', category.id);
            li.addEventListener('click', () => selectCategory(category));
            categoriesList.appendChild(li);
        });
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option.cloneNode(true));
            
            if (itemCategorySelect) {
                itemCategorySelect.appendChild(option);
            }
        });
        
        const firstCategory = categoriesList.querySelector('li');
        if (firstCategory) {
            firstCategory.click();
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        showNotification('Failed to load component categories', 'error');
    }
}

async function selectCategory(category) {
    try {
        const categoryItems = document.querySelectorAll('#componentCategories li');
        categoryItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`#componentCategories li[data-category="${category.id}"]`).classList.add('active');
        
        document.getElementById('currentCategory').textContent = category.name;
        
        const components = await API.getComponentsByCategory(category.id);
        const componentItems = document.getElementById('componentItems');
        
        componentItems.innerHTML = '';
        
        if (components.length === 0) {
            componentItems.innerHTML = '<p class="no-items">No components available in this category</p>';
            return;
        }
        
        components.forEach(component => {
            const componentCard = createComponentCard(component, category.id);
            componentItems.appendChild(componentCard);
        });
    } catch (error) {
        console.error('Failed to load components:', error);
        showNotification('Failed to load components', 'error');
    }
}

function createComponentCard(component, categoryId) {
    const card = document.createElement('div');
    card.className = 'component-item';
    card.setAttribute('data-component-id', component.id);
    card.setAttribute('data-category-id', categoryId);
    
    let lowestPrice = Number.MAX_VALUE;
    let vendors = component.vendors || [];
    
    if (vendors.length > 0) {
        vendors.forEach(vendor => {
            if (vendor.price < lowestPrice) {
                lowestPrice = vendor.price;
            }
        });
    } else if (component.price) {
        lowestPrice = component.price;
    } else {
        lowestPrice = 0;
    }
    
    card.innerHTML = `
        <div class="component-image">
            <img src="${component.image || 'https://via.placeholder.com/150?text=No+Image'}" alt="${component.name}">
        </div>
        <h4>${component.name}</h4>
        <div class="price">$${lowestPrice.toFixed(2)}</div>
    `;
    
    card.addEventListener('click', () => showComponentDetails(component, categoryId));
    
    return card;
}

function showComponentDetails(component, categoryId) {
    const modal = document.getElementById('componentModal');
    const componentDetail = document.getElementById('componentDetail');
    
    let vendorsHtml = '<p>No vendors available</p>';
    if (component.vendors && component.vendors.length > 0) {
        vendorsHtml = '<div class="vendor-list">';
        component.vendors.forEach(vendor => {
            vendorsHtml += `
                <div class="vendor-item">
                    <span class="vendor-name">${vendor.name}</span>
                    <span class="vendor-price">$${vendor.price.toFixed(2)}</span>
                    <button class="select-vendor" data-vendor="${vendor.id}">Select</button>
                </div>
            `;
        });
        vendorsHtml += '</div>';
    }
    
    let specsHtml = '<p>No specifications available</p>';
    if (component.specs && Object.keys(component.specs).length > 0) {
        specsHtml = '<div class="specs-list">';
        for (const [key, value] of Object.entries(component.specs)) {
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">${key}:</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
        }
        specsHtml += '</div>';
    }
    
    componentDetail.innerHTML = `
        <div class="component-image">
            <img src="${component.image || 'https://via.placeholder.com/300?text=No+Image'}" alt="${component.name}">
        </div>
        <div class="component-info">
            <h3>${component.name}</h3>
            
            <div class="component-specs">
                <h4>Specifications</h4>
                ${specsHtml}
            </div>
            
            <div class="component-vendors">
                <h4>Vendors</h4>
                ${vendorsHtml}
            </div>
            
            <div class="component-actions">
                <button id="addToBuildBtn" data-component-id="${component.id}" data-category-id="${categoryId}">
                    Add to Build
                </button>
                
                <div class="component-rating">
                    <div class="rating-stars">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                        <i class="far fa-star"></i>
                    </div>
                    <span class="rating-count">(12 reviews)</span>
                </div>
            </div>
            
            <div class="component-reviews">
                <h4>Reviews</h4>
                <div id="reviewsList">
                    <div class="review-item">
                        <div class="review-header">
                            <span class="review-author">John Doe</span>
                            <span class="review-date">2023-05-15</span>
                        </div>
                        <div class="rating-stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="far fa-star"></i>
                        </div>
                        <div class="review-content">
                            Great component, works perfectly in my build!
                        </div>
                    </div>
                </div>
                
                <div class="add-review">
                    <h4>Add Review</h4>
                    <form id="reviewForm">
                        <div class="form-group">
                            <label for="reviewRating">Rating</label>
                            <select id="reviewRating" required>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="reviewComment">Comment</label>
                            <textarea id="reviewComment" rows="3" required></textarea>
                        </div>
                        <button type="submit" id="submitReviewBtn">Submit Review</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    document.getElementById('addToBuildBtn').addEventListener('click', () => {
        addComponentToBuild(component, categoryId);
        modal.style.display = 'none';
    });
    
    const selectVendorButtons = document.querySelectorAll('.select-vendor');
    selectVendorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const vendorId = button.getAttribute('data-vendor');
            const vendor = component.vendors.find(v => v.id === vendorId);
            if (vendor) {
                addComponentToBuild({...component, selectedVendor: vendor}, categoryId);
                modal.style.display = 'none';
            }
        });
    });
    
    const reviewForm = document.getElementById('reviewForm');
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        requireAuth(() => {
            const rating = document.getElementById('reviewRating').value;
            const comment = document.getElementById('reviewComment').value;
            submitReview(component.id, rating, comment);
        });
    });
}

function addComponentToBuild(component, categoryId) {
    currentBuild.components[categoryId] = {
        component: component,
        categoryId: categoryId
    };
    
    updateBuildList();
    
    showNotification(`Added ${component.name} to your build`, 'success');
}

function updateBuildList() {
    const buildList = document.getElementById('buildList');
    buildList.innerHTML = '';
    
    let totalPrice = 0;
    let hasComponents = false;
    
    for (const categoryId in currentBuild.components) {
        const item = currentBuild.components[categoryId];
        hasComponents = true;
        
        const componentPrice = item.component.selectedVendor ? 
            item.component.selectedVendor.price : 
            (item.component.vendors && item.component.vendors.length > 0 ? 
                item.component.vendors[0].price : item.component.price || 0);
        
        totalPrice += componentPrice;
        
        const buildItem = document.createElement('div');
        buildItem.className = 'build-item';
        buildItem.innerHTML = `
            <div class="build-item-info">
                <h4>${item.component.name}</h4>
                <div class="build-item-category">${getCategoryName(categoryId)}</div>
            </div>
            <div class="build-item-price">$${componentPrice.toFixed(2)}</div>
            <button class="remove-item" data-category="${categoryId}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        buildList.appendChild(buildItem);
    }
    
    if (!hasComponents) {
        buildList.innerHTML = '<p class="no-items">No components selected</p>';
    }
    
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
    
    document.getElementById('saveBuildBtn').disabled = !hasComponents;
    document.getElementById('shareBuildBtn').disabled = !hasComponents;
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-category');
            removeComponentFromBuild(categoryId);
        });
    });
    
    currentBuild.totalPrice = totalPrice;
}

function removeComponentFromBuild(categoryId) {
    delete currentBuild.components[categoryId];
    
    updateBuildList();
    
    showNotification(`Removed ${getCategoryName(categoryId)} from your build`, 'info');
}

function getCategoryName(categoryId) {
    const category = API.categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
}

async function submitReview(componentId, rating, comment) {
    try {
        if (!isAuthenticated()) {
            showNotification('Please log in to submit a review', 'warning');
            return;
        }
        
        const user = getCurrentUser();
        await API.addReview(componentId, user.id, parseInt(rating), comment);
        
        showNotification('Review submitted successfully', 'success');
        
        document.getElementById('reviewComment').value = '';
        
    } catch (error) {
        console.error('Failed to submit review:', error);
        showNotification('Failed to submit review', 'error');
    }
}

async function saveBuild() {
    try {
        if (!isAuthenticated()) {
            showNotification('Please log in to save your build', 'warning');
            document.getElementById('loginBtn').click();
            return;
        }
        
        const user = getCurrentUser();
        
        const buildName = prompt('Enter a name for your build:', 'My Custom Build');
        if (!buildName) return;
        
        const buildComponents = {};
        for (const categoryId in currentBuild.components) {
            const item = currentBuild.components[categoryId];
            buildComponents[categoryId] = {
                componentId: item.component.id,
                componentName: item.component.name,
                vendorId: item.component.selectedVendor ? item.component.selectedVendor.id : null,
                vendorName: item.component.selectedVendor ? item.component.selectedVendor.name : null,
                price: item.component.selectedVendor ? 
                    item.component.selectedVendor.price : 
                    (item.component.price || 0)
            };
        }
        
        const savedBuild = await API.saveBuild(user.id, buildName, buildComponents);
        
        showNotification('Build saved successfully', 'success');
        
        document.querySelector('nav a[data-page="saved"]').click();
    } catch (error) {
        console.error('Failed to save build:', error);
        showNotification('Failed to save build', 'error');
    }
}

function shareBuild() {
    if (Object.keys(currentBuild.components).length === 0) {
        showNotification('Add components to your build before sharing', 'warning');
        return;
    }
    
    const shareLink = window.location.origin + '/share?build=' + btoa(JSON.stringify(currentBuild));
    
    const modal = document.getElementById('shareBuildModal');
    document.getElementById('buildShareLink').value = shareLink;
    modal.style.display = 'block';
    
    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const linkInput = document.getElementById('buildShareLink');
        linkInput.select();
        document.execCommand('copy');
        showNotification('Link copied to clipboard', 'success');
    });
    
    document.querySelector('.share-btn.facebook').addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
    });
    
    document.querySelector('.share-btn.twitter').addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('Check out my custom PC build!')}`, '_blank');
    });
    
    document.querySelector('.share-btn.reddit').addEventListener('click', () => {
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(shareLink)}&title=${encodeURIComponent('Check out my custom PC build!')}`, '_blank');
    });
}

function setupEventListeners() {
    document.getElementById('saveBuildBtn').addEventListener('click', () => {
        requireAuth(saveBuild);
    });
    
    document.getElementById('shareBuildBtn').addEventListener('click', shareBuild);
    
    document.getElementById('clearBuildBtn').addEventListener('click', () => {
        currentBuild.components = {};
        updateBuildList();
        showNotification('Build cleared', 'info');
    });
    
    const searchInput = document.querySelector('#componentSearch input');
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const components = document.querySelectorAll('.component-item');
        
        components.forEach(component => {
            const name = component.querySelector('h4').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                component.style.display = '';
            } else {
                component.style.display = 'none';
            }
        });
    });
}