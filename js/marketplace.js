import { API } from './api.js';
import { isAuthenticated, requireAuth, getCurrentUser, showNotification } from './auth.js';

export function initMarketplace() {
    setupMarketplaceEventListeners();
    loadMarketplaceListings('all');
    
    document.addEventListener('auth:login', () => {
        updateSellItemButton();
    });
    
    document.addEventListener('auth:logout', () => {
        updateSellItemButton();
    });
    
    console.log('Marketplace module initialized');
}

function setupMarketplaceEventListeners() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', () => {
        loadMarketplaceListings(categoryFilter.value);
    });
    
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    
    priceRange.addEventListener('input', () => {
        priceValue.textContent = `$${priceRange.value}`;
        filterListingsByPrice(priceRange.value);
    });
    
    const sellItemBtn = document.getElementById('sellItemBtn');
    sellItemBtn.addEventListener('click', () => {
        requireAuth(() => {
            const modal = document.getElementById('sellItemModal');
            modal.style.display = 'block';
        });
    });
    
    const itemCategory = document.getElementById('itemCategory');
    itemCategory.addEventListener('change', () => {
        loadComponentOptions(itemCategory.value);
    });
    
    const sellItemForm = document.getElementById('sellItemForm');
    sellItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        createNewListing();
    });
    
    updateSellItemButton();
}

function updateSellItemButton() {
    const sellItemBtn = document.getElementById('sellItemBtn');
    if (isAuthenticated()) {
        sellItemBtn.disabled = false;
        sellItemBtn.title = 'Sell an item';
    } else {
        sellItemBtn.disabled = true;
        sellItemBtn.title = 'Please log in to sell items';
    }
}

async function loadMarketplaceListings(categoryId) {
    try {
        const listingsContainer = document.getElementById('listingsContainer');
        listingsContainer.innerHTML = '<p>Loading listings...</p>';
        
        const listings = await API.getListingsByCategory(categoryId);
        
        if (!listings || listings.length === 0) {
            listingsContainer.innerHTML = '<p>No listings available. Be the first to sell something!</p>';
            return;
        }
        
        listingsContainer.innerHTML = '';
        
        for (const listing of listings) {
            const component = await API.getComponentById(listing.componentCategoryId, listing.componentId);
            if (!component) continue;
            
            const listingEl = createListingElement(listing, component);
            listingsContainer.appendChild(listingEl);
        }
        
        const priceRange = document.getElementById('priceRange');
        filterListingsByPrice(priceRange.value);
    } catch (error) {
        console.error('Failed to load marketplace listings:', error);
        document.getElementById('listingsContainer').innerHTML = '<p>Failed to load listings. Please try again later.</p>';
    }
}

function createListingElement(listing, component) {
    const listingEl = document.createElement('div');
    listingEl.className = 'listing-item';
    listingEl.setAttribute('data-price', listing.price);
    
    const seller = API.users.find(user => user.id === listing.userId);
    const sellerName = seller ? seller.username : 'Unknown Seller';
    
    const listedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const imageUrl = listing.images && listing.images.length > 0
        ? `https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${listing.images[0]}`
        : (component.image || 'https://via.placeholder.com/200?text=No+Image');
    
    listingEl.innerHTML = `
        <div class="listing-image">
            <img src="${imageUrl}" alt="${component.name}">
        </div>
        <div class="listing-details">
            <h3 class="listing-title">${component.name}</h3>
            <div class="listing-price">$${listing.price.toFixed(2)}</div>
            <div class="listing-condition">Condition: ${listing.condition}</div>
            <div class="listing-meta">
                <span>Seller: <a href="#" class="seller-profile-link" data-user-id="${listing.userId}">${sellerName}</a></span>
                <span>Listed: ${listedDate}</span>
            </div>
            <button class="view-listing-btn" data-listing-id="${listing.id}">View Details</button>
        </div>
    `;
    
    listingEl.querySelector('.view-listing-btn').addEventListener('click', () => {
        viewListing(listing.id);
    });
    
    listingEl.querySelector('.seller-profile-link').addEventListener('click', (e) => {
        e.preventDefault();
        const userId = e.target.getAttribute('data-user-id');
        openUserProfile(userId);
    });
    
    return listingEl;
}

function filterListingsByPrice(maxPrice) {
    const listings = document.querySelectorAll('.listing-item');
    
    listings.forEach(listing => {
        const price = parseFloat(listing.getAttribute('data-price'));
        if (price <= maxPrice) {
            listing.style.display = '';
        } else {
            listing.style.display = 'none';
        }
    });
}

