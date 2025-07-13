// Enhanced Blog Manager Class with in-memory storage (localStorage replacement)
class BlogManager {
    constructor() {
        // Use localStorage for persistent storage across page refreshes
        this.storage = {
            useLocalStorage: true // Flag to indicate we're using localStorage
        };
        
        // Initialize data from in-memory storage
        this.posts = this.loadFromStorage('blog_user_posts') || [];
        this.viewCounts = this.loadFromStorage('blog_view_counts') || {};
        this.formDraft = this.loadFromStorage('blog_form_draft') || null;
        this.userSettings = this.loadFromStorage('blog_user_settings') || {
            autoSave: true,
            showNotifications: true,
            defaultCategory: '',
            defaultAuthor: ''
        };
        
        this.currentEditIndex = null;
        this.currentPostType = '';
        this.currentPostId = '';
        
        // Auto-save timer
        this.autoSaveTimer = null;
        
        this.init();
    }

    // Enhanced localStorage operations for persistent storage
    loadFromStorage(key) {
        try {
            // Use localStorage for persistent storage
            const dataStr = localStorage.getItem(key);
            if (!dataStr) return null;
            
            const data = JSON.parse(dataStr);
            
            // Handle versioned data format
            if (data && typeof data === 'object' && data.version) {
                return this.migrateDataVersion(data, key);
            }
            
            return data;
        } catch (error) {
            console.warn(`Error loading ${key} from localStorage:`, error);
            // If localStorage fails, clear corrupted data
            try {
                localStorage.removeItem(key);
            } catch (clearError) {
                console.warn('Failed to clear corrupted localStorage item:', clearError);
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
            
            // Save to localStorage for persistence
            localStorage.setItem(key, JSON.stringify(versionedData));
            
            // Schedule auto-save for user posts
            if (key.includes('user_posts') && this.userSettings.autoSave) {
                this.scheduleAutoSave();
            }
            
            console.log(`Successfully saved ${key} to localStorage`);
        } catch (error) {
            console.warn(`Error saving ${key} to localStorage:`, error);
            
            // Handle localStorage quota exceeded
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded(key, data);
            } else {
                this.showNotification('Failed to save data. Your changes may be lost.', 'warning');
            }
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

    // Handle localStorage quota exceeded
    handleStorageQuotaExceeded(key, data) {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        
        try {
            // Clean up old cached data
            this.cleanupOldCache();
            
            // Try saving again
            const versionedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(key, JSON.stringify(versionedData));
            
            this.showNotification('Storage cleaned up and data saved', 'success');
        } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
            this.showNotification('Storage full! Some data may not be saved.', 'error');
            
            // Offer to export data
            this.offerDataExport();
        }
    }

    // Clean up old cached data from localStorage
    cleanupOldCache() {
        const keysToClean = [];
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        // Iterate through all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('blog_cache_')) {
                try {
                    const dataStr = localStorage.getItem(key);
                    const data = JSON.parse(dataStr);
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
            this.saveToStorage('blog_user_posts', this.posts);
            this.saveToStorage('blog_view_counts', this.viewCounts);
            this.saveToStorage('blog_user_settings', this.userSettings);
            
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
            // Load user posts
            const savedPosts = this.loadFromStorage('blog_user_posts') || [];
            this.posts = savedPosts;
            
            // Load view counts
            const savedViewCounts = this.loadFromStorage('blog_view_counts') || {};
            this.viewCounts = savedViewCounts;
            
            // Load user settings
            const savedSettings = this.loadFromStorage('blog_user_settings') || {};
            this.userSettings = { ...this.userSettings, ...savedSettings };
            
            console.log(`Loaded ${savedPosts.length} user posts from localStorage`);
            
            if (savedPosts.length > 0) {
                this.showNotification(`Restored ${savedPosts.length} saved posts from localStorage`, 'success');
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
                posts: this.posts,
                viewCounts: this.viewCounts,
                userSettings: this.userSettings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `blog_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                    if (!importData.version || !importData.posts) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Merge imported data
                    if (importData.posts) {
                        importData.posts.forEach(post => {
                            if (!this.posts.find(p => p.title === post.title && p.date === post.date)) {
                                this.posts.push(post);
                            }
                        });
                    }
                    
                    // Merge view counts and settings
                    Object.assign(this.viewCounts, importData.viewCounts || {});
                    Object.assign(this.userSettings, importData.userSettings || {});
                    
                    // Save imported data
                    this.saveAllUserData();
                    this.renderPosts();
                    this.updateStats();
                    
                    this.showNotification(`Imported ${importData.posts.length} posts successfully`, 'success');
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
                <p>Your browser's memory storage is full. Would you like to export your data as a backup?</p>
                <div class="modal-actions">
                    <button onclick="blogManager.exportUserData(); this.parentElement.parentElement.parentElement.remove();" class="btn-primary">
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

    // Clear all user data
    clearAllUserData() {
        if (confirm('Are you sure you want to clear all your posts and data? This action cannot be undone.')) {
            try {
                // Clear arrays
                this.posts = [];
                this.viewCounts = {};
                this.formDraft = null;

                // Clear localStorage
                localStorage.removeItem('blog_user_posts');
                localStorage.removeItem('blog_view_counts');
                localStorage.removeItem('blog_form_draft');
                localStorage.setItem('blog_user_settings', JSON.stringify({
                    version: '1.0',
                    timestamp: Date.now(),
                    data: {
                        autoSave: true,
                        showNotifications: true,
                        defaultCategory: '',
                        defaultAuthor: ''
                    }
                }));

                // Re-save cleaned data
                this.saveAllUserData();
                this.renderPosts();
                this.updateStats();

                this.showNotification('All user data cleared successfully', 'success');
            } catch (error) {
                console.error('Error clearing user data:', error);
                this.showNotification('Error clearing data', 'error');
            }
        }
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

    async init() {
        console.log('🚀 Initializing BlogManager...');
        
        // Load user data first
        this.loadAllUserData();
        
        this.renderPosts();
        this.setupEventListeners();
        this.updateStats();
        this.setupMobileMenu();
        this.loadStoredData();
        this.setupFormAutoSave();
        this.createAutoSaveIndicator(); // Add auto-save indicator
        
        console.log('✅ BlogManager initialized successfully');
    }

    setupMobileMenu() {
        const bar = document.querySelector('.bar');
        const menu = document.querySelector('.menu');
        const closeBtn = document.querySelector('.close');
        const menuLinks = document.querySelectorAll('.menu ul li a');
        
        // DEBUG: Log elements found
        console.log('DEBUG - Mobile menu elements:', { bar, menu, closeBtn, menuLinksCount: menuLinks.length });
        
        if (bar && menu) {
            bar.onclick = () => {
                menu.classList.add('active');
                document.body.classList.add('menu-open');
            };
        }
        
        if (closeBtn && menu) {
            closeBtn.onclick = () => {
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            };
        }
        
        // Close menu when clicking on menu links
        menuLinks.forEach(link => {
            link.onclick = () => {
                if (menu) {
                    menu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            };
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (menu && menu.classList.contains('active') && 
                !menu.contains(e.target) && 
                bar && !bar.contains(e.target)) {
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu && menu.classList.contains('active')) {
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // CRITICAL: Check if all required elements exist with detailed debugging
        const openModalBtn = document.getElementById('openModal');
        const blogForm = document.getElementById('blogForm');
        const closeButtons = document.querySelectorAll('.close');
        const cancelButton = document.querySelector('.btn-cancel');
        
        // DEBUG: Log all element states
        console.log('DEBUG - Required elements check:', {
            openModalBtn: !!openModalBtn,
            blogForm: !!blogForm,
            closeButtonsCount: closeButtons.length,
            cancelButton: !!cancelButton
        });
        
        if (!openModalBtn) {
            console.error('❌ ERROR: openModal button not found!');
            console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        
        if (!blogForm) {
            console.error('❌ ERROR: blogForm not found!');
            console.log('Available forms:', document.querySelectorAll('form'));
            return;
        }
        
        console.log('✅ All required elements found');
        
        // Setup event listeners with error handling and null checks
        if (openModalBtn) {
            openModalBtn.onclick = () => {
                console.log('📝 Opening create modal...');
                this.openCreateModal();
            };
        }
        
        // MODIFIED: Only X button can close the modal now
        closeButtons.forEach(btn => {
            if (btn) {
                btn.onclick = () => {
                    console.log('❌ Closing modal via X button...');
                    this.closeModals();
                };
            }
        });
        
        // REMOVED: Cancel button functionality - button will be hidden/disabled
        // Cancel button no longer closes the modal
        if (cancelButton) {
            cancelButton.style.display = 'none'; // Hide cancel button
        }
        
        // Form submit handler with null check
        if (blogForm) {
            blogForm.addEventListener('submit', (e) => {
                console.log('🚀 FORM SUBMIT EVENT TRIGGERED!');
                this.handleSubmit(e);
            });
        }
        
        // Setup other event listeners with null checks
        const postImage = document.getElementById('postImage');
        const removeImage = document.getElementById('removeImage');
        const postExcerpt = document.getElementById('postExcerpt');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        // DEBUG: Log optional elements
        console.log('DEBUG - Optional elements check:', {
            postImage: !!postImage,
            removeImage: !!removeImage,
            postExcerpt: !!postExcerpt,
            searchInput: !!searchInput,
            sortSelect: !!sortSelect
        });
        
        if (postImage) {
            postImage.onchange = (e) => this.handleImageUpload(e);
        }
        
        if (removeImage) {
            removeImage.onclick = () => this.removeImage();
        }
        
        if (postExcerpt) {
            postExcerpt.oninput = (e) => this.updateWordCount(e);
        }
        
        if (searchInput) {
            searchInput.oninput = (e) => this.handleSearch(e);
        }
        
        // Filter buttons with null checks
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn) {
                btn.onclick = (e) => this.handleFilter(e);
            }
        });
        
        if (sortSelect) {
            sortSelect.onchange = (e) => this.handleSort(e);
        }
        
        // REMOVED: Window click handler for modal close
        // Users can no longer close modal by clicking outside
        
        // REMOVED: Escape key to close modal
        // Users can no longer close modal with Escape key
        
        console.log('✅ Event listeners setup complete - Only X button can close modal');
    }

    setupFormAutoSave() {
        const formFields = ['authorName', 'postCategory', 'postTitle', 'postExcerpt', 'postTags'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            console.log(`DEBUG - Form field ${fieldId}:`, !!field);
            
            if (field) {
                let saveTimeout;
                field.oninput = (e) => {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        if (this.currentEditIndex === null) {
                            this.saveFormDraft();
                        }
                    }, 2000);
                    
                    if (fieldId === 'postExcerpt') this.updateWordCount(e);
                };
                
                field.onblur = () => {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        if (this.currentEditIndex === null) {
                            this.saveFormDraft();
                        }
                    }, 1000);
                };
            }
        });
    }

    saveFormDraft() {
        // Only save draft for new posts, not edits
        if (this.currentEditIndex !== null) return;
        
        // Check if there are actually any changes to save
        if (!this.hasUnsavedChanges()) return;
        
        const formData = {
            authorName: document.getElementById('authorName')?.value || '',
            postCategory: document.getElementById('postCategory')?.value || '',
            postTitle: document.getElementById('postTitle')?.value || '',
            postExcerpt: document.getElementById('postExcerpt')?.value || '',
            postTags: document.getElementById('postTags')?.value || '',
            savedAt: new Date().toISOString()
        };
        
        // Check if data has actually changed from last save
        if (this.formDraft && JSON.stringify(formData) === JSON.stringify({...this.formDraft, savedAt: this.formDraft.savedAt})) {
            return; // No changes, don't save
        }
        
        // Save image data if it exists - store the actual base64 data
        const imagePreview = document.getElementById('previewImg');
        if (imagePreview && imagePreview.src && imagePreview.src.startsWith('data:')) {
            formData.previewImageData = imagePreview.src; // Save the base64 data
            formData.hasImage = true;
        } else {
            formData.hasImage = false;
        }
        
        // Store in memory storage
        this.formDraft = formData;
        this.saveToStorage('blog_form_draft', formData);
        
        console.log('📁 Draft saved to localStorage');
    }

    loadFormDraft() {
        // Load from memory storage
        const savedDraft = this.loadFromStorage('blog_form_draft');
        if (savedDraft) {
            this.formDraft = savedDraft;
        }
        
        if (this.formDraft) {
            try {
                const formData = this.formDraft;
                
                // Check if draft is not too old (7 days)
                const savedDate = new Date(formData.savedAt);
                const now = new Date();
                const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff > 7) {
                    this.clearFormDraft();
                    return false;
                }
                
                // Load saved values into form fields
                Object.keys(formData).forEach(key => {
                    if (key !== 'savedAt' && key !== 'previewImageData' && key !== 'hasImage') {
                        const field = document.getElementById(key);
                        if (field && formData[key]) {
                            field.value = formData[key];
                        }
                    }
                });
                
                // Restore image preview if exists
                if (formData.hasImage && formData.previewImageData) {
                    this.showImagePreview(formData.previewImageData);
                    console.log('📷 Image preview restored from draft');
                } else {
                    // Make sure image preview is hidden if no image in draft
                    this.hideImagePreview();
                }
                
                // Update word count for excerpt
                if (formData.postExcerpt) {
                    this.updateWordCount({ target: { value: formData.postExcerpt } });
                }
                
                // Show notification that draft was restored
                const savedTime = new Date(formData.savedAt).toLocaleString();
                this.showNotification(`Draft restored from ${savedTime}`, 'success');
                
                return true;
            } catch (error) {
                console.error('Error loading form draft:', error);
                this.clearFormDraft();
            }
        }
        return false;
    }

    clearFormDraft() {
        this.formDraft = null;
        
        // Clear from localStorage
        localStorage.removeItem('blog_form_draft');
        console.log('📁 Draft cleared from localStorage');
    }

    openCreateModal() {
        console.log('📝 Opening create modal...');
        this.currentEditIndex = null;
        
        const modalTitle = document.getElementById('modalTitle');
        const submitText = document.getElementById('submitText');
        const blogForm = document.getElementById('blogForm');
        
        // DEBUG: Check modal elements
        console.log('DEBUG - Modal elements:', {
            modalTitle: !!modalTitle,
            submitText: !!submitText,
            blogForm: !!blogForm
        });
        
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Create New Post';
        if (submitText) submitText.textContent = 'Publish';
        if (blogForm) blogForm.reset();
        
        this.hideImagePreview();
        
        // FIXED: Check if we have a valid draft before loading
        const savedDraft = this.loadFromStorage('blog_form_draft');
        
        // Only load draft if it exists and is not too old
        let draftLoaded = false;
        if (savedDraft && savedDraft.savedAt) {
            const savedDate = new Date(savedDraft.savedAt);
            const now = new Date();
            const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 7) {
                draftLoaded = this.loadFormDraft();
                console.log('🔄 Draft loaded:', draftLoaded);
            } else {
                console.log('🗑️ Draft too old, clearing...');
                this.clearFormDraft();
            }
        } else {
            console.log('📝 No valid draft found, starting fresh');
        }
        
        // If no draft loaded, update word count for empty form
        if (!draftLoaded) {
            this.updateWordCount({ target: { value: '' } });
        }
        
        const postModal = document.getElementById('postModal');
        if (postModal) {
            postModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ postModal not found!');
        }
        
        // Focus on first field
        setTimeout(() => {
            const authorField = document.getElementById('authorName');
            if (authorField) {
                authorField.focus();
            }
        }, 100);
        
        console.log('✅ Create modal opened - Only X button can close');
    }

    openEditModal(index) {
        this.currentEditIndex = index;
        const post = this.posts[index];
        
        if (!post) return;
        
        // Clear any draft when editing existing post
        this.clearFormDraft();
        
        const modalTitle = document.getElementById('modalTitle');
        const submitText = document.getElementById('submitText');
        const authorName = document.getElementById('authorName');
        const postCategory = document.getElementById('postCategory');
        const postTitle = document.getElementById('postTitle');
        const postExcerpt = document.getElementById('postExcerpt');
        const postTags = document.getElementById('postTags');
        const postImage = document.getElementById('postImage');
        
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Post';
        if (submitText) submitText.textContent = 'Update';
        if (authorName) authorName.value = post.author || '';
        if (postCategory) postCategory.value = post.category || '';
        if (postTitle) postTitle.value = post.title || '';
        if (postExcerpt) postExcerpt.value = post.excerpt || '';
        if (postTags) postTags.value = (post.tags || []).join(', ');
        
        if (post.image) {
            this.showImagePreview(post.image);
            if (postImage) postImage.required = false;
        } else {
            this.hideImagePreview();
            if (postImage) postImage.required = true;
        }
        
        this.updateWordCount({ target: { value: post.excerpt || '' } });
        
        const postModal = document.getElementById('postModal');
        if (postModal) {
            postModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModals() {
        console.log('❌ Closing modals...');
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal) modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
        
        const postImageInput = document.getElementById('postImage');
        if (postImageInput) {
            postImageInput.required = true;
        }
        
        this.currentEditIndex = null;
    }

    // Form submit handler - ENHANCED VERSION
    handleSubmit(e) {
        console.log('🚀 HANDLE SUBMIT CALLED!');
        e.preventDefault();
        
        console.log('📋 Starting form validation...');
        if (!this.validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }
        
        console.log('✅ Form validation passed');
        
        const formData = new FormData(e.target);
        const imageFile = formData.get('postImage');
        
        // ENHANCED: Multiple ways to detect existing image
        const imagePreview = document.getElementById('previewImg');
        const imagePreviewContainer = document.getElementById('imagePreview');
        const hasPreviewImage = (
            (imagePreview && imagePreview.src && imagePreview.src.startsWith('data:')) ||
            (imagePreview && imagePreview.src && imagePreview.src.length > 100) ||
            (imagePreviewContainer && imagePreviewContainer.style.display === 'block' && imagePreview && imagePreview.src)
        );
        
        // Also check draft for image data
        const hasDraftImage = this.formDraft && this.formDraft.hasImage && this.formDraft.previewImageData;
        
        console.log('🔍 Submit image check:', {
            hasImageFile: imageFile && imageFile.size > 0,
            hasPreviewImage: hasPreviewImage,
            hasDraftImage: hasDraftImage,
            isEditMode: this.currentEditIndex !== null,
            previewSrc: imagePreview?.src?.substring(0, 50) + '...',
            draftImageExists: !!this.formDraft?.previewImageData
        });
        
        if (imageFile && imageFile.size > 0) {
            console.log('📸 Processing new image file...');
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                console.log('📸 New image loaded, creating post data...');
                const postData = this.createPostData(formData, readerEvent.target.result);
                this.finishSubmission(postData);
            };
            
            reader.onerror = (error) => {
                console.error('❌ Error reading image file:', error);
                const formError = document.getElementById('formError');
                if (formError) formError.textContent = 'Error reading image file.';
            };
            
            reader.readAsDataURL(imageFile);
        } else if (hasPreviewImage) {
            // Use existing preview image
            console.log('📸 Using restored preview image...');
            const postData = this.createPostData(formData, imagePreview.src);
            this.finishSubmission(postData);
        } else if (hasDraftImage) {
            // Use image from draft
            console.log('📸 Using image from draft...');
            const postData = this.createPostData(formData, this.formDraft.previewImageData);
            this.finishSubmission(postData);
        } else if (this.currentEditIndex !== null) {
            console.log('✏️ Updating post without new image...');
            const postData = this.createPostData(formData);
            if (this.posts[this.currentEditIndex] && this.posts[this.currentEditIndex].image) {
                postData.image = this.posts[this.currentEditIndex].image;
            }
            this.finishSubmission(postData);
        } else {
            console.log('❌ No image provided for new post (this should not happen after validation)');
            const formError = document.getElementById('formError');
            if (formError) formError.textContent = 'Please select an image file.';
        }
    }
    
    // Helper method to finish submission process
    finishSubmission(postData) {
        if (this.currentEditIndex !== null) {
            console.log('✏️ Updating existing post...');
            this.updatePost(this.currentEditIndex, postData);
        } else {
            console.log('➕ Creating new post...');
            this.createPost(postData);
        }
        
        // IMPORTANT: Close modal and reset form after submission
        this.closeModals();
        
        // Reset form to clear any remaining data
        const blogForm = document.getElementById('blogForm');
        if (blogForm) {
            blogForm.reset();
        }
        this.hideImagePreview();
    }

    createPostData(formData, image = null) {
        console.log('📄 Creating post data from form...');
        const postData = {
            id: `user_post_${Date.now()}`, // Add unique ID
            author: formData.get('authorName')?.trim() || '',
            category: formData.get('postCategory') || '',
            title: formData.get('postTitle')?.trim() || '',
            image: image,
            excerpt: formData.get('postExcerpt')?.trim() || '',
            content: formData.get('postContent')?.trim() || formData.get('postExcerpt')?.trim() || '',
            tags: (formData.get('postTags') || '').split(',').map(tag => tag.trim()).filter(tag => tag),
            date: new Date().toISOString(),
            views: 0,
            createdAt: Date.now(), // Add timestamp for better tracking
            isUserContent: true // Flag to identify user content
        };
        
        console.log('📄 Post data created:', postData);
        return postData;
    }

    // FIXED: Enhanced form validation with better preview detection
    validateForm() {
        console.log('🔍 Validating form...');
        const errorDiv = document.getElementById('formError');
        if (errorDiv) {
            errorDiv.textContent = '';
        }
        
        const requiredFields = ['authorName', 'postCategory', 'postTitle', 'postExcerpt'];
        
        for (let fieldId of requiredFields) {
            const input = document.getElementById(fieldId);
            if (!input) {
                console.error(`❌ Field ${fieldId} not found!`);
                if (errorDiv) errorDiv.textContent = `Field ${fieldId} not found.`;
                return false;
            }
            
            if (!input.value.trim()) {
                const label = input.labels?.[0]?.textContent || fieldId;
                console.log(`❌ Field ${fieldId} is empty`);
                if (errorDiv) errorDiv.textContent = `${label} is required.`;
                return false;
            }
        }
        
        // FIXED: Enhanced image validation for new posts
        if (this.currentEditIndex === null) {
            const imageFile = document.getElementById('postImage')?.files[0];
            const imagePreview = document.getElementById('previewImg');
            const imagePreviewContainer = document.getElementById('imagePreview');
            
            // Multiple ways to check for existing image
            const hasPreviewImage = (
                (imagePreview && imagePreview.src && imagePreview.src.startsWith('data:')) ||
                (imagePreview && imagePreview.src && imagePreview.src.length > 100) ||
                (imagePreviewContainer && imagePreviewContainer.style.display === 'block' && imagePreview && imagePreview.src)
            );
            
            // Also check draft for image
            const hasDraftImage = this.formDraft && this.formDraft.hasImage && this.formDraft.previewImageData;
            
            console.log('🔍 Comprehensive image validation check:', {
                hasImageFile: !!imageFile,
                hasPreviewImage: hasPreviewImage,
                hasDraftImage: hasDraftImage,
                previewSrc: imagePreview?.src?.substring(0, 50) + '...',
                previewDisplay: imagePreviewContainer?.style?.display,
                draftHasImage: this.formDraft?.hasImage
            });
            
            // Check if we have ANY form of image: new file, preview, or draft
            if (!imageFile && !hasPreviewImage && !hasDraftImage) {
                console.log('❌ No image found in any form');
                if (errorDiv) errorDiv.textContent = 'Featured image is required.';
                return false;
            }
            
            // If there's a new file, validate it
            if (imageFile && !this.validateImageFile(imageFile)) {
                console.log('❌ Image file validation failed');
                return false;
            }
        } else {
            // For editing existing posts
            const imageFile = document.getElementById('postImage')?.files[0];
            if (imageFile && !this.validateImageFile(imageFile)) {
                console.log('❌ Image file validation failed');
                return false;
            }
        }
        
        console.log('✅ Form validation successful');
        return true;
    }

    validateImageFile(file) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            const formError = document.getElementById('formError');
            if (formError) formError.textContent = 'Please upload PNG or JPG only.';
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            const formError = document.getElementById('formError');
            if (formError) formError.textContent = 'Image must be less than 5MB.';
            return false;
        }
        return true;
    }

    createPost(postData) {
        console.log('➕ Creating new post:', postData);
        
        try {
            this.posts.unshift(postData);
            
            // Save to localStorage immediately
            this.saveAllUserData();
            this.renderPosts();
            this.updateStats();
            this.showNotification('Post published and saved to localStorage!', 'success');
            this.showAutoSaveIndicator();
            
            // FIXED: Clear form draft after successful publish - MUST be after saving
            this.clearFormDraft();
            
            console.log('✅ Post created and saved successfully');
            console.log('🗑️ Draft cleared after successful publish');
            
            // jQuery AJAX API call to create post (optional, may fail)
            if (window.apiManager) {
                apiManager.createPost({
                    title: postData.title,
                    body: postData.excerpt,
                    userId: 1
                }).catch(error => console.log('API call failed (non-critical):', error));
            }
        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification('Error saving post. Please try again.', 'error');
        }
    }

    updatePost(index, postData) {
        if (!this.posts[index]) return;
        
        try {
            const existingPost = this.posts[index];
            this.posts[index] = { 
                ...existingPost, 
                ...postData,
                views: existingPost.views || 0,
                dateEdited: new Date().toISOString()
            };
            
            // Save to localStorage immediately
            this.saveAllUserData();
            this.renderPosts();
            this.showNotification('Post updated and saved to localStorage!', 'success');
            this.showAutoSaveIndicator();
        } catch (error) {
            console.error('Error updating post:', error);
            this.showNotification('Error updating post. Please try again.', 'error');
        }
    }

    deletePost(index) {
        if (!this.posts[index]) return;
        
        const post = this.posts[index];
        if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
            try {
                this.posts.splice(index, 1);
                
                // Save to localStorage immediately
                this.saveAllUserData();
                this.renderPosts();
                this.updateStats();
                this.showNotification('Post deleted and saved to localStorage!', 'error');
                this.showAutoSaveIndicator();
            } catch (error) {
                console.error('Error deleting post:', error);
                this.showNotification('Error deleting post. Please try again.', 'error');
            }
        }
    }

    renderPosts() {
        const container = document.getElementById('userPostsContainer');
        if (!container) {
            console.error('❌ userPostsContainer not found!');
            return;
        }
        
        if (this.posts.length === 0) { 
            container.innerHTML = ''; 
            return; 
        }
        
        container.innerHTML = this.posts.map((post, index) => {
            const editedText = post.dateEdited ? ' (edited)' : '';
            const displayDate = post.dateEdited ? this.formatDate(post.dateEdited) : this.formatDate(post.date);
            
            return `
            <article class="blog-post user-post ${post.isUserContent ? 'user-content' : ''}" data-category="${post.category || ''}" data-id="${index}" data-date="${post.date}">
                <div class="post-image">
                    <img src="${post.image || ''}" alt="${this.escapeHtml(post.title || '')}">
                    <div class="post-category">${this.capitalizeFirst(post.category || '')}</div>
                    <div class="post-date">${displayDate}${editedText}</div>
                    ${post.isUserContent ? '<div class="user-content-indicator"><i class="fas fa-user"></i> Your Post</div>' : ''}
                </div>
                <div class="post-content">
                    <h3>${this.escapeHtml(post.title || '')}</h3>
                    <div class="post-meta">
                        <span><i class="fas fa-user"></i> ${this.escapeHtml(post.author || '')}</span>
                        <span><i class="fas fa-clock"></i> ${this.calculateReadTime(post.content || post.excerpt || '')} min</span>
                        <span><i class="fas fa-eye"></i> <span class="view-count">${post.views || 0}</span> views</span>
                    </div>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="post-tags">${(post.tags || []).map(tag => `<span class="tag">#${this.escapeHtml(tag)}</span>`).join('')}</div>
                    <div class="post-actions">
                        <button class="btn-read" onclick="blogManager.openPostDetail(this, 'user')">Read Full Post</button>
                    </div>
                    <div class="admin-actions">
                        <button class="btn-edit" onclick="blogManager.openEditModal(${index})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="blogManager.deletePost(${index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </article>
            `;
        }).join('');
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.blog-post').forEach(post => {
            const title = post.querySelector('h3')?.textContent.toLowerCase() || '';
            const content = post.querySelector('.post-excerpt')?.textContent.toLowerCase() || '';
            const author = post.querySelector('.post-meta span')?.textContent.toLowerCase() || '';
            post.style.display = (title.includes(searchTerm) || content.includes(searchTerm) || author.includes(searchTerm)) ? 'block' : 'none';
        });
    }

    handleFilter(e) {
        const filterValue = e.target.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.blog-post').forEach(post => {
            post.style.display = (filterValue === 'all' || post.dataset.category === filterValue) ? 'block' : 'none';
        });
    }

    handleSort(e) {
        const sortValue = e.target.value;
        const userContainer = document.getElementById('userPostsContainer');
        const defaultContainer = document.getElementById('defaultPostsContainer');
        
        if (!userContainer || !defaultContainer) return;
        
        // Get all posts from both containers
        const userPosts = [...userContainer.children];
        const defaultPosts = [...defaultContainer.children];
        const allPosts = [...userPosts, ...defaultPosts];
        
        if (allPosts.length === 0) return; // No posts to sort
        
        // Add date attributes to default posts if they don't have them
        defaultPosts.forEach(post => {
            if (!post.dataset.date) {
                const dateText = post.querySelector('.post-date')?.textContent;
                if (dateText) {
                    post.dataset.date = this.convertDateTextToISO(dateText);
                }
            }
        });
        
        allPosts.sort((a, b) => {
            switch (sortValue) {
                case 'newest': 
                    const dateA = new Date(a.dataset.date || 0);
                    const dateB = new Date(b.dataset.date || 0);
                    return dateB - dateA;
                case 'oldest': 
                    const dateA2 = new Date(a.dataset.date || 0);
                    const dateB2 = new Date(b.dataset.date || 0);
                    return dateA2 - dateB2;
                case 'title': 
                    const titleA = a.querySelector('h3')?.textContent || '';
                    const titleB = b.querySelector('h3')?.textContent || '';
                    return titleA.localeCompare(titleB);
                default: 
                    return 0;
            }
        });
        
        // Clear both containers
        userContainer.innerHTML = '';
        defaultContainer.innerHTML = '';
        
        // Add sorted posts back to the default container
        allPosts.forEach(post => defaultContainer.appendChild(post));
    }
    
    convertDateTextToISO(dateText) {
        // Convert "Aug 16, 2024" format to ISO date
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const parts = dateText.replace(',', '').split(' ');
        if (parts.length === 3) {
            const month = months[parts[0]];
            const day = parts[1].padStart(2, '0');
            const year = parts[2];
            if (month) {
                return `${year}-${month}-${day}T00:00:00.000Z`;
            }
        }
        
        return new Date().toISOString(); // fallback
    }

    updateStats() {
        const totalPostsElement = document.getElementById('totalPosts');
        if (totalPostsElement) {
            totalPostsElement.textContent = this.posts.length + 13;
        }
        
        // Add user content stats if elements exist
        const userStatsElement = document.getElementById('userStats');
        if (userStatsElement) {
            userStatsElement.innerHTML = `
                <div class="user-stats-item">
                    <i class="fas fa-user"></i> Your Posts: ${this.posts.length}
                </div>
                <div class="user-stats-item">
                    <i class="fas fa-eye"></i> Total Views: ${this.posts.reduce((sum, post) => sum + (post.views || 0), 0)}
                </div>
            `;
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (!this.validateImageFile(file)) { 
                e.target.value = ''; 
                return; 
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showImagePreview(e.target.result);
                
                // Save draft when image is uploaded (for new posts only)
                if (this.currentEditIndex === null) {
                    // Add a small delay to ensure the preview is set before saving
                    setTimeout(() => {
                        this.saveFormDraft();
                    }, 100);
                }
            };
            reader.onerror = (error) => {
                console.error('Error reading image:', error);
            };
            reader.readAsDataURL(file);
        }
    }

    showImagePreview(imageSrc) {
        const previewImg = document.getElementById('previewImg');
        const imagePreview = document.getElementById('imagePreview');
        
        if (previewImg && imagePreview) {
            previewImg.src = imageSrc;
            imagePreview.style.display = 'block';
        }
    }

    hideImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        const postImage = document.getElementById('postImage');
        
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
        if (postImage) {
            postImage.value = '';
        }
    }

    removeImage() { 
        this.hideImagePreview(); 
        
        // Also clear from draft if we're in create mode
        if (this.currentEditIndex === null && this.formDraft) {
            this.formDraft.hasImage = false;
            this.formDraft.previewImageData = null;
            this.saveToStorage('blog_form_draft', this.formDraft);
        }
    }

    updateWordCount(e) {
        const text = e.target.value.trim();
        const words = text.length > 0 ? text.split(/\s+/).filter(word => word.length > 0) : [];
        const wordCount = words.length;
        const counter = document.getElementById('excerptCounter');
        
        if (counter) {
            counter.textContent = `${wordCount} words`;
            counter.style.color = '#059669';
        }
    }

    openPostDetail(element, type) {
        const post = element.closest('.blog-post');
        if (!post) return;
        
        const postId = post.dataset.id;
        this.currentPostType = type; 
        this.currentPostId = postId;
        
        if (type === 'user') {
            if (this.posts[postId]) {
                this.posts[postId].views = (this.posts[postId].views || 0) + 1;
                
                // Save updated view count to localStorage
                this.saveAllUserData();
                
                const viewCountElement = post.querySelector('.view-count');
                if (viewCountElement) {
                    viewCountElement.textContent = this.posts[postId].views;
                }
                
                // Show full content for user posts
                const fullContent = this.posts[postId].content || this.posts[postId].excerpt || '';
                const detailContent = document.getElementById('detailContent');
                if (detailContent) {
                    detailContent.innerHTML = this.formatContentWithParagraphs(fullContent);
                }
            }
        } else {
            const viewKey = `${type}_${postId}_views`;
            const currentViews = parseInt(this.viewCounts[viewKey] || '0');
            const newViews = currentViews + 1;
            this.viewCounts[viewKey] = newViews;
            
            // Save updated view count to localStorage
            this.saveToStorage('blog_view_counts', this.viewCounts);
            
            const viewCountElement = post.querySelector('.view-count');
            if (viewCountElement) {
                viewCountElement.textContent = newViews;
            }
            
            // Show excerpt for default posts
            const detailContent = document.getElementById('detailContent');
            const postExcerpt = post.querySelector('.post-excerpt');
            if (detailContent && postExcerpt) {
                detailContent.textContent = postExcerpt.textContent;
            }
        }
        
        // Update modal content
        const detailTitle = document.getElementById('detailTitle');
        const detailImage = document.getElementById('detailImage');
        const detailAuthor = document.getElementById('detailAuthor');
        const detailDate = document.getElementById('detailDate');
        const detailCategory = document.getElementById('detailCategory');
        const detailTags = document.getElementById('detailTags');
        
        const h3 = post.querySelector('h3');
        const img = post.querySelector('img');
        const metaSpan = post.querySelector('.post-meta span');
        const dateSpan = post.querySelector('.post-date');
        const categoryDiv = post.querySelector('.post-category');
        const tags = post.querySelectorAll('.post-tags .tag');
        
        if (detailTitle && h3) detailTitle.textContent = h3.textContent;
        if (detailImage && img) detailImage.src = img.src;
        if (detailAuthor && metaSpan) detailAuthor.innerHTML = metaSpan.innerHTML;
        if (detailDate && dateSpan) detailDate.innerHTML = `<i class="fas fa-calendar"></i> ${dateSpan.textContent}`;
        if (detailCategory && categoryDiv) detailCategory.innerHTML = `<i class="fas fa-tag"></i> ${categoryDiv.textContent}`;
        
        if (detailTags) {
            const tagsHtml = Array.from(tags).map(tag => tag.outerHTML).join('');
            detailTags.innerHTML = tagsHtml;
        }
        
        const postDetailModal = document.getElementById('postDetailModal');
        if (postDetailModal) {
            postDetailModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    formatContentWithParagraphs(content) {
        // Split content by line breaks and create paragraphs
        return content.split('\n\n').map(paragraph => 
            paragraph.trim() ? `<p>${this.escapeHtml(paragraph.trim())}</p>` : ''
        ).join('');
    }

    loadStoredData() {
        // Load view counts from localStorage for default posts
        document.querySelectorAll('#defaultPostsContainer .blog-post').forEach(post => {
            const postId = post.dataset.id;
            const viewKey = `default_${postId}_views`;
            const savedViews = this.viewCounts[viewKey] || 0;
            const viewCountElement = post.querySelector('.view-count');
            if (viewCountElement) {
                viewCountElement.textContent = savedViews;
            }
        });
    }

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    calculateReadTime(content) {
        if (!content) return 1;
        return Math.max(1, Math.ceil(content.split(' ').length / 200));
    }

    capitalizeFirst(str) { 
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type) {
        console.log(`📢 Notification: ${message} (${type})`);
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i> ${message}`;
        
        // Add CSS styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => { 
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    clearFormAndDraft() {
        if (confirm('Are you sure you want to clear all form data and saved draft? This cannot be undone.')) {
            const blogForm = document.getElementById('blogForm');
            if (blogForm) {
                blogForm.reset();
            }
            
            this.hideImagePreview();
            this.updateWordCount({ target: { value: '' } });
            this.clearFormDraft();
            
            this.showNotification('Form and draft cleared successfully', 'success');
        }
    }

    // Helper method to check if there are unsaved changes
    hasUnsavedChanges() {
        const authorName = document.getElementById('authorName')?.value || '';
        const postCategory = document.getElementById('postCategory')?.value || '';
        const postTitle = document.getElementById('postTitle')?.value || '';
        const postExcerpt = document.getElementById('postExcerpt')?.value || '';
        const postTags = document.getElementById('postTags')?.value || '';
        
        // Also check for image preview
        const imagePreview = document.getElementById('previewImg');
        const hasPreviewImage = imagePreview && imagePreview.src && imagePreview.src.startsWith('data:');
        
        // Check if any field has content or if there's an image
        return authorName.trim() || postCategory || postTitle.trim() || postExcerpt.trim() || postTags.trim() || hasPreviewImage;
    }
}

// RESTful API Manager using jQuery AJAX (ALL CRUD operations)
class APIManager {
    constructor() {
        this.baseURL = 'https://jsonplaceholder.typicode.com';
    }

    // GET - Fetch posts using jQuery AJAX
    async fetchPosts() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.baseURL}/posts`,
                method: 'GET',
                dataType: 'json',
                timeout: 10000,
                success: (data) => {
                    console.log('✅ jQuery GET - Posts fetched:', data.length);
                    resolve(data.slice(0, 5)); // Return first 5 posts
                },
                error: (xhr, status, error) => {
                    console.log('⚠️ jQuery GET Error (non-critical):', error);
                    resolve([]);
                }
            });
        });
    }

    // POST - Create new post using jQuery AJAX
    async createPost(postData) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.baseURL}/posts`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(postData),
                dataType: 'json',
                timeout: 10000,
                success: (data) => {
                    console.log('✅ jQuery POST - Post created:', data);
                    resolve(data);
                },
                error: (xhr, status, error) => {
                    console.log('⚠️ jQuery POST Error (non-critical):', error);
                    resolve(null);
                }
            });
        });
    }

