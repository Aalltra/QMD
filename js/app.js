import { initAuth } from './auth.js';
import { initNavigation } from './navigation.js';
import { initPCBuilder } from './pc-builder.js';
import { initForum } from './forum.js';
import { initMarketplace } from './marketplace.js';
import { initSavedBuilds } from './saved-builds.js';
import { initModals } from './modals.js';
import { API } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('PC Builder application initializing...');

    try {
        await API.init();
        
        initAuth();
        initNavigation();
        initPCBuilder();
        initForum();
        initMarketplace();
        initSavedBuilds();
        initModals();

        document.getElementById('startBuildBtn').addEventListener('click', () => {
            document.querySelector('nav a[data-page="builder"]').click();
        });

        console.log('PC Builder application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Failed to load application data. Please try again later.');
    }
});

