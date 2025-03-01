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
        const profileImage = document.getElementById('regProfileImage').files[0];

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const user = await API.registerUser(username, email, password, profileImage);
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

    userProfile.addEventListener('click', (e) => {
        if (isAuthenticated()) {
            const dropdown = document.createElement('div');
            dropdown.className = 'profile-dropdown';
            dropdown.innerHTML = `
                <ul>
                    <li><a href="#" id="viewProfileBtn">View Profile</a></li>
                    <li><a href="#" id="editProfileBtn">Edit Profile</a></li>
                    <li><a href="#" id="myMessagesBtn">My Messages</a></li>
                    <li><a href="#" id="logoutMenuBtn">Logout</a></li>
                </ul>
            `;
            document.body.appendChild(dropdown);
            
            const rect = userProfile.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
            
            dropdown.querySelector('#viewProfileBtn').addEventListener('click', (e) => {
                e.preventDefault();
                openUserProfile(currentUser.id);
                removeDropdown();
            });
            
            dropdown.querySelector('#editProfileBtn').addEventListener('click', (e) => {
                e.preventDefault();
                openEditProfileModal();
                removeDropdown();
            });
            
            dropdown.querySelector('#myMessagesBtn').addEventListener('click', (e) => {
                e.preventDefault();
                openMessagesModal();
                removeDropdown();
            });
            
            dropdown.querySelector('#logoutMenuBtn').addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                showNotification('You have been logged out', 'info');
                removeDropdown();
            });
            
            const removeDropdown = () => {
                dropdown.remove();
                document.removeEventListener('click', outsideClickHandler);
            };
            
            const outsideClickHandler = (event) => {
                if (!dropdown.contains(event.target) && !userProfile.contains(event.target)) {
                    removeDropdown();
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', outsideClickHandler);
            }, 10);
        }
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

