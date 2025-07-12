// Unsplash REST API Integration using jQuery for Gallery Manager
class UnsplashImageManager {
    constructor() {
        // Your Unsplash API credentials - Replace with your actual keys from the dashboard
        this.accessKey = 'N4sQoVRKOOfE9rXQO-QGU0W7Ez7XHvVdU-JMRjmxEbk'; // Replace with your Access Key from Unsplash dashboard
        this.baseURL = 'https://api.unsplash.com';
        this.cache = new Map(); // Cache images to avoid repeated API calls
    }

    /**
     * Search for images on Unsplash using jQuery AJAX REST API calls
     * @param {string} query - Search query
     * @param {number} count - Number of images to fetch (default: 12)
     * @returns {Promise<Array>} Array of image objects
     */
    searchImages(query, count = 12) {
        // Check cache first
        const cacheKey = `${query}_${count}`;
        if (this.cache.has(cacheKey)) {
            return Promise.resolve(this.cache.get(cacheKey));
        }

        // Return a Promise that wraps jQuery AJAX call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.baseURL}/search/photos`,
                method: 'GET',
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                },
                data: {
                    query: query,
                    per_page: count,
                    orientation: 'landscape'
                },
                timeout: 5000, // Reduced from 10 seconds to 5 seconds
                success: (data) => {
                    try {
                        const images = data.results.map(photo => ({
                            id: photo.id,
                            url: photo.urls.regular,
                            thumb: photo.urls.thumb,
                            full: photo.urls.full,
                            alt: photo.alt_description || query,
                            photographer: photo.user.name,
                            photographerUrl: photo.user.links.html,
                            downloadUrl: photo.links.download_location,
                            unsplashUrl: photo.links.html,
                            width: photo.width,
                            height: photo.height,
                            color: photo.color,
                            description: photo.description || photo.alt_description || query
                        }));

                        // Cache the results
                        this.cache.set(cacheKey, images);
                        console.log(`Successfully fetched ${images.length} images via jQuery AJAX for query: ${query}`);
                        resolve(images);
                    } catch (error) {
                        console.error('Error processing Unsplash response:', error);
                        reject(error);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('jQuery AJAX Error fetching images from Unsplash:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error,
                        responseText: xhr.responseText
                    });
                    
                    // Handle specific error cases
                    if (xhr.status === 401) {
                        reject(new Error('Unauthorized: Please check your Unsplash API access key'));
                    } else if (xhr.status === 403) {
                        reject(new Error('Rate limit exceeded: Please try again later'));
                    } else if (xhr.status === 0) {
                        reject(new Error('Network error: Please check your internet connection'));
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText || error}`));
                    }
                }
            });
        });
    }

    /**
     * Search for videos on Unsplash using jQuery AJAX
     * Note: Unsplash doesn't have video API, but we simulate with dynamic images
     * @param {string} query - Search query
     * @param {number} count - Number of videos to fetch (default: 6)
     * @returns {Promise<Array>} Array of video-like objects
     */
    searchVideos(query, count = 6) {
        // Since Unsplash doesn't have videos, we'll search for dynamic/action images
        const videoQuery = `${query} action dynamic motion`;
        
        return this.searchImages(videoQuery, count).then(images => {
            // Transform to video-like objects
            return images.map(image => ({
                ...image,
                type: 'video',
                duration: Math.floor(Math.random() * 120) + 30, // Random duration 30-150 seconds
                thumbnail: image.thumb
            }));
        });
    }

    /**
     * Get curated photos from Unsplash using jQuery AJAX
     * @param {number} count - Number of photos to fetch
     * @returns {Promise<Array>} Array of curated image objects
     */
    getCuratedPhotos(count = 12) {
        const cacheKey = `curated_${count}`;
        if (this.cache.has(cacheKey)) {
            return Promise.resolve(this.cache.get(cacheKey));
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.baseURL}/photos`,
                method: 'GET',
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                },
                data: {
                    per_page: count,
                    order_by: 'popular'
                },
                timeout: 5000, // Reduced timeout
                success: (data) => {
                    try {
                        const images = data.map(photo => ({
                            id: photo.id,
                            url: photo.urls.regular,
                            thumb: photo.urls.thumb,
                            full: photo.urls.full,
                            alt: photo.alt_description || 'Curated photo',
                            photographer: photo.user.name,
                            photographerUrl: photo.user.links.html,
                            downloadUrl: photo.links.download_location,
                            unsplashUrl: photo.links.html,
                            width: photo.width,
                            height: photo.height,
                            color: photo.color,
                            description: photo.description || photo.alt_description || 'Curated photo'
                        }));

                        this.cache.set(cacheKey, images);
                        console.log(`Successfully fetched ${images.length} curated photos via jQuery AJAX`);
                        resolve(images);
                    } catch (error) {
                        console.error('Error processing curated photos response:', error);
                        reject(error);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('jQuery AJAX Error fetching curated photos:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error
                    });
                    reject(new Error(`Failed to fetch curated photos: ${xhr.statusText || error}`));
                }
            });
        });
    }

    /**
     * Trigger download event using jQuery AJAX (required by Unsplash API)
     * @param {string} downloadUrl - Download URL from image object
     * @returns {Promise} Promise that resolves when download is triggered
     */
    triggerDownload(downloadUrl) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: downloadUrl,
                method: 'GET',
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                },
                timeout: 5000,
                success: () => {
                    console.log('Download event triggered successfully via jQuery AJAX');
                    resolve();
                },
                error: (xhr, status, error) => {
                    console.warn('jQuery AJAX Error triggering download:', error);
                    // Don't reject as this is not critical
                    resolve(); // Still resolve to not break the flow
                }
            });
        });
    }

    /**
     * Fetch a single image by ID using jQuery AJAX
     * @param {string} imageId - Unsplash image ID
     * @returns {Promise<Object>} Single image object
     */
    getImageById(imageId) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.baseURL}/photos/${imageId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                },
                timeout: 5000, // Reduced timeout
                success: (photo) => {
                    try {
                        const image = {
                            id: photo.id,
                            url: photo.urls.regular,
                            thumb: photo.urls.thumb,
                            full: photo.urls.full,
                            alt: photo.alt_description || 'Unsplash photo',
                            photographer: photo.user.name,
                            photographerUrl: photo.user.links.html,
                            downloadUrl: photo.links.download_location,
                            unsplashUrl: photo.links.html,
                            width: photo.width,
                            height: photo.height,
                            color: photo.color,
                            description: photo.description || photo.alt_description || 'Unsplash photo'
                        };
                        console.log(`Successfully fetched image ${imageId} via jQuery AJAX`);
                        resolve(image);
                    } catch (error) {
                        console.error('Error processing single image response:', error);
                        reject(error);
                    }
                },
                error: (xhr, status, error) => {
                    console.error(`jQuery AJAX Error fetching image ${imageId}:`, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error
                    });
                    reject(new Error(`Failed to fetch image: ${xhr.statusText || error}`));
                }
            });
        });
    }

    /**
     * Get user statistics using jQuery AJAX
     * @param {string} username - Unsplash username
     * @returns {Promise<Object>} User statistics
     */
    getUserStats(username) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.baseURL}/users/${username}/statistics`,
                method: 'GET',
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                },
                timeout: 10000,
                success: (data) => {
                    console.log(`Successfully fetched stats for user ${username} via jQuery AJAX`);
                    resolve(data);
                },
                error: (xhr, status, error) => {
                    console.error(`jQuery AJAX Error fetching user stats for ${username}:`, error);
                    reject(new Error(`Failed to fetch user stats: ${xhr.statusText || error}`));
                }
            });
        });
    }

    /**
     * Generate proper attribution HTML
     * @param {Object} image - Image object from Unsplash
     * @returns {string} HTML string for attribution
     */
    generateAttribution(image) {
        return `Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener">${image.photographer}</a> on <a href="${image.unsplashUrl}" target="_blank" rel="noopener">Unsplash</a>`;
    }

    /**
     * Extract relevant keywords from title for better search
     * @param {string} title - Photo title
     * @returns {string} Optimized search query
     */
    optimizeSearchQuery(title) {
        // Remove common words and focus on travel-related keywords
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'my', 'your'];
        const words = title.toLowerCase().split(' ');
        const filteredWords = words.filter(word => !stopWords.includes(word));
        
        // Add "malaysia" if it's not already in the title for better results
        if (!title.toLowerCase().includes('malaysia') && !title.toLowerCase().includes('malaysian')) {
            filteredWords.push('malaysia');
        }
        
        return filteredWords.join(' ');
    }

    /**
     * Format video duration from seconds to MM:SS format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Test API connection using jQuery AJAX
     * @returns {Promise<boolean>} True if API is accessible
     */
    testApiConnection() {
        return new Promise((resolve) => {
            $.ajax({
                url: `${this.baseURL}/photos`,
                method: 'GET',
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                },
                data: {
                    per_page: 1
                },
                timeout: 5000,
                success: () => {
                    console.log('Unsplash API connection test successful via jQuery AJAX');
                    resolve(true);
                },
                error: (xhr, status, error) => {
                    console.error('Unsplash API connection test failed via jQuery AJAX:', error);
                    resolve(false);
                }
            });
        });
    }
}

