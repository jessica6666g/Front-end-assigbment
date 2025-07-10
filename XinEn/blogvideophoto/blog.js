// Unsplash API Integration for Blog Manager
class UnsplashImageManager {
    constructor() {
        // Your Unsplash API credentials - Replace with your actual keys from the dashboard
        this.accessKey = 'YOUR_ACCESS_KEY_HERE'; // Replace with your Access Key from Unsplash dashboard
        this.baseURL = 'https://api.unsplash.com';
        this.cache = new Map(); // Cache images to avoid repeated API calls
    }

    /**
     * Search for images on Unsplash based on query
     * @param {string} query - Search query
     * @param {number} count - Number of images to fetch (default: 1)
     * @returns {Promise<Array>} Array of image objects
     */
    async searchImages(query, count = 1) {
        // Check cache first
        const cacheKey = `${query}_${count}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.baseURL}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
                {
                    headers: {
                        'Authorization': `Client-ID ${this.accessKey}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const images = data.results.map(photo => ({
                id: photo.id,
                url: photo.urls.regular,
                thumb: photo.urls.thumb,
                alt: photo.alt_description || query,
                photographer: photo.user.name,
                photographerUrl: photo.user.links.html,
                downloadUrl: photo.links.download_location,
                unsplashUrl: photo.links.html
            }));

            // Cache the results
            this.cache.set(cacheKey, images);
            return images;
        } catch (error) {
            console.error('Error fetching images from Unsplash:', error);
            return [];
        }
    }

    /**
     * Trigger download event (required by Unsplash API)
     * @param {string} downloadUrl - Download URL from image object
     */
    async triggerDownload(downloadUrl) {
        try {
            await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                }
            });
        } catch (error) {
            console.error('Error triggering download:', error);
        }
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
     * Extract relevant keywords from blog post title for better search
     * @param {string} title - Blog post title
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
        
        // Add "travel" for better travel-related results
        filteredWords.push('travel');
        
        return filteredWords.join(' ');
    }
}

// Enhanced Blog Manager Class with Unsplash Integration
class BlogManager {
    constructor() {
        this.posts = JSON.parse(localStorage.getItem('blogPosts')) || [];
        this.currentEditIndex = null;
        this.currentPostType = '';
        this.currentPostId = '';
        this.viewCounts = JSON.parse(localStorage.getItem('viewCounts')) || {};
        this.unsplashManager = new UnsplashImageManager();
        this.loadingImages = new Set();
        this.selectedImageAttribution = null;
        this.init();
    }

    async init() {
        await this.loadFloatingImages();
        this.renderPosts();
        this.setupEventListeners();
        this.updateStats();
        this.setupMobileMenu();
        this.loadStoredData();
        
        // Load dynamic images for existing posts
        await this.loadDynamicImagesForPosts();
        
        // Setup image suggestion for new posts
        this.setupImageSuggestion();
    }

    setupMobileMenu() {
        const bar = document.querySelector('.bar');
        const menu = document.querySelector('.menu');
        const closeBtn = document.querySelector('.close');
        const menuLinks = document.querySelectorAll('.menu ul li a');
        
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
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            };
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (menu.classList.contains('active') && 
                !menu.contains(e.target) && 
                !bar.contains(e.target)) {
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('active')) {
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }

    setupEventListeners() {
        document.getElementById('openModal').onclick = () => this.openCreateModal();
        document.querySelectorAll('.close').forEach(btn => btn.onclick = () => this.closeModals());
        document.querySelector('.btn-cancel').onclick = () => this.closeModals();
        document.getElementById('blogForm').onsubmit = (e) => this.handleSubmit(e);
        document.getElementById('postImage').onchange = (e) => this.handleImageUpload(e);
        document.getElementById('removeImage').onclick = () => this.removeImage();
        document.getElementById('postExcerpt').oninput = (e) => this.updateWordCount(e);
        document.getElementById('searchInput').oninput = (e) => this.handleSearch(e);
        document.querySelectorAll('.filter-btn').forEach(btn => btn.onclick = (e) => this.handleFilter(e));
        document.getElementById('sortSelect').onchange = (e) => this.handleSort(e);
        window.onclick = (e) => { if (e.target.classList.contains('modal')) this.closeModals(); };
        
        // Setup auto-save for form inputs
        this.setupFormAutoSave();
    }

