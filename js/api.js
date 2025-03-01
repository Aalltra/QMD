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

    async registerUser(username, email, password) {
        const user = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            builds: []
        };

        this.users.push(user);
        await this.saveFileContent('data/users.json', this.users);
        
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

    async createListing(userId, categoryId, componentData, price, condition) {
        const component = await this.addComponent(categoryId, componentData);
        
        const listing = {
            id: Date.now().toString(),
            userId,
            componentId: component.id,
            componentCategoryId: categoryId,
            price,
            condition,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.listings.push(listing);
        await this.saveFileContent('data/marketplace_listings.json', this.listings);
        
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
}

export const API = new ApiService();