// Enhanced Gallery Manager Class with jQuery REST API Integration and Enhanced localStorage
class GalleryManager {
    constructor() {
        // Enhanced localStorage operations with fallbacks and error handling
        this.userPosts = this.loadFromStorage('gallery_user_posts') || [];
        this.userPhotos = this.loadFromStorage('gallery_user_photos') || [];
        this.userVideos = this.loadFromStorage('gallery_user_videos') || [];
        this.photos = this.loadFromStorage('galleryPhotos') || [];
        this.videos = this.loadFromStorage('galleryVideos') || [];
        this.likes = this.loadFromStorage('galleryLikes') || {};
        this.views = this.loadFromStorage('galleryViews') || {};
        this.userSettings = this.loadFromStorage('gallery_user_settings') || {
            preferredCategories: [],
            autoSave: true,
            showNotifications: true
        };
        
        this.currentMediaIndex = 0;
        this.currentFilter = 'all';
        this.currentContentType = 'all';
        this.currentUploadType = 'photo';
        this.defaultPhotos = [];
        this.defaultVideos = [];
        this.displayCount = 6; // Start by showing 6 items
        this.itemsPerLoad = 6; // Load 6 more items each time
        
        // Video processing properties
        this.currentVideoDuration = '0:00';
        this.currentVideoThumbnail = null;
        
        // Unsplash Integration with jQuery REST API
        this.unsplashManager = new UnsplashImageManager();
        this.loadingImages = new Set();
        this.selectedImageAttribution = null;
        
        // Auto-save timer
        this.autoSaveTimer = null;
        
        this.init();
    }

    // Enhanced localStorage operations with better error handling and versioning
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            
            // Handle versioned data format
            if (parsed && typeof parsed === 'object' && parsed.version) {
                return this.migrateDataVersion(parsed, key);
            }
            