function openUserProfile(userId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'userProfileModal';
    
    modal.innerHTML = `
        <div class="modal-content user-profile-modal">
            <span class="close">&times;</span>
            <div id="profileContent">
                <p>Loading profile...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    loadUserProfile(userId);
    
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });
}

async function loadUserProfile(userId) {
    try {
        const profile = await API.getUserProfile(userId);
        const profileContent = document.getElementById('profileContent');
        
        const getImageUrl = (imageName) => {
            if (!imageName) return 'https://via.placeholder.com/150?text=No+Image';
            return `https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${imageName}`;
        };
        
        profileContent.innerHTML = `
            <div class="user-profile-view">
                ${profile.profileBanner ? 
                    `<div class="profile-banner">
                        <img src="${getImageUrl(profile.profileBanner)}" alt="Profile Banner">
                    </div>` : 
                    `<div class="profile-banner default-banner"></div>`
                }
                
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="${getImageUrl(profile.profileImage)}" alt="${profile.username}">
                    </div>
                    <h2>${profile.username}</h2>
                    <div class="profile-stats">
                        <div class="stat">
                            <span class="stat-value">${profile.reputation.positive}</span>
                            <span class="stat-label">Positive</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${profile.reputation.negative}</span>
                            <span class="stat-label">Negative</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${profile.stats.builds}</span>
                            <span class="stat-label">Builds</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${profile.stats.listings}</span>
                            <span class="stat-label">Listings</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-info">
                    ${profile.bio ? `<div class="profile-bio">${profile.bio}</div>` : ''}
                    ${profile.location ? `<div class="profile-location"><i class="fas fa-map-marker-alt"></i> ${profile.location}</div>` : ''}
                    <div class="profile-joined"><i class="fas fa-calendar-alt"></i> Joined ${new Date(profile.createdAt).toLocaleDateString()}</div>
                </div>
                
                ${currentUser && currentUser.id !== profile.id ? `
                    <div class="profile-actions">
                        <button id="contactUserBtn" class="primary-btn"><i class="fas fa-envelope"></i> Contact</button>
                        <button id="rateUserBtn" class="secondary-btn"><i class="fas fa-star"></i> Rate User</button>
                    </div>
                ` : ''}
                
                <div class="profile-tabs">
                    <div class="tab-headers">
                        <div class="tab-header active" data-tab="reputation">Reputation</div>
                        <div class="tab-header" data-tab="listings">Marketplace Listings</div>
                        <div class="tab-header" data-tab="builds">Saved Builds</div>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-pane active" id="tab-reputation">
                            <h3>User Reputation</h3>
                            ${profile.reputation.feedbacks.length === 0 ?
                                '<p>No reputation feedback yet.</p>' :
                                `<div class="reputation-list">
                                    ${profile.reputation.feedbacks.map(feedback => `
                                        <div class="reputation-item ${feedback.type}">
                                            <div class="reputation-header">
                                                <span class="reputation-author">${feedback.username}</span>
                                                <span class="reputation-date">${new Date(feedback.createdAt).toLocaleDateString()}</span>
                                                <span class="reputation-type ${feedback.type}">
                                                    <i class="fas fa-${feedback.type === 'positive' ? 'thumbs-up' : 'thumbs-down'}"></i>
                                                </span>
                                            </div>
                                            <div class="reputation-comment">${feedback.comment}</div>
                                        </div>
                                    `).join('')}
                                </div>`
                            }
                        </div>
                        
                        <div class="tab-pane" id="tab-listings">
                            <h3>Marketplace Listings</h3>
                            <div id="profileListings">Loading...</div>
                        </div>
                        
                        <div class="tab-pane" id="tab-builds">
                            <h3>Saved Builds</h3>
                            <div id="profileBuilds">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.tab-header').forEach(tabHeader => {
            tabHeader.addEventListener('click', () => {
                document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
                tabHeader.classList.add('active');
                
                const tabName = tabHeader.getAttribute('data-tab');
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                document.getElementById(`tab-${tabName}`).classList.add('active');
                
                if (tabName === 'listings') {
                    loadUserListings(profile.id);
                } else if (tabName === 'builds') {
                    loadUserBuilds(profile.id);
                }
            });
        });
        
        if (currentUser && currentUser.id !== profile.id) {
            document.getElementById('contactUserBtn').addEventListener('click', () => {
                openConversation(profile.id, profile.username);
            });
            
            document.getElementById('rateUserBtn').addEventListener('click', () => {
                openRateUserModal(profile.id, profile.username);
            });
        }
        
    } catch (error) {
        console.error('Failed to load user profile:', error);
        document.getElementById('profileContent').innerHTML = '<p>Failed to load profile. Please try again later.</p>';
    }
}

async function loadUserListings(userId) {
    const listingsContainer = document.getElementById('profileListings');
    try {
        const listings = await API.getUserListings(userId);
        
        if (!listings || listings.length === 0) {
            listingsContainer.innerHTML = '<p>No marketplace listings found.</p>';
            return;
        }
        
        const listingsHTML = [];
        for (const listing of listings) {
            if (listing.status !== 'active') continue;
            
            const component = await API.getComponentById(listing.componentCategoryId, listing.componentId);
            const listingImageSrc = listing.images && listing.images.length > 0 ?
                `https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${listing.images[0]}` :
                (component?.image || 'https://via.placeholder.com/100?text=No+Image');
                
            listingsHTML.push(`
                <div class="profile-listing-item">
                    <div class="listing-image">
                        <img src="${listingImageSrc}" alt="${component?.name || 'Component'}">
                    </div>
                    <div class="listing-details">
                        <h4>${component?.name || 'Unknown Component'}</h4>
                        <div class="listing-price">$${listing.price.toFixed(2)}</div>
                        <div class="listing-condition">${listing.condition}</div>
                        <button class="view-listing-btn" data-listing-id="${listing.id}">View Details</button>
                    </div>
                </div>
            `);
        }
        
        if (listingsHTML.length === 0) {
            listingsContainer.innerHTML = '<p>No active marketplace listings found.</p>';
        } else {
            listingsContainer.innerHTML = `<div class="profile-listings-grid">${listingsHTML.join('')}</div>`;
            
            document.querySelectorAll('.view-listing-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const listingId = btn.getAttribute('data-listing-id');
                    document.getElementById('userProfileModal').style.display = 'none';
                    viewListing(listingId);
                });
            });
        }
    } catch (error) {
        console.error('Failed to load user listings:', error);
        listingsContainer.innerHTML = '<p>Failed to load listings. Please try again later.</p>';
    }
}