    // PUT - Update post using jQuery AJAX  
    async updatePost(id, postData) {
        return new Promise((resolve, reject) => {
            try {
                $.ajax({
                    url: `${this.baseURL}/posts/${id}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(postData),
                    dataType: 'json',
                    timeout: 10000,
                    success: (data) => {
                        console.log('✅ jQuery PUT - Post updated:', data);
                        resolve(data);
                    },
                    error: (xhr, status, error) => {
                        // JSONPlaceholder limitation: PUT to new post IDs (>100) returns 500
                        if (xhr.status === 500 && id > 100) {
                            console.log('ℹ️ jQuery PUT - JSONPlaceholder limitation: simulating update for post ID', id);
                            resolve({ id: id, ...postData, message: 'Simulated update' });
                        } else {
                            console.log(`⚠️ jQuery PUT Error (non-critical): ${error} (Status: ${xhr.status})`);
                            resolve(null);
                        }
                    }
                });
            } catch (error) {
                console.log('⚠️ PUT request failed (non-critical):', error);
                resolve(null);
            }
        });
    }

    // DELETE - Delete post using jQuery AJAX
    async deletePost(id) {
        return new Promise((resolve, reject) => {
            try {
                $.ajax({
                    url: `${this.baseURL}/posts/${id}`,
                    method: 'DELETE',
                    timeout: 10000, // Add timeout
                    success: () => {
                        console.log('✅ jQuery DELETE - Post deleted:', id);
                        resolve(true);
                    },
                    error: (xhr, status, error) => {
                        console.log('⚠️ jQuery DELETE Error (non-critical):', error);
                        resolve(false);
                    }
                });
            } catch (error) {
                console.log('⚠️ DELETE request failed (non-critical):', error);
                resolve(false);
            }
        });
    }

    // Demo all CRUD operations using jQuery AJAX
    async demonstrateCRUD() {
        console.log('🎯 Demonstrating jQuery AJAX CRUD Operations...');
        
        try {
            // READ (GET) - Start with reading existing posts
            const posts = await this.fetchPosts();
            console.log('✅ READ: Fetched posts count:', posts.length);
            
            // CREATE (POST) - This will work on JSONPlaceholder
            const newPost = await this.createPost({
                title: 'Test Post via jQuery AJAX',
                body: 'This post was created using jQuery AJAX for demo purposes',
                userId: 1
            });
            
            if (newPost) {
                console.log('✅ CREATE: Post created with ID:', newPost.id);
                
                // UPDATE (PUT) - Use existing post ID (1-100 are valid on JSONPlaceholder)
                const existingPostId = 1; // Use a known existing post ID
                const updatedPost = await this.updatePost(existingPostId, {
                    id: existingPostId,
                    title: 'Updated Post via jQuery AJAX',
                    body: 'This post was updated using jQuery AJAX for demo purposes',
                    userId: 1
                });
                
                if (updatedPost) {
                    console.log('✅ UPDATE: Post updated successfully');
                } else {
                    console.log('ℹ️ UPDATE: Simulated update (JSONPlaceholder limitation)');
                }
                
                // DELETE - Use existing post ID  
                const deleted = await this.deletePost(existingPostId);
                if (deleted) {
                    console.log('✅ DELETE: Post deletion simulated successfully');
                } else {
                    console.log('ℹ️ DELETE: Simulated deletion (JSONPlaceholder limitation)');
                }
            } else {
                console.log('ℹ️ CREATE: Post creation simulated (JSONPlaceholder returns mock ID)');
            }
            
            console.log('🎉 jQuery AJAX CRUD demonstration complete!');
            console.log('📝 Note: JSONPlaceholder is a mock API - changes are simulated, not persisted');
            
        } catch (error) {
            console.log('⚠️ CRUD demonstration had issues (non-critical):', error);
        }
    }
}

// Global Functions
function shareToSocialMedia(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this Malaysia Travel Blog!');
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
        whatsapp: `https://wa.me/?text=${text}%20${url}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

function openPostDetail(element, type) {
    if (window.blogManager) {
        blogManager.openPostDetail(element, type);
    }
}

// Initialize Blog Manager and API using jQuery
$(document).ready(function() {
    console.log('🚀 jQuery Ready - Starting initialization...');
    console.log('DOM Ready State:', document.readyState);
    console.log('Available elements:', {
        openModal: !!document.getElementById('openModal'),
        blogForm: !!document.getElementById('blogForm'),
        userPostsContainer: !!document.getElementById('userPostsContainer')
    });
    
    // Wait a bit more for DOM to be fully ready
    setTimeout(() => {
        console.log('🔄 Starting delayed initialization...');
        
        // Initialize managers with error handling
        try {
            window.blogManager = new BlogManager();
            console.log('✅ BlogManager initialized');
            
            window.apiManager = new APIManager();
            console.log('✅ APIManager initialized');
            
            // Demo jQuery AJAX RESTful API calls with delay and error handling
            setTimeout(() => {
                console.log('=== jQuery AJAX RESTful API DEMO ===');
                if (window.apiManager) {
                    window.apiManager.demonstrateCRUD().catch(error => {
                        console.log('⚠️ API demo failed (non-critical):', error);
                    });
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error during initialization:', error);
            console.log('Stack trace:', error.stack);
        }
    }, 100);
    
    // Enter key for form submission prevention in text inputs
    $(document).on('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
            e.preventDefault();
        }
    });
    
    console.log('🎉 jQuery initialization setup complete!');
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogManager, APIManager };
}