    setupFormAutoSave() {
        const formFields = ['authorName', 'postCategory', 'postTitle', 'postExcerpt', 'postTags'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Save data when user types
                field.oninput = (e) => {
                    this.saveFormDraft();
                    if (fieldId === 'postExcerpt') this.updateWordCount(e);
                };
                field.onchange = () => this.saveFormDraft();
            }
        });
    }

    saveFormDraft() {
        // Only save draft for new posts, not edits
        if (this.currentEditIndex !== null) return;
        
        const formData = {
            authorName: document.getElementById('authorName').value,
            postCategory: document.getElementById('postCategory').value,
            postTitle: document.getElementById('postTitle').value,
            postExcerpt: document.getElementById('postExcerpt').value,
            postTags: document.getElementById('postTags').value,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('blogFormDraft', JSON.stringify(formData));
        console.log('Draft saved:', formData); // Debug log
    }

    loadFormDraft() {
        const savedData = localStorage.getItem('blogFormDraft');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                
                // Load saved values into form fields
                Object.keys(formData).forEach(key => {
                    if (key !== 'savedAt') {
                        const field = document.getElementById(key);
                        if (field && formData[key]) {
                            field.value = formData[key];
                        }
                    }
                });
                
                // Update word count for excerpt
                if (formData.postExcerpt) {
                    this.updateWordCount({ target: { value: formData.postExcerpt } });
                }
                
                // Show notification that draft was restored
                const savedTime = new Date(formData.savedAt).toLocaleTimeString();
                this.showNotification(`Draft restored from ${savedTime}`, 'success');
                
                return true;
            } catch (error) {
                console.error('Error loading form draft:', error);
                localStorage.removeItem('blogFormDraft');
            }
        }
        return false;
    }

    clearFormDraft() {
        localStorage.removeItem('blogFormDraft');
    }

    openCreateModal() {
        this.currentEditIndex = null;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Create New Post';
        document.getElementById('submitText').textContent = 'Publish';
        document.getElementById('blogForm').reset();
        this.hideImagePreview();
        
        // Try to load saved draft
        const draftLoaded = this.loadFormDraft();
        
        // If no draft loaded, update word count for empty form
        if (!draftLoaded) {
            this.updateWordCount({ target: { value: '' } });
        }
        
        // Hide image suggestions when opening modal
        const suggestionContainer = document.getElementById('imageSuggestions');
        if (suggestionContainer) {
            suggestionContainer.style.display = 'none';
        }
        
        document.getElementById('postModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    openEditModal(index) {
        this.currentEditIndex = index;
        const post = this.posts[index];
        
        // Clear any draft when editing existing post
        this.clearFormDraft();
        
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Post';
        document.getElementById('submitText').textContent = 'Update';
        document.getElementById('authorName').value = post.author;
        document.getElementById('postCategory').value = post.category;
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postExcerpt').value = post.excerpt;
        document.getElementById('postTags').value = post.tags.join(', ');
        
        if (post.image) {
            this.showImagePreview(post.image);
            document.getElementById('postImage').required = false;
        } else {
            this.hideImagePreview();
            document.getElementById('postImage').required = true;
        }
        
        // Hide image suggestions when editing
        const suggestionContainer = document.getElementById('imageSuggestions');
        if (suggestionContainer) {
            suggestionContainer.style.display = 'none';
        }
        
        this.updateWordCount({ target: { value: post.excerpt } });
        document.getElementById('postModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        document.body.style.overflow = 'auto';
        document.getElementById('postImage').required = true;
        this.currentEditIndex = null;
        
        // Hide image suggestions when closing modal
        const suggestionContainer = document.getElementById('imageSuggestions');
        if (suggestionContainer) {
            suggestionContainer.style.display = 'none';
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        if (!this.validateForm()) return;
        const formData = new FormData(e.target);
        const imageFile = formData.get('postImage');
        
        if (imageFile && imageFile.size > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const postData = this.createPostData(formData, e.target.result);
                if (this.currentEditIndex !== null) this.updatePost(this.currentEditIndex, postData);
                else this.createPost(postData);
                this.closeModals();
            };
            reader.readAsDataURL(imageFile);
        } else if (this.currentEditIndex !== null) {
            const postData = this.createPostData(formData);
            if (this.posts[this.currentEditIndex].image) postData.image = this.posts[this.currentEditIndex].image;
            this.updatePost(this.currentEditIndex, postData);
            this.closeModals();
        } else {
            document.getElementById('formError').textContent = 'Please select an image file.';
        }
    }

    createPostData(formData, image = null) {
        return {
            author: formData.get('authorName').trim(),
            category: formData.get('postCategory'),
            title: formData.get('postTitle').trim(),
            image: image,
            excerpt: formData.get('postExcerpt').trim(),
            content: formData.get('postExcerpt').trim(), // Use excerpt as content since we removed separate content field
            tags: formData.get('postTags').split(',').map(tag => tag.trim()).filter(tag => tag),
            date: new Date().toISOString(),
            views: 0
        };
    }

    validateForm() {
        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = '';
        const requiredFields = ['authorName', 'postCategory', 'postTitle', 'postExcerpt'];
        
        for (let field of requiredFields) {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                errorDiv.textContent = `${input.labels[0].textContent} is required.`;
                return false;
            }
        }
        
        if (this.currentEditIndex === null) {
            const imageFile = document.getElementById('postImage').files[0];
            if (!imageFile) {
                errorDiv.textContent = 'Featured image is required.';
                return false;
            }
            if (!this.validateImageFile(imageFile)) return false;
        } else {
            const imageFile = document.getElementById('postImage').files[0];
            if (imageFile && !this.validateImageFile(imageFile)) return false;
        }
        
        return true;
    }

    validateImageFile(file) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            document.getElementById('formError').textContent = 'Please upload PNG or JPG only.';
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            document.getElementById('formError').textContent = 'Image must be less than 5MB.';
            return false;
        }
        return true;
    }

    createPost(postData) {
        // Add attribution if image was selected from Unsplash
        if (this.selectedImageAttribution) {
            postData.imageAttribution = this.selectedImageAttribution;
            this.selectedImageAttribution = null; // Clear after use
        }
        
        this.posts.unshift(postData);
        this.savePosts();
        this.renderPosts();
        this.updateStats();
        this.showNotification('Post published successfully!', 'success');
        
        // Clear form draft after successful publish
        this.clearFormDraft();
        
        // RESTful API Demo - Create post via API
        if (window.apiManager) {
            apiManager.createPost({
                title: postData.title,
                body: postData.excerpt,
                userId: 1
            });
        }
    }

    updatePost(index, postData) {
        const existingPost = this.posts[index];
        this.posts[index] = { 
            ...existingPost, 
            ...postData,
            views: existingPost.views || 0,
            dateEdited: new Date().toISOString()
        };
        this.savePosts();
        this.renderPosts();
        this.showNotification('Post updated successfully!', 'success');
    }

    deletePost(index) {
        const post = this.posts[index];
        if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
            this.posts.splice(index, 1);
            this.savePosts();
            this.renderPosts();
            this.updateStats();
            this.showNotification('Post deleted successfully!', 'error');
        }
    }

    renderPosts() {
        const container = document.getElementById('userPostsContainer');
        if (this.posts.length === 0) { 
            container.innerHTML = ''; 
            return; 
        }
        
        container.innerHTML = this.posts.map((post, index) => {
            const editedText = post.dateEdited ? ' (edited)' : '';
            const displayDate = post.dateEdited ? this.formatDate(post.dateEdited) : this.formatDate(post.date);
            
            return `
            <article class="blog-post user-post" data-category="${post.category}" data-id="${index}" data-date="${post.date}">
                <div class="post-image">
                    <img src="${post.image}" alt="${post.title}">
                    <div class="post-category">${this.capitalizeFirst(post.category)}</div>
                    <div class="post-date">${displayDate}${editedText}</div>
                </div>
                <div class="post-content">
                    <h3>${this.escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <span><i class="fas fa-user"></i> ${this.escapeHtml(post.author)}</span>
                        <span><i class="fas fa-clock"></i> ${this.calculateReadTime(post.content)} min</span>
                        <span><i class="fas fa-eye"></i> <span class="view-count">${post.views || 0}</span> views</span>
                    </div>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt)}</p>
                    <div class="post-tags">${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>
                    ${post.imageAttribution ? `<div class="unsplash-attribution">${this.unsplashManager.generateAttribution(post.imageAttribution)}</div>` : ''}
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
            const title = post.querySelector('h3').textContent.toLowerCase();
            const content = post.querySelector('.post-excerpt').textContent.toLowerCase();
            const author = post.querySelector('.post-meta span').textContent.toLowerCase();
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
        
        // Get all posts from both containers
        const userPosts = [...userContainer.children];
        const defaultPosts = [...defaultContainer.children];
        const allPosts = [...userPosts, ...defaultPosts];
        
        if (allPosts.length === 0) return; // No posts to sort
        
        // Add date attributes to default posts if they don't have them
        defaultPosts.forEach(post => {
            if (!post.dataset.date) {
                const dateText = post.querySelector('.post-date').textContent;
                // Convert date text like "Aug 16, 2024" to ISO format
                post.dataset.date = this.convertDateTextToISO(dateText);
            }
        });
        
        allPosts.sort((a, b) => {
            switch (sortValue) {
                case 'newest': 
                    const dateA = new Date(a.dataset.date);
                    const dateB = new Date(b.dataset.date);
                    return dateB - dateA;
                case 'oldest': 
                    const dateA2 = new Date(a.dataset.date);
                    const dateB2 = new Date(b.dataset.date);
                    return dateA2 - dateB2;
                case 'title': 
                    return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
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
            return `${year}-${month}-${day}T00:00:00.000Z`;
        }
        
        return new Date().toISOString(); // fallback
    }

    updateStats() {
        document.getElementById('totalPosts').textContent = this.posts.length + 13;
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (!this.validateImageFile(file)) { e.target.value = ''; return; }
            const reader = new FileReader();
            reader.onload = (e) => this.showImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    }

    showImagePreview(imageSrc) {
        document.getElementById('previewImg').src = imageSrc;
        document.getElementById('imagePreview').style.display = 'block';
        
        // Hide image suggestions when showing preview
        const suggestionContainer = document.getElementById('imageSuggestions');
        if (suggestionContainer) {
            suggestionContainer.style.display = 'none';
        }
    }

    hideImagePreview() {
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('postImage').value = '';
    }

    removeImage() { 
        this.hideImagePreview(); 
        this.selectedImageAttribution = null;
    }

    updateWordCount(e) {
        const text = e.target.value.trim();
        const words = text.length > 0 ? text.split(/\s+/).filter(word => word.length > 0) : [];
        const wordCount = words.length;
        const counter = document.getElementById('excerptCounter');
        counter.textContent = `${wordCount} words`;
        counter.style.color = '#059669';
    }

    openPostDetail(element, type) {
        const post = element.closest('.blog-post');
        const postId = post.dataset.id;
        this.currentPostType = type; 
        this.currentPostId = postId;
        
        if (type === 'user') {
            this.posts[postId].views = (this.posts[postId].views || 0) + 1;
            this.savePosts();
            post.querySelector('.view-count').textContent = this.posts[postId].views;
        } else {
            const viewKey = `${type}_${postId}_views`;
            const currentViews = parseInt(this.viewCounts[viewKey] || '0');
            const newViews = currentViews + 1;
            this.viewCounts[viewKey] = newViews;
            this.saveViewCounts();
            post.querySelector('.view-count').textContent = newViews;
        }
        
        document.getElementById('detailTitle').textContent = post.querySelector('h3').textContent;
        document.getElementById('detailImage').src = post.querySelector('img').src;
        document.getElementById('detailAuthor').innerHTML = post.querySelector('.post-meta span').innerHTML;
        document.getElementById('detailDate').innerHTML = `<i class="fas fa-calendar"></i> ${post.querySelector('.post-date').textContent}`;
        document.getElementById('detailCategory').innerHTML = `<i class="fas fa-tag"></i> ${post.querySelector('.post-category').textContent}`;
        document.getElementById('detailContent').textContent = post.querySelector('.post-excerpt').textContent;
        
        // Display tags in detail modal
        const tags = post.querySelectorAll('.post-tags .tag');
        const tagsHtml = Array.from(tags).map(tag => tag.outerHTML).join('');
        document.getElementById('detailTags').innerHTML = tagsHtml;
        
        document.getElementById('postDetailModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    loadStoredData() {
        document.querySelectorAll('#defaultPostsContainer .blog-post').forEach(post => {
            const postId = post.dataset.id;
            const viewKey = `default_${postId}_views`;
            const savedViews = this.viewCounts[viewKey] || 0;
            post.querySelector('.view-count').textContent = savedViews;
        });
    }

    async loadFloatingImages() {
        const fallbackQueries = [
            'malaysia kuala lumpur',
            'malaysia nature tropical',
            'malaysia culture temple'
        ];
        
        const imageElements = document.querySelectorAll('.floating-image img');
        
        for (let i = 0; i < imageElements.length && i < fallbackQueries.length; i++) {
            const img = imageElements[i];
            const query = fallbackQueries[i];
            
            try {
                const images = await this.unsplashManager.searchImages(query, 1);
                if (images.length > 0) {
                    const image = images[0];
                    img.src = image.url;
                    img.alt = image.alt;
                    
                    // Add attribution
                    const attribution = this.unsplashManager.generateAttribution(image);
                    img.parentElement.setAttribute('data-attribution', attribution);
                    
                    // Trigger download as per Unsplash API requirements
                    this.unsplashManager.triggerDownload(image.downloadUrl);
                }
            } catch (error) {
                console.error(`Error loading floating image ${i}:`, error);
                // Keep original fallback images if API fails
                const fallbackImages = [
                    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=200&h=140&fit=crop',
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=140&fit=crop',
                    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=200&h=140&fit=crop'
                ];
                if (i < fallbackImages.length) {
                    img.src = fallbackImages[i];
                    img.alt = 'Malaysia Travel';
                }
            }
        }
    }

    /**
     * Fetch dynamic images for existing blog posts
     */
    async loadDynamicImagesForPosts() {
        const posts = document.querySelectorAll('#defaultPostsContainer .blog-post');
        
        for (const post of posts) {
            const img = post.querySelector('.post-image img');
            const title = post.querySelector('h3').textContent;
            const postId = post.dataset.id;
            
            // Skip if already loading or loaded
            if (this.loadingImages.has(postId) || img.dataset.unsplashLoaded) {
                continue;
            }
            
            this.loadingImages.add(postId);
            
            try {
                const optimizedQuery = this.unsplashManager.optimizeSearchQuery(title);
                const images = await this.unsplashManager.searchImages(optimizedQuery, 1);
                
                if (images.length > 0) {
                    const image = images[0];
                    
                    // Create a new image element to avoid flickering
                    const newImg = new Image();
                    newImg.onload = () => {
                        img.src = image.url;
                        img.alt = image.alt;
                        img.dataset.unsplashLoaded = 'true';
                        
                        // Add attribution to the post
                        const attribution = this.unsplashManager.generateAttribution(image);
                        let attributionElement = post.querySelector('.unsplash-attribution');
                        if (!attributionElement) {
                            attributionElement = document.createElement('div');
                            attributionElement.className = 'unsplash-attribution';
                            post.querySelector('.post-content').appendChild(attributionElement);
                        }
                        attributionElement.innerHTML = attribution;
                        
                        // Trigger download
                        this.unsplashManager.triggerDownload(image.downloadUrl);
                    };
                    newImg.src = image.url;
                }
            } catch (error) {
                console.error(`Error loading image for post ${postId}:`, error);
            } finally {
                this.loadingImages.delete(postId);
            }
        }
    }

    /**
     * Enhanced post creation with Unsplash image suggestions
     */
    async suggestImagesForPost(title) {
        if (!title.trim()) return [];
        
        try {
            const optimizedQuery = this.unsplashManager.optimizeSearchQuery(title);
            const images = await this.unsplashManager.searchImages(optimizedQuery, 6);
            return images;
        } catch (error) {
            console.error('Error fetching image suggestions:', error);
            return [];
        }
    }

    /**
     * Setup image suggestion functionality for post creation
     */
    setupImageSuggestion() {
        const titleInput = document.getElementById('postTitle');
        const imageInput = document.getElementById('postImage');
        
        // Add image suggestion container
        const imageContainer = imageInput.parentElement;
        const suggestionContainer = document.createElement('div');
        suggestionContainer.id = 'imageSuggestions';
        suggestionContainer.innerHTML = `
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Suggested Images from Unsplash:</h4>
            <div id="imageGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;"></div>
        `;
        imageContainer.appendChild(suggestionContainer);

        // Debounced image suggestion
        let suggestionTimeout;
        titleInput.addEventListener('input', () => {
            clearTimeout(suggestionTimeout);
            suggestionTimeout = setTimeout(async () => {
                const title = titleInput.value.trim();
                if (title.length > 3) {
                    await this.showImageSuggestions(title);
                } else {
                    suggestionContainer.style.display = 'none';
                }
            }, 1000);
        });
    }

    /**
     * Show image suggestions based on post title
     */
    async showImageSuggestions(title) {
        const suggestionContainer = document.getElementById('imageSuggestions');
        const imageGrid = document.getElementById('imageGrid');
        
        // Show loading state
        suggestionContainer.style.display = 'block';
        imageGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading suggestions...</div>';
        
        try {
            const images = await this.suggestImagesForPost(title);
            
            if (images.length > 0) {
                imageGrid.innerHTML = images.map(image => `
                    <div class="suggestion-item" style="cursor: pointer; position: relative; transition: transform 0.2s;">
                        <img src="${image.thumb}" alt="${image.alt}" 
                             style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; border: 2px solid transparent;"
                             data-full-url="${image.url}"
                             data-download-url="${image.downloadUrl}"
                             data-attribution='${JSON.stringify(image)}'>
                        <div style="font-size: 10px; color: #666; margin-top: 2px; text-align: center;">
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
                        
                        // Convert URL to blob and create file
                        try {
                            const response = await fetch(fullUrl);
                            const blob = await response.blob();
                            const file = new File([blob], `unsplash-${attribution.id}.jpg`, { type: 'image/jpeg' });
                            
                            // Set file to input
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            document.getElementById('postImage').files = dataTransfer.files;
                            
                            // Show preview
                            this.showImagePreview(fullUrl);
                            
                            // Hide suggestions
                            suggestionContainer.style.display = 'none';
                            
                            // Trigger download
                            this.unsplashManager.triggerDownload(downloadUrl);
                            
                            // Store attribution for later use
                            this.selectedImageAttribution = attribution;
                            
                        } catch (error) {
                            console.error('Error selecting image:', error);
                            this.showNotification('Error selecting image. Please try again.', 'error');
                        }
                    });
                });
            } else {
                imageGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No suggestions found</div>';
            }
        } catch (error) {
            console.error('Error showing suggestions:', error);
            imageGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #red;">Error loading suggestions</div>';
        }
    }

    savePosts() {
        localStorage.setItem('blogPosts', JSON.stringify(this.posts));
    }

    saveViewCounts() {
        localStorage.setItem('viewCounts', JSON.stringify(this.viewCounts));
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    calculateReadTime(content) {
        return Math.ceil(content.split(' ').length / 200);
    }

    capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
        
        // Add CSS styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
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
            document.getElementById('blogForm').reset();
            this.hideImagePreview();
            this.updateWordCount({ target: { value: '' } });
            this.clearFormDraft();
            this.selectedImageAttribution = null;
            const suggestionContainer = document.getElementById('imageSuggestions');
            if (suggestionContainer) {
                suggestionContainer.style.display = 'none';
            }
            this.showNotification('Form and draft cleared successfully', 'success');
        }
    }
}