async function loadUserBuilds(userId) {
    const buildsContainer = document.getElementById('profileBuilds');
    try {
        const builds = await API.getUserBuilds(userId);
        
        if (!builds || builds.length === 0) {
            buildsContainer.innerHTML = '<p>No saved builds found.</p>';
            return;
        }
        
        const buildsHTML = builds.map(build => {
            let totalPrice = 0;
            for (const categoryId in build.components) {
                totalPrice += build.components[categoryId].price;
            }
            
            return `
                <div class="profile-build-item">
                    <h4>${build.name}</h4>
                    <div class="build-meta">
                        <span>Components: ${Object.keys(build.components).length}</span>
                        <span>Total: $${totalPrice.toFixed(2)}</span>
                    </div>
                    <div class="build-date">Created: ${new Date(build.createdAt).toLocaleDateString()}</div>
                    <button class="view-build-btn" data-build-id="${build.id}">View Build</button>
                </div>
            `;
        }).join('');
        
        buildsContainer.innerHTML = `<div class="profile-builds-grid">${buildsHTML}</div>`;
        
        document.querySelectorAll('.view-build-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const buildId = btn.getAttribute('data-build-id');
                document.getElementById('userProfileModal').style.display = 'none';
                document.querySelector('nav a[data-page="builder"]').click();
                showNotification('Build loading feature to be implemented', 'info');
            });
        });
    } catch (error) {
        console.error('Failed to load user builds:', error);
        buildsContainer.innerHTML = '<p>Failed to load builds. Please try again later.</p>';
    }
}

function openEditProfileModal() {
    if (!isAuthenticated()) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editProfileModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Profile</h2>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="profileBio">Bio</label>
                    <textarea id="profileBio" rows="4" placeholder="Tell us about yourself">${currentUser.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="profileLocation">Location</label>
                    <input type="text" id="profileLocation" placeholder="City, Country" value="${currentUser.location || ''}">
                </div>
                <div class="form-group">
                    <label for="profileImage">Profile Picture</label>
                    <input type="file" id="profileImage" accept="image/*">
                    <div class="current-image">
                        ${currentUser.profileImage ? 
                            `<img src="https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${currentUser.profileImage}" alt="Current profile picture">` : 
                            '<p>No profile picture set</p>'}
                    </div>
                </div>
                <div class="form-group">
                    <label for="profileBanner">Profile Banner</label>
                    <input type="file" id="profileBanner" accept="image/*">
                    <div class="current-banner">
                        ${currentUser.profileBanner ? 
                            `<img src="https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${currentUser.profileBanner}" alt="Current banner">` : 
                            '<p>No banner set</p>'}
                    </div>
                </div>
                <div class="form-group">
                    <label>Social Links</label>
                    <div class="social-links">
                        <div class="social-link">
                            <label for="socialTwitter">Twitter</label>
                            <input type="text" id="socialTwitter" placeholder="Twitter username" value="${currentUser.socialLinks?.twitter || ''}">
                        </div>
                        <div class="social-link">
                            <label for="socialGithub">GitHub</label>
                            <input type="text" id="socialGithub" placeholder="GitHub username" value="${currentUser.socialLinks?.github || ''}">
                        </div>
                        <div class="social-link">
                            <label for="socialLinkedin">LinkedIn</label>
                            <input type="text" id="socialLinkedin" placeholder="LinkedIn profile" value="${currentUser.socialLinks?.linkedin || ''}">
                        </div>
                    </div>
                </div>
                <button type="submit" class="primary-btn">Save Changes</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });
    
    const form = document.getElementById('editProfileForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const profileData = {
                bio: document.getElementById('profileBio').value,
                location: document.getElementById('profileLocation').value,
                profileImage: document.getElementById('profileImage').files[0],
                profileBanner: document.getElementById('profileBanner').files[0],
                socialLinks: {
                    twitter: document.getElementById('socialTwitter').value,
                    github: document.getElementById('socialGithub').value,
                    linkedin: document.getElementById('socialLinkedin').value
                }
            };
            
            const updatedUser = await API.updateUserProfile(currentUser.id, profileData);
            
            currentUser = updatedUser;
            localStorage.setItem('pcbuilder_user', JSON.stringify(currentUser));
            
            showNotification('Profile updated successfully', 'success');
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification('Failed to update profile', 'error');
        }
    });
}