async function viewListing(listingId) {
    try {
        const result = API.getListingById(listingId);
        if (!result) {
            showNotification('Listing not found', 'error');
            return;
        }
        
        const { listing, component } = result;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const seller = API.users.find(user => user.id === listing.userId);
        const sellerName = seller ? seller.username : 'Unknown Seller';
        
        const listedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let specsHtml = '<p>No specifications available</p>';
        if (component.specs && Object.keys(component.specs).length > 0) {
            specsHtml = '<ul class="specs-list">';
            for (const [key, value] of Object.entries(component.specs)) {
                specsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
            }
            specsHtml += '</ul>';
        }
        
        let imagesHtml = '';
        if (listing.images && listing.images.length > 0) {
            imagesHtml = `
                <div class="listing-images-gallery">
                    <div class="main-image">
                        <img id="mainListingImage" src="https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${listing.images[0]}" alt="${component.name}">
                    </div>
                    ${listing.images.length > 1 ? `
                        <div class="thumbnail-images">
                            ${listing.images.map((img, index) => `
                                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                                    <img src="https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${img}" alt="Thumbnail ${index+1}">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            imagesHtml = `
                <div class="listing-image">
                    <img src="${component.image || 'https://via.placeholder.com/300?text=No+Image'}" alt="${component.name}">
                </div>
            `;
        }
        
        let reputationHtml = '';
        try {
            const reputation = API.getUserReputation(listing.userId);
            reputationHtml = `
                <div class="seller-reputation">
                    <span class="reputation-positive"><i class="fas fa-thumbs-up"></i> ${reputation.positive}</span>
                    <span class="reputation-negative"><i class="fas fa-thumbs-down"></i> ${reputation.negative}</span>
                </div>
            `;
        } catch (error) {
            console.error('Failed to get seller reputation:', error);
        }
        
        modal.innerHTML = `
            <div class="modal-content listing-detail">
                <span class="close">&times;</span>
                <div class="listing-view">
                    <div class="listing-view-header">
                        <h2>${component.name}</h2>
                        <div class="listing-view-price">$${listing.price.toFixed(2)}</div>
                    </div>
                    
                    <div class="listing-view-content">
                        <div class="listing-view-image">
                            ${imagesHtml}
                        </div>
                        
                        <div class="listing-view-info">
                            <div class="listing-view-meta">
                                <p><strong>Condition:</strong> ${listing.condition}</p>
                                <div class="seller-info">
                                    <p><strong>Seller:</strong> 
                                        <a href="#" class="seller-profile-link" data-user-id="${listing.userId}">${sellerName}</a>
                                    </p>
                                    ${reputationHtml}
                                </div>
                                <p><strong>Listed:</strong> ${listedDate}</p>
                                <p><strong>Category:</strong> ${getCategoryName(listing.componentCategoryId)}</p>
                            </div>
                            
                            <div class="listing-view-description">
                                <h3>Description</h3>
                                <p>${listing.description || 'No description provided.'}</p>
                            </div>
                            
                            <div class="listing-view-specs">
                                <h3>Specifications</h3>
                                ${specsHtml}
                            </div>
                            
                            <div class="listing-view-actions">
                                <button id="contactSellerBtn" class="primary-btn">Contact Seller</button>
                                <button id="addToBuildBtn" class="secondary-btn">Add to Build</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.style.display = 'block', 10);
        
        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
        
        const contactSellerBtn = modal.querySelector('#contactSellerBtn');
        contactSellerBtn.addEventListener('click', () => {
            requireAuth(() => {
                openConversation(listing.userId, sellerName);
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            });
        });
        
        const addToBuildBtn = modal.querySelector('#addToBuildBtn');
        addToBuildBtn.addEventListener('click', () => {
            document.querySelector('nav a[data-page="builder"]').click();
            showNotification(`${component.name} added to your build`, 'success');
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('.seller-profile-link').addEventListener('click', (e) => {
            e.preventDefault();
            const userId = e.target.getAttribute('data-user-id');
            modal.style.display = 'none';
            openUserProfile(userId);
        });
        
        const thumbnails = modal.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                const imageIndex = thumbnail.getAttribute('data-image-index');
                const mainImage = modal.querySelector('#mainListingImage');
                mainImage.src = `https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${listing.images[imageIndex]}`;
                
                thumbnails.forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            }
        });
    } catch (error) {
        console.error('Failed to view listing:', error);
        showNotification('Failed to load listing details', 'error');
    }
}

function getCategoryName(categoryId) {
    const category = API.categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
}

async function createNewListing() {
    try {
        if (!isAuthenticated()) {
            showNotification('Please log in to create a listing', 'warning');
            return;
        }
        
        const categoryId = document.getElementById('itemCategory').value;
        const componentId = document.getElementById('itemComponent').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const condition = document.getElementById('itemCondition').value;
        const description = document.getElementById('itemDescription').value.trim();
        const listingImages = document.getElementById('itemImages').files;
        
        if (!categoryId || !componentId || isNaN(price) || !description) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        const user = getCurrentUser();
        
        await API.createListing(user.id, categoryId, componentId, null, price, condition, description, listingImages);
        
        showNotification('Listing created successfully', 'success');
        
        document.getElementById('sellItemModal').style.display = 'none';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemImages').value = '';
        
        loadMarketplaceListings(document.getElementById('categoryFilter').value);
    } catch (error) {
        console.error('Failed to create listing:', error);
        showNotification('Failed to create listing: ' + error.message, 'error');
    }
}

async function loadComponentOptions(categoryId) {
    try {
        const componentSelect = document.getElementById('itemComponent');
        componentSelect.innerHTML = '<option value="">Select a component</option>';
        
        if (!categoryId) return;
        
        const availableComponents = await API.getAvailableComponents();
        
        if (!availableComponents[categoryId] || availableComponents[categoryId].length === 0) {
            componentSelect.innerHTML += '<option value="" disabled>No components available</option>';
            return;
        }
        
        availableComponents[categoryId].forEach(component => {
            const option = document.createElement('option');
            option.value = component.id;
            option.textContent = component.name;
            componentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load component options:', error);
    }
}

function openConversation(userId, username) {
    console.log('Opening conversation with', username);
    requireAuth(() => {
        openMessagesModal();
        
        setTimeout(() => {
            loadConversation(userId, username);
            
            const conversationItem = document.querySelector(`.conversation-item[data-user-id="${userId}"]`);
            if (conversationItem) {
                conversationItem.classList.add('active');
            }
        }, 100);
    });
}

function openUserProfile(userId) {
    console.log('Opening profile of', userId);
}