// RESTful API Manager (Simplified)
class APIManager {
    constructor() {
        this.baseURL = 'https://jsonplaceholder.typicode.com';
    }

    // GET - Fetch posts
    async fetchPosts() {
        try {
            const response = await $.ajax({
                url: `${this.baseURL}/posts`,
                method: 'GET',
                dataType: 'json'
            });
            console.log('API GET - Posts fetched:', response.length);
            return response.slice(0, 5); // Return first 5 posts
        } catch (error) {
            console.error('API GET Error:', error);
            return [];
        }
    }

    // POST - Create new post
    async createPost(postData) {
        try {
            const response = await $.ajax({
                url: `${this.baseURL}/posts`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(postData)
            });
            console.log('API POST - Post created:', response);
            return response;
        } catch (error) {
            console.error('API POST Error:', error);
            return null;
        }
    }

    // PUT - Update post
    async updatePost(id, postData) {
        try {
            const response = await $.ajax({
                url: `${this.baseURL}/posts/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(postData)
            });
            console.log('API PUT - Post updated:', response);
            return response;
        } catch (error) {
            console.error('API PUT Error:', error);
            return null;
        }
    }

    // DELETE - Delete post
    async deletePost(id) {
        try {
            await $.ajax({
                url: `${this.baseURL}/posts/${id}`,
                method: 'DELETE'
            });
            console.log('API DELETE - Post deleted:', id);
            return true;
        } catch (error) {
            console.error('API DELETE Error:', error);
            return false;
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
    blogManager.openPostDetail(element, type);
}

// Add enhanced CSS styles
const enhancedCSS = `
<style>
#imageSuggestions {
    display: none;
    margin-top: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background: #f9f9f9;
    animation: fadeIn 0.3s ease-in;
}

.suggestion-item:hover {
    transform: scale(1.05);
    transition: transform 0.2s;
}

.unsplash-attribution {
    font-size: 0.8em;
    color: #666;
    margin-top: 5px;
    padding: 5px;
    background: #f0f0f0;
    border-radius: 4px;
}

.unsplash-attribution a {
    color: #0066cc;
    text-decoration: none;
}

.unsplash-attribution a:hover {
    text-decoration: underline;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.notification.success {
    background: #10b981;
    color: white;
}

.notification.error {
    background: #ef4444;
    color: white;
}

.notification.show {
    transform: translateX(0);
}

.btn-clear {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    margin-right: 8px;
    cursor: pointer;
}

.btn-clear:hover {
    background: #b91c1c;
}
</style>
`;

// Initialize Blog Manager and API
let blogManager, apiManager;
document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced CSS
    document.head.insertAdjacentHTML('beforeend', enhancedCSS);
    
    // Initialize managers
    blogManager = new BlogManager();
    apiManager = new APIManager();
    
    // Demo RESTful API calls
    setTimeout(() => {
        console.log('=== RESTful API DEMO ===');
        apiManager.fetchPosts();
    }, 1000);
    
    // Enter key for form submission
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
            e.preventDefault();
        }
    });
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogManager, UnsplashImageManager, APIManager };
}