function openRateUserModal(userId, username) {
    if (!isAuthenticated()) {
        showNotification('Please log in to rate users', 'warning');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rateUserModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Rate ${username}</h2>
            <form id="rateUserForm">
                <input type="hidden" id="rateUserId" value="${userId}">
                
                <div class="form-group rating-type">
                    <label>Rating Type</label>
                    <div class="rating-options">
                        <label class="rating-option">
                            <input type="radio" name="ratingType" value="positive" checked>
                            <span class="rating-icon positive"><i class="fas fa-thumbs-up"></i></span>
                            <span>Positive</span>
                        </label>
                        <label class="rating-option">
                            <input type="radio" name="ratingType" value="negative">
                            <span class="rating-icon negative"><i class="fas fa-thumbs-down"></i></span>
                            <span>Negative</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="ratingComment">Comment (required)</label>
                    <textarea id="ratingComment" rows="4" placeholder="Explain your rating" required></textarea>
                </div>
                
                <button type="submit" class="primary-btn">Submit Rating</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });
    
    const form = document.getElementById('rateUserForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const targetUserId = document.getElementById('rateUserId').value;
            const type = document.querySelector('input[name="ratingType"]:checked').value;
            const comment = document.getElementById('ratingComment').value;
            
            await API.addReputation(targetUserId, currentUser.id, type, comment);
            
            showNotification('Rating submitted successfully', 'success');
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
            
            loadUserProfile(targetUserId);
        } catch (error) {
            console.error('Failed to submit rating:', error);
            showNotification(`Failed to submit rating: ${error.message}`, 'error');
        }
    });
}