            return parsed;
        } catch (error) {
            console.warn(`Error loading ${key} from localStorage:`, error);
            // Try to recover corrupted data
            try {
                localStorage.removeItem(key);
                this.showNotification(`Recovered from corrupted data in ${key}`, 'warning');
            } catch (cleanupError) {
                console.error('Error cleaning up corrupted data:', cleanupError);
            }
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            // Add version and timestamp for data integrity
            const versionedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: data
            };
            
            const serialized = JSON.stringify(versionedData);
            
            // Check storage quota
            try {
                localStorage.setItem(key, serialized);
                
                // Schedule auto-save for user posts
                if (key.includes('user_posts') && this.userSettings.autoSave) {
                    this.scheduleAutoSave();
                }
                
                console.log(`Successfully saved ${key} to localStorage`);
            } catch (quotaError) {
                if (quotaError.name === 'QuotaExceededError') {
                    this.handleStorageQuotaExceeded(key, data);
                } else {
                    throw quotaError;
                }
            }
        } catch (error) {
            console.warn(`Error saving ${key} to localStorage:`, error);
            this.showNotification('Failed to save data locally. Your changes may be lost.', 'warning');
        }
    }

    // Handle data version migration
    migrateDataVersion(versionedData, key) {
        try {
            if (versionedData.version === '1.0') {
                return versionedData.data;
            }
            
            // Handle older versions or migration logic here
            console.log(`Migrating data for ${key} from version ${versionedData.version}`);
            return versionedData.data || versionedData;
        } catch (error) {
            console.error('Error migrating data version:', error);
            return versionedData.data || versionedData;
        }
    }

    // Handle storage quota exceeded
    handleStorageQuotaExceeded(key, data) {
        console.warn('LocalStorage quota exceeded, attempting cleanup...');
        
        try {
            // Remove old cached data first
            this.cleanupOldCache();
            
            // Try saving again
            localStorage.setItem(key, JSON.stringify({
                version: '1.0',
                timestamp: Date.now(),
                data: data
            }));
            
            this.showNotification('Storage cleaned up and data saved', 'success');
        } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
            this.showNotification('Storage full! Some data may not be saved.', 'error');
            
            // Offer to export data
            this.offerDataExport();
        }
    }

    // Clean up old cached data
    cleanupOldCache() {
        const keysToClean = [];
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gallery_cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < oneWeekAgo) {
                        keysToClean.push(key);
                    }
                } catch (error) {
                    keysToClean.push(key); // Remove corrupted cache
                }
            }
        }
        
        keysToClean.forEach(key => {
            localStorage.removeItem(key);
            console.log(`Cleaned up old cache: ${key}`);
        });
        
        return keysToClean.length;
    }

    // Schedule auto-save for user posts
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveAllUserData();
            console.log('Auto-save completed');
        }, 5000); // Auto-save after 5 seconds of inactivity
    }

    // Save all user data
    saveAllUserData() {
        try {
            // Combine all user posts for easier management
            const allUserPosts = [
                ...this.userPhotos.map(post => ({ ...post, type: 'photo', isUserContent: true })),
                ...this.userVideos.map(post => ({ ...post, type: 'video', isUserContent: true })),
                ...this.photos.filter(post => post.isUserContent),
                ...this.videos.filter(post => post.isUserContent)
            ];
            
            // Remove duplicates based on ID
            const uniquePosts = allUserPosts.filter((post, index, self) => 
                index === self.findIndex(p => p.id === post.id)
            );
            
            this.saveToStorage('gallery_user_posts', uniquePosts);
            this.saveToStorage('gallery_user_photos', this.userPhotos);
            this.saveToStorage('gallery_user_videos', this.userVideos);
            this.saveToStorage('galleryPhotos', this.photos);
            this.saveToStorage('galleryVideos', this.videos);
            this.saveToStorage('galleryLikes', this.likes);
            this.saveToStorage('galleryViews', this.views);
            this.saveToStorage('gallery_user_settings', this.userSettings);
            
            if (this.userSettings.showNotifications) {
                console.log('User data auto-saved successfully');
            }
        } catch (error) {
            console.error('Error during auto-save:', error);
            this.showNotification('Auto-save failed', 'error');
        }
    }

    // Load all user data
    loadAllUserData() {
        try {
            // Load user posts and merge with existing arrays
            const savedUserPosts = this.loadFromStorage('gallery_user_posts') || [];
            
            savedUserPosts.forEach(post => {
                if (post.type === 'photo' && !this.userPhotos.find(p => p.id === post.id)) {
                    this.userPhotos.push(post);
                    if (!this.photos.find(p => p.id === post.id)) {
                        this.photos.push(post);
                    }
                } else if (post.type === 'video' && !this.userVideos.find(v => v.id === post.id)) {
                    this.userVideos.push(post);
                    if (!this.videos.find(v => v.id === post.id)) {
                        this.videos.push(post);
                    }
                }
            });
            
            console.log(`Loaded ${savedUserPosts.length} user posts from localStorage`);
            
            if (savedUserPosts.length > 0) {
                this.showNotification(`Restored ${savedUserPosts.length} saved posts`, 'success');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Error loading saved posts', 'error');
        }
    }

    // Export user data for backup
    exportUserData() {
        try {
            const exportData = {
                userPosts: this.loadFromStorage('gallery_user_posts') || [],
                userPhotos: this.userPhotos,
                userVideos: this.userVideos,
                likes: this.likes,
                views: this.views,
                settings: this.userSettings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `gallery_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Failed to export data', 'error');
        }
    }

    // Import user data from backup
    importUserData(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate import data
                    if (!importData.version || !importData.userPosts) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Merge imported data
                    if (importData.userPosts) {
                        importData.userPosts.forEach(post => {
                            if (!this.userPosts.find(p => p.id === post.id)) {
                                this.userPosts.push(post);
                                
                                if (post.type === 'photo') {
                                    this.userPhotos.push(post);
                                    this.photos.push(post);
                                } else if (post.type === 'video') {
                                    this.userVideos.push(post);
                                    this.videos.push(post);
                                }
                            }
                        });
                    }
                    
                    // Merge likes and views
                    Object.assign(this.likes, importData.likes || {});
                    Object.assign(this.views, importData.views || {});
                    
                    // Save imported data
                    this.saveAllUserData();
                    this.renderGallery();
                    this.updateStats();
                    
                    this.showNotification(`Imported ${importData.userPosts.length} posts successfully`, 'success');
                } catch (parseError) {
                    console.error('Error parsing import file:', parseError);
                    this.showNotification('Invalid backup file', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing data:', error);
            this.showNotification('Failed to import data', 'error');
        }
    }

    // Offer data export when storage is full
    offerDataExport() {
        const exportModal = document.createElement('div');
        exportModal.className = 'modal show';
        exportModal.innerHTML = `
            <div class="modal-content">
                <h3>Storage Full</h3>
                <p>Your browser's local storage is full. Would you like to export your data as a backup?</p>
                <div class="modal-actions">
                    <button onclick="galleryManager.exportUserData(); this.parentElement.parentElement.parentElement.remove();" class="btn-primary">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove();" class="btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(exportModal);
    }

    async init() {
        // Show gallery immediately with fallback images
        this.renderGallery();
        this.updateStats();
        this.setupEventListeners();
        this.setupMobileMenu();
        this.setupImageSuggestion();
        this.setupDataManagement();

        // Load user data first (fast)
        this.loadAllUserData();
        this.loadDefaultContent();
        
        // Show initial gallery with fallback images
        this.renderGallery();
        this.updateStats();

        // Test API connection and load dynamic content in background
        const apiAvailable = await this.unsplashManager.testApiConnection();
        if (!apiAvailable) {
            console.warn('Unsplash API not available, using fallback images');
            this.showNotification('Using demo images - API connection failed', 'info');
            return; // Skip dynamic loading if API unavailable
        }

        // Load Unsplash images in background (non-blocking)
        this.loadDynamicContent().then(() => {
            this.showNotification('All images loaded from Unsplash!', 'success');
        }).catch(error => {
            console.error('Error loading dynamic content:', error);
            this.showNotification('Some images failed to load from Unsplash', 'warning');
        });
    }

    // Setup data management functionality
    setupDataManagement() {
        // Add auto-save indicator only (buttons removed)
        this.createAutoSaveIndicator();
    }

    // Create auto-save indicator
    createAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'autoSaveIndicator';
        indicator.className = 'auto-save-indicator';
        indicator.innerHTML = '<i class="fas fa-save"></i> Auto-saved';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
        `;
        document.body.appendChild(indicator);
    }

    // Show auto-save indicator
    showAutoSaveIndicator() {
        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        }
    }

    // Clear all user data
    clearAllUserData() {
        if (confirm('Are you sure you want to clear all your posts and data? This action cannot be undone.')) {
            try {
                // Clear arrays
                this.userPhotos = [];
                this.userVideos = [];
                this.photos = this.photos.filter(p => !p.isUserContent);
                this.videos = this.videos.filter(v => !v.isUserContent);
                
                // Clear user-specific likes and views
                Object.keys(this.likes).forEach(key => {
                    if (key.startsWith('user_')) {
                        delete this.likes[key];
                    }
                });
                
                Object.keys(this.views).forEach(key => {
                    if (key.startsWith('user_')) {
                        delete this.views[key];
                    }
                });

                // Clear localStorage
                localStorage.removeItem('gallery_user_posts');
                localStorage.removeItem('gallery_user_photos');
                localStorage.removeItem('gallery_user_videos');
                localStorage.removeItem('galleryPhotos');
                localStorage.removeItem('galleryVideos');

                // Re-save cleaned data
                this.saveAllUserData();
                this.renderGallery();
                this.updateStats();

                this.showNotification('All user data cleared successfully', 'success');
            } catch (error) {
                console.error('Error clearing user data:', error);
                this.showNotification('Error clearing data', 'error');
            }
        }
    }

    setupMobileMenu() {
        const bar = document.querySelector('.bar');
        const menu = document.querySelector('.menu');
        const closeBtn = document.querySelector('.close');
        
        if (bar && menu) {
            bar.onclick = () => {
                menu.classList.toggle('active');
                // Add/remove body class to prevent scroll but don't hide header
                document.body.classList.toggle('menu-open');
            };
        }
        
        if (closeBtn && menu) {
            closeBtn.onclick = () => {
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            };
        }
    }

    setupEventListeners() {
        // Separate upload buttons - no tabs needed
        document.getElementById('uploadBtn').onclick = () => this.openUploadModal('photo');
        document.getElementById('uploadVideoBtn').onclick = () => this.openUploadModal('video');
        
        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.onclick = () => this.closeModals();
        });

        // Upload form
        document.getElementById('uploadForm').onsubmit = (e) => this.handleUpload(e);
        document.getElementById('photoFile').onchange = (e) => this.handleFileSelect(e);
        document.getElementById('removePreview').onclick = () => this.removePreview();

        // Upload tabs within modal
        document.querySelectorAll('.upload-tab').forEach(tab => {
            tab.onclick = (e) => this.handleUploadTab(e);
        });

        // Content type tabs
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.onclick = (e) => this.handleContentTab(e);
        });

        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); };
            uploadArea.ondragleave = () => uploadArea.classList.remove('drag-over');
            uploadArea.ondrop = (e) => this.handleDrop(e);
            uploadArea.onclick = () => document.getElementById('photoFile').click();
        }

        // Filters and search
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => this.handleFilter(e);
        });
        document.getElementById('searchInput').oninput = (e) => this.handleSearch(e);
        document.getElementById('sortSelect').onchange = (e) => this.handleSort(e);

        // Media modal navigation
        document.getElementById('prevPhoto').onclick = () => this.navigateMedia(-1);
        document.getElementById('nextPhoto').onclick = () => this.navigateMedia(1);
        document.getElementById('likePhoto').onclick = () => this.toggleLike();
        document.getElementById('sharePhoto').onclick = () => this.shareMedia();

        // Load more - Enhanced functionality with Unsplash (photos only)
        document.getElementById('loadMoreBtn').onclick = () => this.loadMoreFromUnsplash();

        // Keyboard navigation
        document.onkeydown = (e) => this.handleKeyboard(e);

        // Window click to close modals
        window.onclick = (e) => {
            if (e.target.classList.contains('modal')) this.closeModals();
        };

        // Cancel button
        const cancelBtn = document.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeModals();
        }
    }

    loadDefaultContent() {
        this.defaultPhotos = [
            {
                id: 'default_photo_1',
                title: 'Petronas Twin Towers',
                url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=500&h=600&fit=crop',
                category: 'culture',
                description: 'Iconic twin towers illuminated at night in Kuala Lumpur',
                location: 'Kuala Lumpur',
                tags: ['kualalumpur', 'towers', 'night', 'cityscape'],
                date: '2024-01-15',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_2',
                title: 'Mount Kinabalu Peak',
                url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Sunrise view from Malaysia\'s highest peak in Sabah',
                location: 'Sabah',
                tags: ['mountain', 'sunrise', 'sabah', 'hiking'],
                date: '2024-02-10',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_3',
                title: 'Langkawi Beach Paradise',
                url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Crystal clear waters and pristine beaches of Langkawi',
                location: 'Langkawi',
                tags: ['beach', 'langkawi', 'tropical', 'paradise'],
                date: '2024-03-05',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_4',
                title: 'Traditional Nasi Lemak',
                url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=600&fit=crop',
                category: 'food',
                description: 'Malaysia\'s national dish served with traditional accompaniments',
                location: 'Kuala Lumpur',
                tags: ['food', 'nasilemak', 'traditional', 'malaysian'],
                date: '2024-03-20',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_5',
                title: 'Georgetown Street Art',
                url: 'https://images.unsplash.com/photo-1518109268916-cfb4e9609b9d?w=500&h=600&fit=crop',
                category: 'culture',
                description: 'Famous street murals in Penang\'s heritage district',
                location: 'Penang',
                tags: ['streetart', 'penang', 'heritage', 'culture'],
                date: '2024-04-12',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_6',
                title: 'Cameron Highlands Tea',
                url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Rolling tea plantations in the cool highlands',
                location: 'Cameron Highlands',
                tags: ['tea', 'highlands', 'plantation', 'green'],
                date: '2024-05-08',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_7',
                title: 'Batu Caves Temple',
                url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop',
                category: 'culture',
                description: 'Famous Hindu temple and cultural landmark',
                location: 'Selangor',
                tags: ['temple', 'culture', 'limestone', 'hindu'],
                date: '2024-06-01',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_8',
                title: 'Taman Negara Rainforest',
                url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Ancient rainforest with diverse wildlife',
                location: 'Pahang',
                tags: ['rainforest', 'wildlife', 'nature', 'jungle'],
                date: '2024-06-15',
                views: 0,
                likes: 0,
                type: 'photo'
            },
            {
                id: 'default_photo_9',
                title: 'Penang Hill View',
                url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Panoramic view from Penang Hill',
                location: 'Penang',
                tags: ['hill', 'view', 'penang', 'panoramic'],
                date: '2024-07-01',
                views: 0,
                likes: 0,
                type: 'photo'
            }
        ];

        // Fixed video URLs using reliable sources - NO MORE VIDEOS WILL BE LOADED
        this.defaultVideos = [
            {
                id: 'default_video_1',
                title: 'Kinabalu Sunrise Timelapse',
                url: 'XinEn/gallery/Sunrise on Mount Kinabalu - Sabah Borneo_ (Timelapse)(720P_HD).mp4',
                thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Beautiful sunrise timelapse from Mount Kinabalu summit',
                location: 'Sabah',
                tags: ['mountain', 'sunrise', 'timelapse', 'sabah'],
                date: '2024-02-15',
                duration: '2:34',
                views: 0,
                likes: 0,
                type: 'video'
            },
            {
                id: 'default_video_2',
                title: 'Street Food Tour KL',
                url: 'XinEn/gallery/klstreetfood.mp4',
                thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=600&fit=crop',
                category: 'food',
                description: 'Exploring the vibrant street food scene in Kuala Lumpur',
                location: 'Kuala Lumpur',
                tags: ['food', 'streetfood', 'kualalumpur', 'tour'],
                date: '2024-03-25',
                duration: '3:45',
                views: 0,
                likes: 0,
                type: 'video'
            },
            {
                id: 'default_video_3',
                title: 'Langkawi Cable Car',
                url: 'XinEn/gallery/Langkawi SkyCab - New Gondola(720P_HD).mp4',
                thumbnail: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&h=600&fit=crop',
                category: 'adventure',
                description: 'Thrilling cable car ride with stunning views of Langkawi',
                location: 'Langkawi',
                tags: ['adventure', 'langkawi', 'cablecar', 'views'],
                date: '2024-04-20',
                duration: '1:52',
                views: 0,
                likes: 0,
                type: 'video'
            },
            {
                id: 'default_video_4',
                title: 'Traditional Dance Performance',
                url: 'XinEn/gallery/traditionaldance.mp4',
                thumbnail: 'https://images.unsplash.com/photo-1518109268916-cfb4e9609b9d?w=500&h=600&fit=crop',
                category: 'culture',
                description: 'Traditional Malaysian dance performance',
                location: 'Kuala Lumpur',
                tags: ['culture', 'dance', 'traditional', 'performance'],
                date: '2024-05-10',
                duration: '4:12',
                views: 0,
                likes: 0,
                type: 'video'
            },
            {
                id: 'default_video_5',
                title: 'Scuba Diving Sipadan',
                url: 'XinEn/gallery/UNDERWATER SCUBA DIVING _ TENGGOL ISLAND_ TERENGGANU_ MALAYSIA - FINALE(720P_HD).mp4',
                thumbnail: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&h=600&fit=crop',
                category: 'adventure',
                description: 'Underwater adventure at Sipadan Island',
                location: 'Sabah',
                tags: ['diving', 'underwater', 'sipadan', 'adventure'],
                date: '2024-06-20',
                duration: '3:28',
                views: 0,
                likes: 0,
                type: 'video'
            },
            {
                id: 'default_video_6',
                title: 'Mangrove Forest Tour',
                url: 'XinEn/gallery/Mangrove forest tour_ Langkawi_ Malaysia(360P).mp4',
                thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=600&fit=crop',
                category: 'nature',
                description: 'Exploring the mangrove forests of Malaysia',
                location: 'Langkawi',
                tags: ['mangrove', 'nature', 'boat', 'tour'],
                date: '2024-07-05',
                duration: '2:45',
                views: 0,
                likes: 0,
                type: 'video'
            }
        ];

        // Load stored views and likes for default content
        [...this.defaultPhotos, ...this.defaultVideos].forEach(item => {
            const viewKey = item.id + '_views';
            const storedViews = this.loadFromStorage(viewKey);
            if (storedViews !== null) item.views = parseInt(storedViews) || 0;
            item.likes = this.likes[item.id] || 0;
        });
    }

    /**
     * Load dynamic content from Unsplash using jQuery REST API calls (OPTIMIZED)
     */
    async loadDynamicContent() {
        console.log('Loading dynamic content from Unsplash via jQuery REST API...');
        
        // Create array of all content to process
        const allContent = [...this.defaultPhotos, ...this.defaultVideos];
        
        // Create promises for parallel execution
        const loadPromises = allContent.map(async (item) => {
            if (this.loadingImages.has(item.id)) return;
            
            this.loadingImages.add(item.id);
            
            try {
                const optimizedQuery = this.unsplashManager.optimizeSearchQuery(item.title);
                console.log(`Fetching image for "${item.title}" with query: "${optimizedQuery}"`);
                
                const images = await this.unsplashManager.searchImages(optimizedQuery, 1);
                
                if (images.length > 0) {
                    const image = images[0];
                    
                    if (item.type === 'video') {
                        // For videos, update thumbnail
                        item.thumbnail = image.url;
                        item.thumb = image.thumb;
                        item.full = image.full;
                        item.alt = image.alt;
                    } else {
                        // For photos, update main image
                        item.url = image.url;
                        item.thumb = image.thumb;
                        item.full = image.full;
                        item.alt = image.alt;
                    }
                    
                    item.unsplashAttribution = image;
                    
                    // Trigger download as per Unsplash API requirements using jQuery AJAX
                    await this.unsplashManager.triggerDownload(image.downloadUrl);
                    console.log(`Updated ${item.type} "${item.title}" with Unsplash image`);
                    
                    // Update gallery in real-time as images load
                    this.renderGallery();
                }
            } catch (error) {
                console.error(`Error loading dynamic image for ${item.title}:`, error);
                // Keep original fallback URL
            } finally {
                this.loadingImages.delete(item.id);
            }
        });
        
        // Execute all promises in parallel with batching to avoid rate limits
        const batchSize = 3; // Process 3 at a time to avoid overwhelming API
        for (let i = 0; i < loadPromises.length; i += batchSize) {
            const batch = loadPromises.slice(i, i + batchSize);
            await Promise.allSettled(batch); // Use allSettled to prevent one failure from stopping others
            
            // Small delay between batches to respect rate limits
            if (i + batchSize < loadPromises.length) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
            }
        }
        
        console.log('Finished loading dynamic content from Unsplash via jQuery REST API');
        
        // Final gallery update
        this.renderGallery();
    }

    /**
     * Load more content from Unsplash using jQuery REST API - PHOTOS ONLY, NO VIDEOS
     */
    async loadMoreFromUnsplash() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        // Disable load more for video-only view
        if (this.currentContentType === 'video') {
            this.showNotification('No additional videos available for loading', 'info');
            return;
        }
        
        const originalText = loadMoreBtn.innerHTML;
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading photos from Unsplash via jQuery AJAX...';
        loadMoreBtn.disabled = true;

        try {
            // Get search term from current search input or use default Malaysia terms
            const searchTerm = document.getElementById('searchInput').value.trim();
            const queries = searchTerm ? [searchTerm] : [
                'malaysia travel',
                'malaysia culture',
                'malaysia food',
                'malaysia nature',
                'malaysia architecture',
                'malaysia landscape'
            ];

            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            console.log(`Loading more content with query: "${randomQuery}" via jQuery AJAX`);
            
            // ONLY load photos - NO videos
            if (this.currentContentType === 'all' || this.currentContentType === 'photo') {
                const images = await this.unsplashManager.searchImages(randomQuery, 6);
                
                if (images.length > 0) {
                    images.forEach((image, index) => {
                        const photo = {
                            id: `unsplash_photo_${Date.now()}_${index}`,
                            title: image.alt || `Malaysia ${randomQuery}`,
                            url: image.url,
                            thumb: image.thumb,
                            full: image.full,
                            category: this.getCategoryFromQuery(randomQuery),
                            description: image.description || image.alt || 'Beautiful Malaysia photo',
                            location: 'Malaysia',
                            tags: randomQuery.split(' '),
                            date: new Date().toISOString().split('T')[0],
                            views: 0,
                            likes: 0,
                            type: 'photo',
                            isFromUnsplash: true,
                            unsplashAttribution: image
                        };

                        this.defaultPhotos.push(photo);
                        
                        // Trigger download using jQuery AJAX
                        this.unsplashManager.triggerDownload(image.downloadUrl);
                    });

                    this.showNotification(`Loaded ${images.length} new photos from Unsplash via jQuery AJAX!`, 'success');
                    console.log(`Successfully loaded ${images.length} new photos via jQuery AJAX`);
                } else {
                    this.showNotification('No more photos available from Unsplash', 'info');
                }
            }

            this.renderGallery();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading more content via jQuery AJAX:', error);
            this.showNotification('Error loading more photos from Unsplash via jQuery AJAX. Please try again.', 'error');
        } finally {
            loadMoreBtn.innerHTML = originalText;
            loadMoreBtn.disabled = false;
        }
    }

    /**
     * Get category from search query
     */
    getCategoryFromQuery(query) {
        const lowercaseQuery = query.toLowerCase();
        if (lowercaseQuery.includes('food') || lowercaseQuery.includes('nasi') || lowercaseQuery.includes('cuisine')) {
            return 'food';
        } else if (lowercaseQuery.includes('culture') || lowercaseQuery.includes('temple') || lowercaseQuery.includes('heritage')) {
            return 'culture';
        } else if (lowercaseQuery.includes('adventure') || lowercaseQuery.includes('diving') || lowercaseQuery.includes('cable')) {
            return 'adventure';
        } else {
            return 'nature';
        }
    }

    /**
     * Setup image suggestion functionality for upload using jQuery REST API
     */
    setupImageSuggestion() {
        const titleInput = document.getElementById('photoTitle');
        
        if (!titleInput) return; // Exit if element doesn't exist

        // Add image suggestion container to upload modal
        const uploadModal = document.getElementById('uploadModal');
        if (!uploadModal) return; // Exit if modal doesn't exist

        const formContainer = uploadModal.querySelector('.upload-form');
        if (!formContainer) return; // Exit if container doesn't exist

        // Check if suggestion container already exists
        let suggestionContainer = document.getElementById('imageSuggestions');
        if (!suggestionContainer) {
            suggestionContainer = document.createElement('div');
            suggestionContainer.id = 'imageSuggestions';
            suggestionContainer.innerHTML = `
                <h4 style="margin: 15px 0 10px 0; font-size: 14px; color: #333;">Suggested Images from Unsplash via jQuery AJAX:</h4>
                <div id="imageGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto;"></div>
            `;
            suggestionContainer.style.display = 'none';
            // Insert after the first form row
            const firstFormRow = formContainer.querySelector('.form-row');
            if (firstFormRow) {
                firstFormRow.insertAdjacentElement('afterend', suggestionContainer);
            } else {
                formContainer.appendChild(suggestionContainer);
            }
        }

        // Debounced image suggestion using jQuery AJAX
        let suggestionTimeout;
        titleInput.addEventListener('input', () => {
            clearTimeout(suggestionTimeout);
            suggestionTimeout = setTimeout(async () => {
                const title = titleInput.value.trim();
                if (title.length > 3 && this.currentUploadType === 'photo') {
                    await this.showImageSuggestions(title);
                } else {
                    suggestionContainer.style.display = 'none';
                }
            }, 1000);
        });
    }

    /**
     * Show image suggestions based on title using jQuery REST API
     */
    async showImageSuggestions(title) {
        const suggestionContainer = document.getElementById('imageSuggestions');
        const imageGrid = document.getElementById('imageGrid');
        
        if (!suggestionContainer || !imageGrid) return;
        
        // Show loading state
        suggestionContainer.style.display = 'block';
        imageGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading suggestions from Unsplash via jQuery AJAX...</div>';
        
        try {
            const optimizedQuery = this.unsplashManager.optimizeSearchQuery(title);
            console.log(`Fetching suggestions for "${title}" with query: "${optimizedQuery}" via jQuery AJAX`);
            
            const images = await this.unsplashManager.searchImages(optimizedQuery, 8);
            
            if (images.length > 0) {
                imageGrid.innerHTML = images.map(image => `
                    <div class="suggestion-item" style="cursor: pointer; position: relative; transition: transform 0.2s;">
                        <img src="${image.thumb}" alt="${image.alt}" 
                             style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid transparent;"
                             data-full-url="${image.url}"
                             data-download-url="${image.downloadUrl}"
                             data-attribution='${JSON.stringify(image)}'>
                        <div style="font-size: 10px; color: #666; margin-top: 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${image.photographer}
                        </div>
                    </div>
                `).join('');
                
                // Add click handlers for image selection
                imageGrid.querySelectorAll('.suggestion-item').forEach(item => {
                    const img = item.querySelector('img');
                    
                    item.addEventListener('mouseenter', () => {
                        item.style.transform = 'scale(1.05)';
                        img.style.border = '2px solid #007bff';
                    });
                    
                    item.addEventListener('mouseleave', () => {
                        item.style.transform = 'scale(1)';
                        img.style.border = '2px solid transparent';
                    });
                    
                    item.addEventListener('click', async () => {
                        const fullUrl = img.dataset.fullUrl;
                        const downloadUrl = img.dataset.downloadUrl;
                        const attribution = JSON.parse(img.dataset.attribution);
                        
                        try {
                            console.log(`Selecting image from Unsplash: ${attribution.id}`);
                            
                            // Use jQuery AJAX to fetch image and convert to blob
                            $.ajax({
                                url: fullUrl,
                                method: 'GET',
                                xhrFields: {
                                    responseType: 'blob'
                                },
                                success: (blob) => {
                                    const file = new File([blob], `unsplash-${attribution.id}.jpg`, { type: 'image/jpeg' });
                                    
                                    // Set file to input
                                    const dataTransfer = new DataTransfer();
                                    dataTransfer.items.add(file);
                                    document.getElementById('photoFile').files = dataTransfer.files;
                                    
                                    // Show preview
                                    this.previewFile(file);
                                    
                                    // Hide suggestions
                                    suggestionContainer.style.display = 'none';
                                    
                                    // Trigger download using jQuery AJAX
                                    this.unsplashManager.triggerDownload(downloadUrl);
                                    
                                    // Store attribution for later use
                                    this.selectedImageAttribution = attribution;
                                    
                                    console.log(`Successfully selected image ${attribution.id} via jQuery AJAX`);
                                },
                                error: (xhr, status, error) => {
                                    console.error('jQuery AJAX Error selecting image:', error);
                                    this.showNotification('Error selecting image via jQuery AJAX. Please try again.', 'error');
                                }
                            });
                            
                        } catch (error) {
                            console.error('Error selecting image:', error);
                            this.showNotification('Error selecting image. Please try again.', 'error');
                        }
                    });
                });
                
                console.log(`Successfully loaded ${images.length} image suggestions via jQuery AJAX`);
            } else {
                imageGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No suggestions found</div>';
            }
        } catch (error) {
            console.error('Error showing suggestions via jQuery AJAX:', error);
            imageGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Error loading suggestions via jQuery AJAX</div>';
        }
    }

    handleUploadTab(e) {
        e.preventDefault();
        document.querySelectorAll('.upload-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        this.currentUploadType = e.target.dataset.type;
        this.updateUploadModalForType();
    }

    updateUploadModalForType() {
        const modalHeader = document.getElementById('uploadModalHeader');
        const modalTitle = document.getElementById('uploadModalTitle');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('photoFile');
        const uploadHint = document.getElementById('uploadHint');
        const titleLabel = document.getElementById('titleLabel');
        const uploadBtn = document.getElementById('uploadSubmitBtn');
        const uploadButtonText = document.getElementById('uploadButtonText');

        if (this.currentUploadType === 'video') {
            modalHeader.classList.add('video');
            modalTitle.innerHTML = '<i class="fas fa-video"></i> Upload Video';
            uploadArea.classList.add('video');
            fileInput.accept = 'video/*';
            uploadHint.textContent = 'Supports MP4, MOV, AVI (Max 200MB)';
            titleLabel.textContent = 'Video Title';
            uploadBtn.classList.add('video');
            uploadButtonText.textContent = 'Upload Video';
        } else {
            modalHeader.classList.remove('video');
            modalTitle.innerHTML = '<i class="fas fa-camera"></i> Upload Photo';
            uploadArea.classList.remove('video');
            fileInput.accept = 'image/*';
            uploadHint.textContent = 'Supports JPG, PNG, GIF (Max 5MB)';
            titleLabel.textContent = 'Photo Title';
            uploadBtn.classList.remove('video');
            uploadButtonText.textContent = 'Upload Photo';
        }
    }

    handleContentTab(e) {
        document.querySelectorAll('.content-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        this.currentContentType = e.target.dataset.type;
        this.displayCount = 6; // Reset display count when switching tabs
        this.renderGallery();
    }

    openUploadModal(type) {
        this.currentUploadType = type;
        this.updateUploadModalForType();
        document.getElementById('uploadModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Setup image suggestions after modal is shown
        setTimeout(() => this.setupImageSuggestion(), 100);
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
        
        // Hide image suggestions when closing modals
        const suggestionContainer = document.getElementById('imageSuggestions');
        if (suggestionContainer) {
            suggestionContainer.style.display = 'none';
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) this.previewFile(file);
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
            this.previewFile(file);
        }
    }

    previewFile(file) {
        if (!this.validateFile(file)) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('previewImg');
            const previewVideo = document.getElementById('previewVideo');
            const imagePreview = document.getElementById('imagePreview');
            const uploadContent = document.querySelector('.upload-content');
            
            uploadContent.style.display = 'none';
            imagePreview.style.display = 'block';
            
            if (file.type.startsWith('image/')) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                if (previewVideo) previewVideo.style.display = 'none';
            } else if (file.type.startsWith('video/')) {
                if (previewVideo) {
                    previewVideo.src = e.target.result;
                    previewVideo.style.display = 'block';
                    
                    // Get video duration and generate thumbnail
                    previewVideo.onloadedmetadata = () => {
                        const duration = previewVideo.duration;
                        this.currentVideoDuration = this.formatVideoDuration(duration);
                        console.log(`Video duration: ${this.currentVideoDuration}`);
                        
                        // Generate thumbnail from video
                        this.generateVideoThumbnail(previewVideo, (thumbnail) => {
                            this.currentVideoThumbnail = thumbnail;
                            console.log('Video thumbnail generated');
                        });
                    };
                }
                previewImg.style.display = 'none';
            }
            
            // Hide suggestions when showing preview
            const suggestionContainer = document.getElementById('imageSuggestions');
            if (suggestionContainer) {
                suggestionContainer.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * Generate thumbnail from video file
     * @param {HTMLVideoElement} video - Video element
     * @param {Function} callback - Callback function with thumbnail data
     */
    generateVideoThumbnail(video, callback) {
        try {
            // Create canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions based on video
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            
            // Seek to 1 second or 10% of video duration for thumbnail
            const seekTime = Math.min(1, video.duration * 0.1);
            video.currentTime = seekTime;
            
            video.onseeked = () => {
                try {
                    // Draw video frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Convert canvas to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                callback(e.target.result);
                            };
                            reader.readAsDataURL(blob);
                        } else {
                            console.warn('Failed to generate video thumbnail blob');
                            callback(null);
                        }
                    }, 'image/jpeg', 0.8);
                } catch (error) {
                    console.error('Error generating video thumbnail:', error);
                    callback(null);
                }
            };
        } catch (error) {
            console.error('Error setting up video thumbnail generation:', error);
            callback(null);
        }
    }

    /**
     * Format video duration from seconds to MM:SS format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatVideoDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    validateFile(file) {
        const expectedType = this.currentUploadType === 'video' ? 'video' : 'image';
        
        if (!file.type.startsWith(expectedType)) {
            this.showError(`Please upload a valid ${expectedType} file`);
            return false;
        }
        
        const maxSize = expectedType === 'video' ? 200 * 1024 * 1024 : 5 * 1024 * 1024; // 200MB for videos, 5MB for images
        
        if (file.size > maxSize) {
            this.showError(`File size must be less than ${expectedType === 'video' ? '200MB' : '5MB'}`);
            return false;
        }

        return true;
    }

    removePreview() {
        document.getElementById('imagePreview').style.display = 'none';
        document.querySelector('.upload-content').style.display = 'block';
        document.getElementById('photoFile').value = '';
        document.getElementById('previewImg').src = '';
        const previewVideo = document.getElementById('previewVideo');
        if (previewVideo) previewVideo.src = '';
        this.selectedImageAttribution = null;
        
        // Reset video properties
        this.currentVideoDuration = '0:00';
        this.currentVideoThumbnail = null;
    }

    handleUpload(e) {
        e.preventDefault();
        const file = document.getElementById('photoFile').files[0];

        if (!file) {
            this.showError('Please select a file to upload');
            return;
        }

        if (!this.validateForm()) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaData = {
                id: `user_${this.currentUploadType}_${Date.now()}`,
                title: document.getElementById('photoTitle').value.trim(),
                url: e.target.result,
                category: document.getElementById('photoCategory').value,
                description: document.getElementById('photoDescription').value.trim(),
                location: document.getElementById('photoLocation').value.trim(),
                tags: document.getElementById('photoTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                date: new Date().toISOString().split('T')[0],
                views: 0,
                likes: 0,
                type: this.currentUploadType,
                isUserContent: true,
                createdAt: Date.now(), // Add timestamp for better tracking
                fileSize: file.size,
                fileName: file.name
            };

            // Add video-specific properties
            if (this.currentUploadType === 'video') {
                mediaData.thumbnail = this.currentVideoThumbnail || e.target.result; // Use generated thumbnail or video data
                mediaData.duration = this.currentVideoDuration || '0:00'; // Use calculated duration
            }

            // Add attribution if image was selected from Unsplash
            if (this.selectedImageAttribution) {
                mediaData.unsplashAttribution = this.selectedImageAttribution;
                this.selectedImageAttribution = null; // Clear after use
            }

            this.addMedia(mediaData);
            this.closeModals();
            this.resetUploadForm();
        };
        reader.readAsDataURL(file);
    }

    validateForm() {
        const title = document.getElementById('photoTitle').value.trim();
        const category = document.getElementById('photoCategory').value;

        if (!title) {
            this.showError(`${this.currentUploadType === 'video' ? 'Video' : 'Photo'} title is required`);
            return false;
        }

        if (!category) {
            this.showError('Please select a category');
            return false;
        }

        return true;
    }

    addMedia(mediaData) {
        try {
            if (mediaData.type === 'video') {
                this.videos.unshift(mediaData);
                this.userVideos.unshift(mediaData);
            } else {
                this.photos.unshift(mediaData);
                this.userPhotos.unshift(mediaData);
            }
            
            // Add to combined user posts array
            if (!this.userPosts.find(p => p.id === mediaData.id)) {
                this.userPosts.unshift(mediaData);
            }
            
            // Save all data including the new post
            this.saveAllUserData();
            this.renderGallery();
            this.updateStats();
            this.showNotification(`${mediaData.type === 'video' ? 'Video' : 'Photo'} uploaded and saved successfully!`, 'success');
            this.showAutoSaveIndicator();
            
            console.log(`Added ${mediaData.type}: ${mediaData.title}`);
        } catch (error) {
            console.error('Error adding media:', error);
            this.showNotification('Error saving media. Please try again.', 'error');
        }
    }

    renderGallery() {
        this.renderUserContent();
        this.renderDefaultContent();
        this.updateFeaturedContent();
        this.updateLoadMoreButton();
    }

    renderUserContent() {
        const container = document.getElementById('galleryGrid');
        
        const allUserContent = [...this.photos, ...this.videos];
        if (allUserContent.length === 0) {
            container.innerHTML = '';
            return;
        }

        const filteredContent = this.filterContent(allUserContent);
        container.innerHTML = filteredContent.map((item, index) => this.createMediaCard(item, index, 'user')).join('');
    }

    renderDefaultContent() {
        const container = document.getElementById('defaultGallery');
        const allDefaultContent = [...this.defaultPhotos, ...this.defaultVideos];
        const filteredContent = this.filterContent(allDefaultContent);
        
        // Show only displayCount items
        const itemsToShow = filteredContent.slice(0, this.displayCount);
        container.innerHTML = itemsToShow.map((item, index) => this.createMediaCard(item, index, 'default')).join('');
    }

    createMediaCard(item, index, source) {
        const isLiked = this.likes[item.id] > 0;
        const isVideo = item.type === 'video';
        const mediaUrl = isVideo ? (item.thumbnail || item.url) : item.url;
        
        // Add Unsplash attribution if available
        const attribution = item.unsplashAttribution ? 
            `<div class="unsplash-attribution">${this.unsplashManager.generateAttribution(item.unsplashAttribution)}</div>` : '';
        
        // Add user content indicator
        const userIndicator = item.isUserContent ? 
            `<div class="user-content-indicator"><i class="fas fa-user"></i> Your ${item.type}</div>` : '';
        
        return `
            <div class="media-card ${item.isUserContent ? 'user-content' : ''}" data-category="${item.category}" data-type="${item.type}" data-source="${source}" data-index="${index}" data-id="${item.id}">
                <div class="media-content" onclick="galleryManager.openMediaModal('${item.id}', '${source}')">
                    ${isVideo ? 
                        `<video muted preload="metadata" poster="${item.thumbnail || ''}">
                            <source src="${item.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>` : 
                        `<img src="${item.url}" alt="${item.title}" loading="lazy">`
                    }
                    <div class="media-type-indicator ${item.type}">
                        <i class="fas fa-${isVideo ? 'video' : 'camera'}"></i> ${isVideo ? 'Video' : 'Photo'}
                    </div>
                    ${isVideo ? `<div class="video-duration">${item.duration}</div>` : ''}
                    ${userIndicator}
                    <div class="media-overlay">
                        <div class="media-stats">
                            <span><i class="fas fa-eye"></i> ${item.views}</span>
                            <span><i class="fas fa-heart"></i> ${item.likes}</span>
                        </div>
                        <button class="view-btn ${isVideo ? 'video' : ''}">
                            <i class="fas fa-${isVideo ? 'play' : 'expand'}"></i>
                        </button>
                    </div>
                </div>
                <div class="media-info">
                    <h3>${item.title}</h3>
                    <div class="media-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${item.location || 'Unknown'}</span>
                        <span class="photo-date">${this.formatDate(item.date)}</span>
                    </div>
                    ${attribution}
                    <div class="media-actions">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="galleryManager.toggleMediaLike('${item.id}', this)">
                            <i class="fas fa-heart"></i> ${item.likes}
                        </button>
                        <button class="share-btn" onclick="galleryManager.shareMedia('${item.id}')">
                            <i class="fas fa-share"></i>
                        </button>
                        ${item.isUserContent ? `<button class="delete-btn" onclick="galleryManager.deleteMedia('${item.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    filterContent(content) {
        let filtered = content;

        // Filter by content type
        if (this.currentContentType !== 'all') {
            filtered = filtered.filter(item => item.type === this.currentContentType);
        }

        // Filter by category
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => item.category === this.currentFilter);
        }

        // Filter by search term
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Sort content
        const sortBy = document.getElementById('sortSelect').value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest': return new Date(b.date) - new Date(a.date);
                case 'oldest': return new Date(a.date) - new Date(b.date);
                case 'views': return b.views - a.views;
                case 'likes': return b.likes - a.likes;
                case 'title': return a.title.localeCompare(b.title);
                default: return 0;
            }
        });

        return filtered;
    }

    handleFilter(e) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.displayCount = 6; // Reset display count when filtering
        this.renderGallery();
    }

    handleSearch(e) {
        this.displayCount = 6; // Reset display count when searching
        this.renderGallery();
    }

    handleSort(e) {
        this.renderGallery();
    }

    openMediaModal(mediaId, source) {
        const media = this.getMediaById(mediaId, source);
        if (!media) return;

        // Increment view count
        media.views++;
        this.saveMediaStats(media);

        // Update modal content
        const modalHeader = document.getElementById('photoModalHeader');
        const modalImage = document.getElementById('modalImage');
        const modalVideo = document.getElementById('modalVideo');
        
        // Set header color based on media type
        if (media.type === 'video') {
            modalHeader.classList.add('video');
        } else {
            modalHeader.classList.remove('video');
        }
        
        // Show appropriate media element
        if (media.type === 'video') {
            if (modalVideo) {
                modalVideo.src = media.url;
                modalVideo.style.display = 'block';
            }
            modalImage.style.display = 'none';
        } else {
            modalImage.src = media.url;
            modalImage.style.display = 'block';
            if (modalVideo) modalVideo.style.display = 'none';
        }

        // Update modal info with correct element IDs
        document.getElementById('modalPhotoTitle').textContent = media.title;
        document.getElementById('modalPhotoDate').innerHTML = `<i class="fas fa-calendar"></i> ${this.formatDate(media.date)}`;
        document.getElementById('modalPhotoLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${media.location || 'Unknown Location'}`;
        document.getElementById('modalPhotoViews').innerHTML = `<i class="fas fa-eye"></i> <span id="viewCount">${media.views}</span> views`;
        document.getElementById('modalPhotoDescription').textContent = media.description || 'No description available';
        document.getElementById('modalPhotoTags').innerHTML = media.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
        document.getElementById('likeCount').textContent = media.likes;
        
        // Show attribution if it exists
        const photoInfo = document.querySelector('.photo-info');
        let attributionContainer = document.getElementById('photoAttribution');
        if (media.unsplashAttribution) {
            if (!attributionContainer) {
                attributionContainer = document.createElement('div');
                attributionContainer.id = 'photoAttribution';
                attributionContainer.className = 'unsplash-attribution';
                photoInfo.appendChild(attributionContainer);
            }
            attributionContainer.innerHTML = this.unsplashManager.generateAttribution(media.unsplashAttribution);
            attributionContainer.style.display = 'block';
        } else if (attributionContainer) {
            attributionContainer.style.display = 'none';
        }
        
        // Show user content indicator in modal
        let userIndicator = document.getElementById('userContentIndicator');
        if (media.isUserContent) {
            if (!userIndicator) {
                userIndicator = document.createElement('div');
                userIndicator.id = 'userContentIndicator';
                userIndicator.className = 'user-content-modal-indicator';
                photoInfo.appendChild(userIndicator);
            }
            userIndicator.innerHTML = `<i class="fas fa-user"></i> Your ${media.type}`;
            userIndicator.style.display = 'block';
        } else if (userIndicator) {
            userIndicator.style.display = 'none';
        }
        
        // Update like button state
        const likeBtn = document.getElementById('likePhoto');
        likeBtn.classList.toggle('liked', this.likes[media.id] > 0);

        // Store current media for navigation
        this.currentMediaId = mediaId;
        this.currentMediaSource = source;

        document.getElementById('photoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    getMediaById(id, source) {
        const allUserContent = [...this.photos, ...this.videos];
        const allDefaultContent = [...this.defaultPhotos, ...this.defaultVideos];
        
        if (source === 'user') {
            return allUserContent.find(item => item.id === id);
        } else {
            return allDefaultContent.find(item => item.id === id);
        }
    }

    navigateMedia(direction) {
        const allContent = [...this.photos, ...this.videos, ...this.defaultPhotos, ...this.defaultVideos];
        const currentIndex = allContent.findIndex(item => item.id === this.currentMediaId);
        const newIndex = (currentIndex + direction + allContent.length) % allContent.length;
        const newMedia = allContent[newIndex];
        
        const source = newMedia.isUserContent ? 'user' : 'default';
        this.openMediaModal(newMedia.id, source);
    }

    toggleMediaLike(mediaId, element) {
        const media = this.getMediaById(mediaId, this.currentMediaSource) || 
                     [...this.photos, ...this.videos, ...this.defaultPhotos, ...this.defaultVideos]
                     .find(item => item.id === mediaId);
        
        if (!media) return;

        if (this.likes[mediaId]) {
            this.likes[mediaId] = 0;
            media.likes = Math.max(0, media.likes - 1);
        } else {
            this.likes[mediaId] = 1;
            media.likes++;
        }

        this.saveData();
        this.saveMediaStats(media);
        
        // Auto-save user content likes
        if (media.isUserContent) {
            this.saveAllUserData();
            this.showAutoSaveIndicator();
        }
        
        // Update UI
        if (element) {
            element.classList.toggle('liked', this.likes[mediaId] > 0);
            element.innerHTML = `<i class="fas fa-heart"></i> ${media.likes}`;
        }

        // Update modal if open
        const likeCountElement = document.getElementById('likeCount');
        if (likeCountElement) {
            likeCountElement.textContent = media.likes;
            document.getElementById('likePhoto').classList.toggle('liked', this.likes[mediaId] > 0);
        }

        this.renderGallery(); // Refresh to show updated stats
    }

    toggleLike() {
        this.toggleMediaLike(this.currentMediaId);
    }

    deleteMedia(mediaId) {
        if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
            try {
                // Remove from arrays
                this.photos = this.photos.filter(item => item.id !== mediaId);
                this.videos = this.videos.filter(item => item.id !== mediaId);
                this.userPhotos = this.userPhotos.filter(item => item.id !== mediaId);
                this.userVideos = this.userVideos.filter(item => item.id !== mediaId);
                this.userPosts = this.userPosts.filter(item => item.id !== mediaId);
                
                // Remove stats
                delete this.likes[mediaId];
                delete this.views[mediaId];
                
                // Save updated data
                this.saveAllUserData();
                this.renderGallery();
                this.updateStats();
                this.showNotification('Content deleted and saved successfully', 'success');
                this.showAutoSaveIndicator();
                
                console.log(`Deleted media: ${mediaId}`);
            } catch (error) {
                console.error('Error deleting media:', error);
                this.showNotification('Error deleting content', 'error');
            }
        }
    }

    updateFeaturedContent() {
        const allContent = [...this.photos, ...this.videos, ...this.defaultPhotos, ...this.defaultVideos];
        if (allContent.length > 0) {
            const randomMedia = allContent[Math.floor(Math.random() * allContent.length)];
            const featuredImg = document.getElementById('featuredImage');
            
            if (featuredImg) {
                if (randomMedia.type === 'video') {
                    featuredImg.src = randomMedia.thumbnail || randomMedia.url;
                } else {
                    featuredImg.src = randomMedia.url;
                }
            }
        }
    }

    updateStats() {
        const totalPhotos = this.photos.length + this.defaultPhotos.length;
        const totalVideos = this.videos.length + this.defaultVideos.length;
        const totalViews = [...this.photos, ...this.videos, ...this.defaultPhotos, ...this.defaultVideos]
                          .reduce((sum, item) => sum + item.views, 0);
        const userPhotos = this.userPhotos.length;
        const userVideos = this.userVideos.length;
        
        document.getElementById('totalPhotos').textContent = totalPhotos;
        document.getElementById('totalVideos').textContent = totalVideos;
        document.getElementById('totalViews').textContent = totalViews;
        
        // Update tab counts
        document.getElementById('allCount').textContent = totalPhotos + totalVideos;
        document.getElementById('photoCount').textContent = totalPhotos;
        document.getElementById('videoCount').textContent = totalVideos;
        
        // Add user content stats if elements exist
        const userStatsElement = document.getElementById('userStats');
        if (userStatsElement) {
            userStatsElement.innerHTML = `
                <div class="user-stats-item">
                    <i class="fas fa-user"></i> Your Content: ${userPhotos + userVideos}
                </div>
                <div class="user-stats-item">
                    <i class="fas fa-camera"></i> Your Photos: ${userPhotos}
                </div>
                <div class="user-stats-item">
                    <i class="fas fa-video"></i> Your Videos: ${userVideos}
                </div>
            `;
        }
    }

    // Enhanced Load More functionality
    loadMore() {
        const allDefaultContent = [...this.defaultPhotos, ...this.defaultVideos];
        const filteredContent = this.filterContent(allDefaultContent);
        
        if (this.displayCount >= filteredContent.length) {
            // If no more local content, try to load from Unsplash (photos only)
            this.loadMoreFromUnsplash();
            return;
        }
        
        this.displayCount += this.itemsPerLoad;
        this.renderGallery();
        this.showNotification(`Loaded ${this.itemsPerLoad} more items`, 'success');
    }

    // Update Load More button visibility and text - Modified for video restriction
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const allDefaultContent = [...this.defaultPhotos, ...this.defaultVideos];
        const filteredContent = this.filterContent(allDefaultContent);
        
        // Hide load more button when viewing videos only
        if (this.currentContentType === 'video') {
            if (this.displayCount >= filteredContent.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                const remaining = filteredContent.length - this.displayCount;
                loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Load More (${remaining} remaining)`;
                loadMoreBtn.style.display = 'block';
            }
        } else {
            // For 'all' or 'photo' views, show load more button
            if (this.displayCount >= filteredContent.length) {
                loadMoreBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Load More Photos from Unsplash via jQuery AJAX';
            } else {
                const remaining = filteredContent.length - this.displayCount;
                loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Load More (${remaining} remaining)`;
            }
            loadMoreBtn.style.display = 'block';
        }
    }

    handleKeyboard(e) {
        if (document.getElementById('photoModal').style.display === 'block') {
            if (e.key === 'ArrowLeft') this.navigateMedia(-1);
            if (e.key === 'ArrowRight') this.navigateMedia(1);
            if (e.key === 'Escape') this.closeModals();
        }
    }

    // Enhanced Share functionality with Copy Link
    shareMedia(mediaId) {
        let media;
        
        // If no mediaId provided, use current media from modal
        if (!mediaId && this.currentMediaId) {
            mediaId = this.currentMediaId;
            media = this.getMediaById(mediaId, this.currentMediaSource);
        } else if (mediaId) {
            // Try to find media in both user and default content
            media = this.getMediaById(mediaId, 'user') || this.getMediaById(mediaId, 'default');
            if (!media) {
                // Search all content as fallback
                media = [...this.photos, ...this.videos, ...this.defaultPhotos, ...this.defaultVideos]
                       .find(item => item.id === mediaId);
            }
        }

        if (!media) {
            console.error('Media not found for sharing:', mediaId);
            this.showNotification('Unable to share content', 'error');
            return;
        }

        const shareText = `Check out this amazing ${media.type} from Malaysia: "${media.title}" - ${media.description}`;
        const shareUrl = window.location.href;

        // Show share options modal
        this.showShareOptions(media, shareText, shareUrl);
    }

    showShareOptions(media, shareText, shareUrl) {
        // Remove existing share modal if any
        const existingModal = document.querySelector('.share-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const shareModal = document.createElement('div');
        shareModal.className = 'share-modal';
        shareModal.innerHTML = `
            <div class="share-modal-content">
                <h3>Share "${media.title}"</h3>
                <div class="share-options">
                    <button class="share-option facebook" onclick="galleryManager.shareToFacebook('${encodeURIComponent(shareText)}', '${encodeURIComponent(shareUrl)}')">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </button>
                    <button class="share-option twitter" onclick="galleryManager.shareToTwitter('${encodeURIComponent(shareText)}', '${encodeURIComponent(shareUrl)}')">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button class="share-option whatsapp" onclick="galleryManager.shareToWhatsApp('${encodeURIComponent(shareText)}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="share-option copy" onclick="galleryManager.copyToClipboard('${shareUrl}')">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>
                <button class="close-share" onclick="galleryManager.closeShareModal()">×</button>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        // Add click outside to close
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                galleryManager.closeShareModal();
            }
        });
        
        setTimeout(() => shareModal.classList.add('show'), 100);
    }

    closeShareModal() {
        const shareModal = document.querySelector('.share-modal');
        if (shareModal) {
            shareModal.classList.remove('show');
            setTimeout(() => shareModal.remove(), 300);
        }
    }

    shareToFacebook(text, url) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
        this.closeShareModal();
    }

    shareToTwitter(text, url) {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
        this.closeShareModal();
    }

    shareToWhatsApp(text) {
        window.open(`https://wa.me/?text=${text}`, '_blank');
        this.closeShareModal();
    }

    // Enhanced Copy to clipboard functionality with multiple fallbacks
    copyToClipboard(url) {
        console.log('Attempting to copy URL:', url);
        
        // Method 1: Modern Clipboard API (requires HTTPS)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {
                console.log('Clipboard API success');
                this.showNotification('Link copied to clipboard!', 'success');
                this.closeShareModal();
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                this.fallbackCopyToClipboard(url);
            });
        } else {
            // Method 2: Fallback for older browsers or non-HTTPS
            console.log('Using fallback copy method');
            this.fallbackCopyToClipboard(url);
        }
    }

    fallbackCopyToClipboard(url) {
        try {
            // Create a temporary input element
            const tempInput = document.createElement('input');
            tempInput.style.position = 'fixed';
            tempInput.style.left = '-9999px';
            tempInput.style.top = '-9999px';
            tempInput.value = url;
            document.body.appendChild(tempInput);
            
            // Select and copy
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices
            
            const successful = document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            if (successful) {
                console.log('Fallback copy successful');
                this.showNotification('Link copied to clipboard!', 'success');
                this.closeShareModal();
            } else {
                console.error('Fallback copy failed');
                this.showCopyUrlPrompt(url);
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
            this.showCopyUrlPrompt(url);
        }
    }

    // Method 3: Show URL for manual copy if all else fails
    showCopyUrlPrompt(url) {
        const promptModal = document.createElement('div');
        promptModal.className = 'share-modal show';
        promptModal.innerHTML = `
            <div class="share-modal-content">
                <h3>Copy Link</h3>
                <p>Please copy this link manually:</p>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #e2e8f0;">
                    <input type="text" value="${url}" readonly style="width: 100%; border: none; background: none; font-family: monospace; font-size: 0.9rem;" onclick="this.select()">
                </div>
                <button class="share-option copy" onclick="this.parentElement.parentElement.remove()" style="width: 100%; background: #667eea;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        // Remove existing share modal
        this.closeShareModal();
        
        // Add new prompt modal
        document.body.appendChild(promptModal);
        
        // Auto-select the URL
        const urlInput = promptModal.querySelector('input');
        setTimeout(() => {
            urlInput.focus();
            urlInput.select();
        }, 100);
        
        // Close on outside click
        promptModal.addEventListener('click', (e) => {
            if (e.target === promptModal) {
                promptModal.remove();
            }
        });
    }

    saveData() {
        this.saveToStorage('galleryPhotos', this.photos);
        this.saveToStorage('galleryVideos', this.videos);
        this.saveToStorage('galleryLikes', this.likes);
        this.saveToStorage('galleryViews', this.views);
    }

    saveMediaStats(media) {
        if (media.isUserContent) {
            // User content is saved with the main data
            this.saveAllUserData();
            this.showAutoSaveIndicator();
        } else {
            // Default content stats saved separately
            this.saveToStorage(media.id + '_views', media.views);
            this.likes[media.id] = media.likes;
            this.saveToStorage('galleryLikes', this.likes);
        }
    }

    resetUploadForm() {
        document.getElementById('uploadForm').reset();
        this.removePreview();
        document.getElementById('uploadError').textContent = '';
        // Reset to photo tab
        document.querySelectorAll('.upload-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector('.upload-tab[data-type="photo"]').classList.add('active');
        this.currentUploadType = 'photo';
        this.updateUploadModalForType();
        this.selectedImageAttribution = null;
        
        // Reset video properties
        this.currentVideoDuration = '0:00';
        this.currentVideoThumbnail = null;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showError(message) {
        const errorElement = document.getElementById('uploadError');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> 
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Social Media Sharing Functions
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('Check out this amazing Malaysia Travel Gallery with photos and videos!');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank', 'width=600,height=400');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Discover the beauty of Malaysia through this amazing travel gallery! 🇲🇾 #Malaysia #Travel #Gallery #Videos');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this amazing Malaysia Travel Gallery with photos and videos! ' + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Initialize Gallery
let galleryManager;
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Gallery Manager with enhanced localStorage and jQuery REST API integration...');
    galleryManager = new GalleryManager();
});