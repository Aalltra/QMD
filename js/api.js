class ApiService {
    constructor() {
        this.baseUrl = 'https://api.github.com/repos/Aalltra/QMDtest/contents';
        this.token = 'ghp_' + 'LWYpkfP5' + 'CImA2bvo' + 'XHmguDGr' + 'fmgtC00JwKdO';
        this.categories = [];
        this.components = {};
        this.users = [];
        this.threads = [];
        this.listings = [];
        this.builds = [];
        this.reviews = {};
        this.userReputations = {};
        this.chatMessages = [];
    }

    async init() {
        try {
            await this.loadCategories();
            await this.loadComponents();
            await this.loadUsers();
            await this.loadThreads();
            await this.loadListings();
            await this.loadBuilds();
            await this.loadReviews();
            await this.loadReputations();
            await this.loadChatMessages();
            console.log('API initialized with data');
        } catch (error) {
            console.error('API initialization failed:', error);
            throw new Error('Failed to load initial data');
        }
    }

    async githubRequest(path, method = 'GET', data = null) {
        const url = `${this.baseUrl}/${path}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        if (data && method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API request failed:', error);
            throw error;
        }
    }

    async getFileContent(path) {
        try {
            const response = await this.githubRequest(path);
            const content = atob(response.content);
            return JSON.parse(content);
        } catch (error) {
            console.error(`Failed to get file content for ${path}:`, error);
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async saveFileContent(path, content) {
        try {
            let sha;
            try {
                const fileInfo = await this.githubRequest(path);
                sha = fileInfo.sha;
            } catch (error) {
            }

            const data = {
                message: `Update ${path}`,
                content: btoa(JSON.stringify(content)),
                sha: sha
            };

            await this.githubRequest(path, 'PUT', data);
            console.log(`Successfully saved ${path}`);
            return true;
        } catch (error) {
            console.error(`Failed to save file ${path}:`, error);
            throw error;
        }
    }

    async imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    async loadCategories() {
        const categories = await this.getFileContent('data/categories.json');
        this.categories = categories || [
            { id: 'cpu', name: 'CPU' },
            { id: 'cpu-cooler', name: 'CPU Cooler' },
            { id: 'motherboard', name: 'Motherboard' },
            { id: 'memory', name: 'Memory' },
            { id: 'storage', name: 'Storage' },
            { id: 'video-card', name: 'Video Card' },
            { id: 'case', name: 'Case' },
            { id: 'power-supply', name: 'Power Supply' },
            { id: 'monitor', name: 'Monitor' },
            { id: 'sound-card', name: 'Sound Card' },
            { id: 'wired-network', name: 'Wired Network Adapter' },
            { id: 'wireless-network', name: 'Wireless Network Adapter' },
            { id: 'headphones', name: 'Headphones' },
            { id: 'keyboard', name: 'Keyboard' },
            { id: 'mouse', name: 'Mouse' },
            { id: 'speakers', name: 'Speakers' },
            { id: 'webcam', name: 'Webcam' },
            { id: 'case-accessory', name: 'Case Accessory' },
            { id: 'case-fan', name: 'Case Fan' },
            { id: 'fan-controller', name: 'Fan Controller' },
            { id: 'thermal-compound', name: 'Thermal Compound' },
            { id: 'external-storage', name: 'External Storage' },
            { id: 'optical-drive', name: 'Optical Drive' },
            { id: 'ups', name: 'UPS System' }
        ];

        if (!categories) {
            await this.saveFileContent('data/categories.json', this.categories);
        }

        return this.categories;
    }

    async loadComponents() {
        const components = await this.getFileContent('data/components.json');
        this.components = components || {};
        
        if (!components) {
            this.categories.forEach(category => {
                this.components[category.id] = [];
            });
            await this.saveFileContent('data/components.json', this.components);
        }
        
        return this.components;
    }

    async loadUsers() {
        const users = await this.getFileContent('data/users.json');
        this.users = users || [];
        
        if (!users) {
            await this.saveFileContent('data/users.json', this.users);
        }
        
        return this.users;
    }

    async loadThreads() {
        const threads = await this.getFileContent('data/forum_threads.json');
        this.threads = threads || [];
        
        if (!threads) {
            await this.saveFileContent('data/forum_threads.json', this.threads);
        }
        
        return this.threads;
    }

    async loadListings() {
        const listings = await this.getFileContent('data/marketplace_listings.json');
        this.listings = listings || [];
        
        if (!listings) {
            await this.saveFileContent('data/marketplace_listings.json', this.listings);
        }
        
        return this.listings;
    }

    async loadBuilds() {
        const builds = await this.getFileContent('data/saved_builds.json');
        this.builds = builds || [];
        
        if (!builds) {
            await this.saveFileContent('data/saved_builds.json', this.builds);
        }
        
        return this.builds;
    }

    async loadReviews() {
        const reviews = await this.getFileContent('data/component_reviews.json');
        this.reviews = reviews || {};
        
        if (!reviews) {
            await this.saveFileContent('data/component_reviews.json', this.reviews);
        }
        
        return this.reviews;
    }

    async loadReputations() {
        const reputations = await this.getFileContent('data/user_reputations.json');
        this.userReputations = reputations || {};
        
        if (!reputations) {
            await this.saveFileContent('data/user_reputations.json', this.userReputations);
        }
        
        return this.userReputations;
    }

    async loadChatMessages() {
        const messages = await this.getFileContent('data/chat_messages.json');
        this.chatMessages = messages || [];
        
        if (!messages) {
            await this.saveFileContent('data/chat_messages.json', this.chatMessages);
        }
        
        return this.chatMessages;
    }

    async registerUser(username, email, password, profileImage = null) {
        let profileImageData = null;
        if (profileImage) {
            profileImageData = await this.imageToBase64(profileImage);
        }

        const user = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            builds: [],
            profileImage: profileImageData ? `profile_${Date.now()}.jpg` : null,
            profileBanner: null,
            bio: '',
            location: '',
            socialLinks: {}
        };

        this.users.push(user);
        await this.saveFileContent('data/users.json', this.users);
        
        if (profileImageData) {
            await this.saveFileContent(`data/images/${user.profileImage}`, {
                content: profileImageData,
                encoding: 'base64'
            });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async loginUser(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateUserProfile(userId, profileData) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        const user = this.users[userIndex];
        
        user.bio = profileData.bio || user.bio;
        user.location = profileData.location || user.location;
        user.socialLinks = profileData.socialLinks || user.socialLinks;
        
        if (profileData.profileImage) {
            const imageData = await this.imageToBase64(profileData.profileImage);
            const imageName = `profile_${Date.now()}.jpg`;
            
            await this.saveFileContent(`data/images/${imageName}`, {
                content: imageData,
                encoding: 'base64'
            });
            
            user.profileImage = imageName;
        }
        
        if (profileData.profileBanner) {
            const bannerData = await this.imageToBase64(profileData.profileBanner);
            const bannerName = `banner_${Date.now()}.jpg`;
            
            await this.saveFileContent(`data/images/${bannerName}`, {
                content: bannerData,
                encoding: 'base64'
            });
            
            user.profileBanner = bannerName;
        }
        
        await this.saveFileContent('data/users.json', this.users);
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserProfile(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const reputation = this.getUserReputation(userId);
        
        const listings = this.listings.filter(l => l.userId === userId && l.status === 'active');
        
        const threads = this.threads.filter(t => t.userId === userId);
        
        const builds = this.builds.filter(b => b.userId === userId);
        
        const profile = {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            profileImage: user.profileImage,
            profileBanner: user.profileBanner,
            bio: user.bio,
            location: user.location,
            socialLinks: user.socialLinks,
            reputation,
            stats: {
                listings: listings.length,
                threads: threads.length,
                builds: builds.length
            }
        };
        
        return profile;
    }

    async getComponentsByCategory(categoryId) {
        return this.components[categoryId] || [];
    }

    async getComponentById(categoryId, componentId) {
        const components = await this.getComponentsByCategory(categoryId);
        return components.find(component => component.id === componentId);
    }

    async addComponent(categoryId, componentData) {
        const newComponent = {
            id: Date.now().toString(),
            ...componentData,
            addedAt: new Date().toISOString()
        };

        if (!this.components[categoryId]) {
            this.components[categoryId] = [];
        }

        this.components[categoryId].push(newComponent);
        await this.saveFileContent('data/components.json', this.components);
        
        return newComponent;
    }

    async addReview(componentId, userId, rating, comment) {
        const review = {
            id: Date.now().toString(),
            userId,
            componentId,
            rating,
            comment,
            createdAt: new Date().toISOString()
        };

        if (!this.reviews[componentId]) {
            this.reviews[componentId] = [];
        }

        this.reviews[componentId].push(review);
        await this.saveFileContent('data/component_reviews.json', this.reviews);
        
        return review;
    }

    async getReviewsForComponent(componentId) {
        return this.reviews[componentId] || [];
    }

    async saveBuild(userId, buildName, components) {
        const build = {
            id: Date.now().toString(),
            userId,
            name: buildName,
            components,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.builds.push(build);
        await this.saveFileContent('data/saved_builds.json', this.builds);
        
        const user = this.users.find(u => u.id === userId);
        if (user) {
            if (!user.builds) {
                user.builds = [];
            }
            user.builds.push(build.id);
            await this.saveFileContent('data/users.json', this.users);
        }
        
        return build;
    }

    async deleteBuild(buildId) {
        const buildIndex = this.builds.findIndex(b => b.id === buildId);
        if (buildIndex !== -1) {
            const build = this.builds[buildIndex];
            
            const user = this.users.find(u => u.id === build.userId);
            if (user && user.builds) {
                user.builds = user.builds.filter(id => id !== buildId);
                await this.saveFileContent('data/users.json', this.users);
            }
            
            this.builds.splice(buildIndex, 1);
            await this.saveFileContent('data/saved_builds.json', this.builds);
            return true;
        }
        return false;
    }

    async getUserBuilds(userId) {
        return this.builds.filter(build => build.userId === userId);
    }

    async getBuildById(buildId) {
        return this.builds.find(build => build.id === buildId);
    }

    async createThread(userId, category, title, content) {
        const thread = {
            id: Date.now().toString(),
            userId,
            category,
            title,
            content,
            createdAt: new Date().toISOString(),
            comments: []
        };

        this.threads.push(thread);
        await this.saveFileContent('data/forum_threads.json', this.threads);
        
        return thread;
    }

    async getThreadsByCategory(category) {
        if (category === 'all') {
            return this.threads;
        }
        return this.threads.filter(thread => thread.category === category);
    }

    async addComment(threadId, userId, content) {
        const thread = this.threads.find(t => t.id === threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }

        const comment = {
            id: Date.now().toString(),
            userId,
            content,
            createdAt: new Date().toISOString()
        };

        thread.comments.push(comment);
        await this.saveFileContent('data/forum_threads.json', this.threads);
        
        return comment;
    }

    async createListing(userId, categoryId, componentId, componentData, price, condition, description, images = []) {
        let componentImages = [];
        
        if (images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const imageData = await this.imageToBase64(images[i]);
                const imageName = `listing_${Date.now()}_${i}.jpg`;
                
                await this.saveFileContent(`data/images/${imageName}`, {
                    content: imageData,
                    encoding: 'base64'
                });
                
                componentImages.push(imageName);
            }
        }
        
        let component;
        if (componentId) {
            component = await this.getComponentById(categoryId, componentId);
            if (!component) {
                throw new Error('Selected component not found');
            }
        } else {
            throw new Error('Component selection is required');
        }
        
        const componentSpecs = component.specs || {};
        
        const listing = {
            id: Date.now().toString(),
            userId,
            componentId: component.id,
            componentCategoryId: categoryId,
            price,
            condition,
            description,
            images: componentImages,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.listings.push(listing);
        await this.saveFileContent('data/marketplace_listings.json', this.listings);
        
        if (!component.vendors) {
            component.vendors = [];
        }
        
        const seller = this.users.find(u => u.id === userId);
        component.vendors.push({
            id: `vendor-marketplace-${listing.id}`,
            name: `${seller ? seller.username : 'Unknown'} (Marketplace)`,
            price: price,
            url: `#/marketplace/listing/${listing.id}`,
            marketplace: true,
            listingId: listing.id
        });
        
        if (!this.components[categoryId]) {
            this.components[categoryId] = [];
        }
        
        const componentIndex = this.components[categoryId].findIndex(c => c.id === component.id);
        if (componentIndex >= 0) {
            this.components[categoryId][componentIndex] = component;
        }
        
        await this.saveFileContent('data/components.json', this.components);
        
        return { listing, component };
    }

    async getListingsByCategory(categoryId) {
        if (categoryId === 'all') {
            return this.listings.filter(listing => listing.status === 'active');
        }
        return this.listings.filter(listing => listing.componentCategoryId === categoryId && listing.status === 'active');
    }

    async getListingById(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) {
            return null;
        }

        const component = await this.getComponentById(listing.componentCategoryId, listing.componentId);
        return { listing, component };
    }

    async getUserListings(userId) {
        return this.listings.filter(listing => listing.userId === userId);
    }

    async getAvailableComponents() {
        const availableComponents = {};
        
        for (const categoryId in this.components) {
            availableComponents[categoryId] = this.components[categoryId].map(comp => ({
                id: comp.id,
                name: comp.name,
                image: comp.image
            }));
        }
        
        return availableComponents;
    }

    async addReputation(targetUserId, fromUserId, type, comment) {
        if (targetUserId === fromUserId) {
            throw new Error('You cannot rate yourself');
        }
        
        if (!this.userReputations[targetUserId]) {
            this.userReputations[targetUserId] = {
                positive: [],
                negative: []
            };
        }
        
        const hasRated = 
            this.userReputations[targetUserId].positive.some(r => r.userId === fromUserId) ||
            this.userReputations[targetUserId].negative.some(r => r.userId === fromUserId);
            
        if (hasRated) {
            throw new Error('You have already rated this user');
        }
        
        const reputation = {
            userId: fromUserId,
            comment,
            createdAt: new Date().toISOString()
        };
        
        if (type === 'positive') {
            this.userReputations[targetUserId].positive.push(reputation);
        } else {
            this.userReputations[targetUserId].negative.push(reputation);
        }
        
        await this.saveFileContent('data/user_reputations.json', this.userReputations);
        
        return this.getUserReputation(targetUserId);
    }
    
    getUserReputation(userId) {
        if (!this.userReputations[userId]) {
            return {
                positive: 0,
                negative: 0,
                total: 0,
                feedbacks: []
            };
        }
        
        const positive = this.userReputations[userId].positive.length;
        const negative = this.userReputations[userId].negative.length;
        
        const feedbacks = [
            ...this.userReputations[userId].positive.map(r => ({
                ...r,
                type: 'positive',
                username: this.users.find(u => u.id === r.userId)?.username || 'Unknown User'
            })),
            ...this.userReputations[userId].negative.map(r => ({
                ...r,
                type: 'negative',
                username: this.users.find(u => u.id === r.userId)?.username || 'Unknown User'
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return {
            positive,
            negative,
            total: positive - negative,
            feedbacks
        };
    }

    async sendChatMessage(fromUserId, toUserId, message) {
        const chatMessage = {
            id: Date.now().toString(),
            fromUserId,
            toUserId,
            message,
            createdAt: new Date().toISOString(),
            read: false
        };
        
        this.chatMessages.push(chatMessage);
        await this.saveFileContent('data/chat_messages.json', this.chatMessages);
        
        return chatMessage;
    }
    
    async getUserConversations(userId) {
        const userMessages = this.chatMessages.filter(
            m => m.fromUserId === userId || m.toUserId === userId
        );
        
        const conversations = {};
        userMessages.forEach(msg => {
            const partnerId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
            
            if (!conversations[partnerId]) {
                const partner = this.users.find(u => u.id === partnerId);
                conversations[partnerId] = {
                    userId: partnerId,
                    username: partner ? partner.username : 'Unknown User',
                    profileImage: partner ? partner.profileImage : null,
                    lastMessage: msg,
                    unread: userId === msg.toUserId && !msg.read ? 1 : 0
                };
            } else {
                if (new Date(msg.createdAt) > new Date(conversations[partnerId].lastMessage.createdAt)) {
                    conversations[partnerId].lastMessage = msg;
                }
                
                if (userId === msg.toUserId && !msg.read) {
                    conversations[partnerId].unread++;
                }
            }
        });
        
        return Object.values(conversations).sort(
            (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
        );
    }
    
    async getConversation(userId, partnerId) {
        const messages = this.chatMessages.filter(
            m => (m.fromUserId === userId && m.toUserId === partnerId) || 
                 (m.fromUserId === partnerId && m.toUserId === userId)
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        let updated = false;
        messages.forEach(msg => {
            if (msg.toUserId === userId && !msg.read) {
                msg.read = true;
                updated = true;
            }
        });
        
        if (updated) {
            await this.saveFileContent('data/chat_messages.json', this.chatMessages);
        }
        
        return messages;
    }

}

export const API = new ApiService();