function openMessagesModal() {
    if (!isAuthenticated()) {
        showNotification('Please log in to view messages', 'warning');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'messagesModal';
    
    modal.innerHTML = `
        <div class="modal-content messages-modal">
            <span class="close">&times;</span>
            <h2>Messages</h2>
            <div class="messages-container">
                <div class="conversations-list">
                    <div id="conversationsList">Loading conversations...</div>
                </div>
                <div class="conversation-view">
                    <div id="conversationContent">
                        <p class="no-conversation">Select a conversation to view messages</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });
    
    loadConversations();
}

async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    
    try {
        const conversations = await API.getUserConversations(currentUser.id);
        
        if (!conversations || conversations.length === 0) {
            conversationsList.innerHTML = '<p>No conversations yet.</p>';
            return;
        }
        
        const getImageUrl = (imageName) => {
            if (!imageName) return 'https://via.placeholder.com/40?text=?';
            return `https://raw.githubusercontent.com/Aalltra/QMDtest/main/data/images/${imageName}`;
        };
        
        const conversationsHTML = conversations.map(conversation => {
            const lastMessage = conversation.lastMessage;
            const isLastMessageFromMe = lastMessage.fromUserId === currentUser.id;
            const truncatedMessage = lastMessage.message.length > 30 ? 
                lastMessage.message.substring(0, 30) + '...' : 
                lastMessage.message;
            
            return `
                <div class="conversation-item ${conversation.unread > 0 ? 'unread' : ''}" data-user-id="${conversation.userId}">
                    <div class="conversation-avatar">
                        <img src="${getImageUrl(conversation.profileImage)}" alt="${conversation.username}">
                        ${conversation.unread > 0 ? `<span class="unread-badge">${conversation.unread}</span>` : ''}
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <h4>${conversation.username}</h4>
                            <span class="conversation-time">${formatMessageTime(lastMessage.createdAt)}</span>
                        </div>
                        <div class="conversation-last-message">
                            ${isLastMessageFromMe ? 'You: ' : ''}${truncatedMessage}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        conversationsList.innerHTML = conversationsHTML;
        
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const userId = item.getAttribute('data-user-id');
                const username = item.querySelector('h4').textContent;
                loadConversation(userId, username);
            });
        });
    } catch (error) {
        console.error('Failed to load conversations:', error);
        conversationsList.innerHTML = '<p>Failed to load conversations. Please try again later.</p>';
    }
}

async function loadConversation(userId, username) {
    const conversationContent = document.getElementById('conversationContent');
    conversationContent.innerHTML = '<p>Loading messages...</p>';
    
    try {
        const messages = await API.getConversation(currentUser.id, userId);
        
        conversationContent.innerHTML = `
            <div class="conversation-header">
                <h3>${username}</h3>
            </div>
            <div class="messages-list" id="messagesList">
                ${messages.length === 0 ? '<p class="no-messages">No messages yet. Start the conversation!</p>' : ''}
            </div>
            <div class="message-input">
                <form id="sendMessageForm">
                    <input type="hidden" id="messageRecipientId" value="${userId}">
                    <input type="text" id="messageContent" placeholder="Type a message..." required>
                    <button type="submit"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        `;
        
        const messagesList = document.getElementById('messagesList');
        
        if (messages.length > 0) {
            let currentDay = null;
            
            messages.forEach(message => {
                const messageDay = new Date(message.createdAt).toLocaleDateString();
                if (messageDay !== currentDay) {
                    currentDay = messageDay;
                    const daySeparator = document.createElement('div');
                    daySeparator.className = 'day-separator';
                    daySeparator.textContent = messageDay;
                    messagesList.appendChild(daySeparator);
                }
                
                const isFromMe = message.fromUserId === currentUser.id;
                const messageEl = document.createElement('div');
                messageEl.className = `message ${isFromMe ? 'sent' : 'received'}`;
                messageEl.innerHTML = `
                    <div class="message-content">${message.message}</div>
                    <div class="message-time">${formatMessageTime(message.createdAt)}</div>
                `;
                messagesList.appendChild(messageEl);
            });
            
            messagesList.scrollTop = messagesList.scrollHeight;
        }
        
        const form = document.getElementById('sendMessageForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const recipientId = document.getElementById('messageRecipientId').value;
            const content = document.getElementById('messageContent').value;
            
            if (!content.trim()) return;
            
            try {
                await API.sendChatMessage(currentUser.id, recipientId, content);
                
                document.getElementById('messageContent').value = '';
                
                loadConversation(recipientId, username);
            } catch (error) {
                console.error('Failed to send message:', error);
                showNotification('Failed to send message', 'error');
            }
        });
        
    } catch (error) {
        console.error('Failed to load conversation:', error);
        conversationContent.innerHTML = '<p>Failed to load messages. Please try again later.</p>';
    }
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function openConversation(userId, username) {
    openMessagesModal();
    
    setTimeout(() => {
        loadConversation(userId, username);
        
        const conversationItem = document.querySelector(`.conversation-item[data-user-id="${userId}"]`);
        if (conversationItem) {
            conversationItem.classList.add('active');
        }
    }, 100);
}