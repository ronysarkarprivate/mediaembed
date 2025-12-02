// ============================================
// STORAGE MANAGER - Enhanced with analytics & trash
// ============================================
const StorageManager = {
    STORAGE_KEY: 'mediaEmbed_items',
    TRASH_KEY: 'mediaEmbed_trash',
    COLLECTIONS_KEY: 'mediaEmbed_collections',
    ANALYTICS_KEY: 'mediaEmbed_analytics',
    
    getAllMedia() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return [];
        }
    },
    
    saveMedia(mediaItem) {
        try {
            const allMedia = this.getAllMedia();
            const now = new Date();
            mediaItem.id = Date.now();
            mediaItem.createdAt = now.toISOString();
            mediaItem.createdDate = now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            mediaItem.createdTime = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            });
            mediaItem.isFavorite = false;
            mediaItem.isPinned = false;
            mediaItem.viewCount = 0;
            mediaItem.lastViewed = null;
            mediaItem.collections = [];
            allMedia.unshift(mediaItem);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
            this.trackActivity('added', mediaItem.id);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please delete some media items.');
            } else {
                console.error('Error saving to localStorage:', e);
            }
            return false;
        }
    },
    
    updateMedia(id, updatedData) {
        try {
            const allMedia = this.getAllMedia();
            const index = allMedia.findIndex(item => item.id === id);
            
            if (index !== -1) {
                const now = new Date();
                allMedia[index] = {
                    ...allMedia[index],
                    ...updatedData,
                    updatedAt: now.toISOString(),
                    updatedDate: now.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    updatedTime: now.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true
                    })
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error updating localStorage:', e);
            return false;
        }
    },
    
    deleteMedia(id) {
        try {
            const allMedia = this.getAllMedia();
            const item = allMedia.find(m => m.id === id);
            if (item) {
                // Move to trash instead of permanent delete
                this.moveToTrash(item);
                const filtered = allMedia.filter(item => item.id !== id);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error deleting from localStorage:', e);
            return false;
        }
    },
    
    moveToTrash(item) {
        try {
            const trash = this.getTrash();
            item.deletedAt = new Date().toISOString();
            trash.unshift(item);
            localStorage.setItem(this.TRASH_KEY, JSON.stringify(trash));
        } catch (e) {
            console.error('Error moving to trash:', e);
        }
    },
    
    getTrash() {
        try {
            const data = localStorage.getItem(this.TRASH_KEY);
            const trash = data ? JSON.parse(data) : [];
            // Auto-delete items older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const filtered = trash.filter(item => 
                new Date(item.deletedAt) > thirtyDaysAgo
            );
            if (filtered.length !== trash.length) {
                localStorage.setItem(this.TRASH_KEY, JSON.stringify(filtered));
            }
            return filtered;
        } catch (e) {
            console.error('Error reading trash:', e);
            return [];
        }
    },
    
    restoreFromTrash(id) {
        try {
            const trash = this.getTrash();
            const item = trash.find(m => m.id === id);
            if (item) {
                delete item.deletedAt;
                const allMedia = this.getAllMedia();
                allMedia.unshift(item);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                
                const filtered = trash.filter(m => m.id !== id);
                localStorage.setItem(this.TRASH_KEY, JSON.stringify(filtered));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error restoring from trash:', e);
            return false;
        }
    },
    
    permanentDelete(id) {
        try {
            const trash = this.getTrash();
            const filtered = trash.filter(m => m.id !== id);
            localStorage.setItem(this.TRASH_KEY, JSON.stringify(filtered));
            return true;
        } catch (e) {
            console.error('Error permanent delete:', e);
            return false;
        }
    },
    
    emptyTrash() {
        try {
            localStorage.setItem(this.TRASH_KEY, JSON.stringify([]));
            return true;
        } catch (e) {
            console.error('Error emptying trash:', e);
            return false;
        }
    },
    
    incrementViewCount(id) {
        try {
            const allMedia = this.getAllMedia();
            const index = allMedia.findIndex(item => item.id === id);
            
            if (index !== -1) {
                allMedia[index].viewCount = (allMedia[index].viewCount || 0) + 1;
                allMedia[index].lastViewed = new Date().toISOString();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                this.trackActivity('viewed', id);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error incrementing view count:', e);
            return false;
        }
    },
    
    toggleFavorite(id) {
        try {
            const allMedia = this.getAllMedia();
            const index = allMedia.findIndex(item => item.id === id);
            
            if (index !== -1) {
                allMedia[index].isFavorite = !allMedia[index].isFavorite;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                return allMedia[index].isFavorite;
            }
            return false;
        } catch (e) {
            console.error('Error toggling favorite:', e);
            return false;
        }
    },
    
    togglePin(id) {
        try {
            const allMedia = this.getAllMedia();
            const index = allMedia.findIndex(item => item.id === id);
            
            if (index !== -1) {
                allMedia[index].isPinned = !allMedia[index].isPinned;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                return allMedia[index].isPinned;
            }
            return false;
        } catch (e) {
            console.error('Error toggling pin:', e);
            return false;
        }
    },
    
    getMediaByCategory(category) {
        const allMedia = this.getAllMedia();
        if (category === 'all') return allMedia;
        if (category === 'favorites') return allMedia.filter(item => item.isFavorite);
        if (category === 'pinned') return allMedia.filter(item => item.isPinned);
        if (category === 'popular') {
            return allMedia.filter(item => (item.viewCount || 0) >= 5)
                .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        }
        return allMedia.filter(item => 
            item.category.toLowerCase() === category.toLowerCase()
        );
    },
    
    searchMedia(query) {
        const allMedia = this.getAllMedia();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return allMedia;
        
        return allMedia.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(searchTerm);
            const categoryMatch = item.category.toLowerCase().includes(searchTerm);
            const tagsMatch = item.tags ? item.tags.toLowerCase().includes(searchTerm) : false;
            const descriptionMatch = item.description ? item.description.toLowerCase().includes(searchTerm) : false;
            
            return titleMatch || categoryMatch || tagsMatch || descriptionMatch;
        });
    },
    
    sortMedia(mediaItems, sortType) {
        const sorted = [...mediaItems];
        
        switch(sortType) {
            case 'pinned':
                return sorted.sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            case 'alphabetical':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            
            case 'alphabetical-reverse':
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            
            case 'most-viewed':
                return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
            
            default:
                return sorted;
        }
    },
    
    getMediaById(id) {
        const allMedia = this.getAllMedia();
        return allMedia.find(item => item.id === id);
    },
    
    getStorageSize() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return 0;
        return new Blob([data]).size;
    },
    
    getStatistics() {
        const allMedia = this.getAllMedia();
        const categories = {};
        let totalViews = 0;
        
        allMedia.forEach(item => {
            const cat = item.category.toLowerCase();
            categories[cat] = (categories[cat] || 0) + 1;
            totalViews += (item.viewCount || 0);
        });
        
        const mostUsedCategory = Object.keys(categories).length > 0 
            ? Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)
            : 'none';
        
        return {
            totalFiles: allMedia.length,
            totalFavorites: allMedia.filter(item => item.isFavorite).length,
            mostUsedCategory: mostUsedCategory,
            storageSize: this.getStorageSize(),
            totalViews: totalViews,
            categories: categories
        };
    },
    
    trackActivity(action, itemId) {
        try {
            const analytics = this.getAnalytics();
            const today = new Date().toISOString().split('T')[0];
            
            if (!analytics[today]) {
                analytics[today] = { added: 0, viewed: 0, items: [] };
            }
            
            if (action === 'added') analytics[today].added++;
            if (action === 'viewed') analytics[today].viewed++;
            
            if (!analytics[today].items.includes(itemId)) {
                analytics[today].items.push(itemId);
            }
            
            localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
        } catch (e) {
            console.error('Error tracking activity:', e);
        }
    },
    
    getAnalytics() {
        try {
            const data = localStorage.getItem(this.ANALYTICS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading analytics:', e);
            return {};
        }
    },
    
    // Collections Management
    getAllCollections() {
        try {
            const data = localStorage.getItem(this.COLLECTIONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading collections:', e);
            return [];
        }
    },
    
    createCollection(name, description) {
        try {
            const collections = this.getAllCollections();
            const newCollection = {
                id: Date.now(),
                name: name,
                description: description,
                items: [],
                createdAt: new Date().toISOString()
            };
            collections.unshift(newCollection);
            localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));
            return true;
        } catch (e) {
            console.error('Error creating collection:', e);
            return false;
        }
    },
    
    addToCollection(collectionId, mediaId) {
        try {
            const collections = this.getAllCollections();
            const collection = collections.find(c => c.id === collectionId);
            if (collection && !collection.items.includes(mediaId)) {
                collection.items.push(mediaId);
                localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));
                
                // Update media item
                const allMedia = this.getAllMedia();
                const media = allMedia.find(m => m.id === mediaId);
                if (media) {
                    if (!media.collections) media.collections = [];
                    if (!media.collections.includes(collectionId)) {
                        media.collections.push(collectionId);
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                    }
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error adding to collection:', e);
            return false;
        }
    },
    
    removeFromCollection(collectionId, mediaId) {
        try {
            const collections = this.getAllCollections();
            const collection = collections.find(c => c.id === collectionId);
            if (collection) {
                collection.items = collection.items.filter(id => id !== mediaId);
                localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));
                
                // Update media item
                const allMedia = this.getAllMedia();
                const media = allMedia.find(m => m.id === mediaId);
                if (media && media.collections) {
                    media.collections = media.collections.filter(id => id !== collectionId);
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error removing from collection:', e);
            return false;
        }
    },
    
    deleteCollection(collectionId) {
        try {
            const collections = this.getAllCollections();
            const filtered = collections.filter(c => c.id !== collectionId);
            localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(filtered));
            
            // Remove collection reference from all media items
            const allMedia = this.getAllMedia();
            allMedia.forEach(media => {
                if (media.collections) {
                    media.collections = media.collections.filter(id => id !== collectionId);
                }
            });
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMedia));
            return true;
        } catch (e) {
            console.error('Error deleting collection:', e);
            return false;
        }
    },
    
    getCollectionById(id) {
        const collections = this.getAllCollections();
        return collections.find(c => c.id === id);
    },
    
    // Duplicate Detection
    findDuplicates() {
        const allMedia = this.getAllMedia();
        const duplicates = [];
        const seen = new Map();
        
        allMedia.forEach(item => {
            // Check for duplicate titles
            const key = item.title.toLowerCase().trim();
            if (seen.has(key)) {
                const existing = seen.get(key);
                const existingGroup = duplicates.find(d => d.includes(existing));
                if (existingGroup) {
                    existingGroup.push(item.id);
                } else {
                    duplicates.push([existing, item.id]);
                }
            } else {
                seen.set(key, item.id);
            }
        });
        
        return duplicates;
    },
    
    // Recommendations
    getRecommendations(id) {
        const media = this.getMediaById(id);
        if (!media) return [];
        
        const allMedia = this.getAllMedia().filter(m => m.id !== id);
        const recommendations = [];
        
        allMedia.forEach(item => {
            let score = 0;
            
            // Same category
            if (item.category === media.category) score += 3;
            
            // Similar tags
            if (media.tags && item.tags) {
                const mediaTags = media.tags.toLowerCase().split(',').map(t => t.trim());
                const itemTags = item.tags.toLowerCase().split(',').map(t => t.trim());
                const commonTags = mediaTags.filter(t => itemTags.includes(t));
                score += commonTags.length * 2;
            }
            
            // Title similarity (simple word matching)
            const mediaWords = media.title.toLowerCase().split(' ');
            const itemWords = item.title.toLowerCase().split(' ');
            const commonWords = mediaWords.filter(w => w.length > 3 && itemWords.includes(w));
            score += commonWords.length;
            
            if (score > 0) {
                recommendations.push({ item, score });
            }
        });
        
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => r.item);
    }
};

// ============================================
// AUTO-CATEGORIZATION HELPER
// ============================================
function detectCategory(iframeCode) {
    const code = iframeCode.toLowerCase();
    
    if (code.includes('youtube') || code.includes('vimeo') || 
        code.includes('dailymotion') || code.includes('video') ||
        code.includes('.mp4') || code.includes('.webm')) {
        return 'video';
    }
    
    if (code.includes('image') || code.includes('.jpg') || 
        code.includes('.png') || code.includes('.gif') ||
        code.includes('.jpeg') || code.includes('.webp') ||
        code.includes('photo')) {
        return 'image';
    }
    
    if (code.includes('document') || code.includes('.pdf') ||
        code.includes('docs.google') || code.includes('.doc')) {
        return 'document';
    }
    
    if (code.includes('presentation') || code.includes('slides.google') ||
        code.includes('.ppt') || code.includes('slideshare')) {
        return 'presentation';
    }
    
    return 'other';
}

function suggestTags(title) {
    const keywords = {
        'tutorial': ['learning', 'education', 'how-to'],
        'marketing': ['business', 'promotion', 'advertising'],
        'presentation': ['slides', 'meeting', 'pitch'],
        'demo': ['showcase', 'example', 'sample'],
        'report': ['analysis', 'data', 'statistics'],
        'training': ['course', 'workshop', 'seminar']
    };
    
    const titleLower = title.toLowerCase();
    const suggestions = [];
    
    for (const [key, tags] of Object.entries(keywords)) {
        if (titleLower.includes(key)) {
            suggestions.push(...tags);
        }
    }
    
    return suggestions.slice(0, 3).join(', ');
}

// ============================================
// SELECTION MANAGEMENT
// ============================================
let selectedItems = new Set();

function toggleSelection(id) {
    if (selectedItems.has(id)) {
        selectedItems.delete(id);
    } else {
        selectedItems.add(id);
    }
    
    updateSelectionUI();
}

function selectAll() {
    const allMedia = StorageManager.getAllMedia();
    selectedItems = new Set(allMedia.map(item => item.id));
    updateSelectionUI();
    displayMediaGallery(getCurrentFilter());
}

function clearSelection() {
    selectedItems.clear();
    updateSelectionUI();
    displayMediaGallery(getCurrentFilter());
}

function updateSelectionUI() {
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectedCount = document.getElementById('selectedCount');
    
    if (bulkActionsBar && selectedCount) {
        selectedCount.textContent = selectedItems.size;
        bulkActionsBar.style.display = selectedItems.size > 0 ? 'flex' : 'none';
    }
    
    selectedItems.forEach(id => {
        const checkbox = document.querySelector(`[data-item-id="${id}"] .selection-checkbox`);
        if (checkbox) {
            checkbox.classList.add('checked');
        }
    });
}

function getCurrentFilter() {
    const activeFilter = document.querySelector('.filter-btn.active');
    return activeFilter ? activeFilter.dataset.filter : 'all';
}

// ============================================
// BULK ACTIONS
// ============================================
function bulkFavorite() {
    selectedItems.forEach(id => {
        const media = StorageManager.getMediaById(id);
        if (media && !media.isFavorite) {
            StorageManager.toggleFavorite(id);
        }
    });
    
    showNotification(`${selectedItems.size} items added to favorites`, 'success');
    clearSelection();
    displayMediaGallery(getCurrentFilter());
    updateStatistics();
}

function bulkPin() {
    selectedItems.forEach(id => {
        const media = StorageManager.getMediaById(id);
        if (media && !media.isPinned) {
            StorageManager.togglePin(id);
        }
    });
    
    showNotification(`${selectedItems.size} items pinned`, 'success');
    clearSelection();
    displayMediaGallery(getCurrentFilter());
}

function showBulkCategoryModal() {
    const modal = document.getElementById('bulkCategoryModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeBulkCategoryModal() {
    const modal = document.getElementById('bulkCategoryModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function applyBulkCategory(category) {
    selectedItems.forEach(id => {
        StorageManager.updateMedia(id, { category });
    });
    
    showNotification(`${selectedItems.size} items moved to ${category}`, 'success');
    closeBulkCategoryModal();
    clearSelection();
    displayMediaGallery(getCurrentFilter());
    updateStatistics();
}

function bulkDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;
    
    selectedItems.forEach(id => {
        StorageManager.deleteMedia(id);
    });
    
    showNotification(`${selectedItems.size} items moved to trash`, 'success');
    clearSelection();
    displayMediaGallery(getCurrentFilter());
    updateStatistics();
}

function showBulkCollectionModal() {
    const modal = document.getElementById('bulkCollectionModal');
    const list = document.getElementById('bulkCollectionList');
    
    if (!modal || !list) return;
    
    const collections = StorageManager.getAllCollections();
    
    if (collections.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No collections yet. Create one first!</p>';
    } else {
        list.innerHTML = collections.map(col => `
            <div class="collection-select-item" onclick="addSelectedToCollection(${col.id})">
                <h4>${escapeHtml(col.name)}</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted);">${col.items.length} items</p>
            </div>
        `).join('');
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBulkCollectionModal() {
    const modal = document.getElementById('bulkCollectionModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function addSelectedToCollection(collectionId) {
    let addedCount = 0;
    selectedItems.forEach(id => {
        if (StorageManager.addToCollection(collectionId, id)) {
            addedCount++;
        }
    });
    
    showNotification(`${addedCount} items added to collection`, 'success');
    closeBulkCollectionModal();
    clearSelection();
}
// ============================================
// STATISTICS UPDATE
// ============================================
function updateStatistics() {
    const stats = StorageManager.getStatistics();
    
    const totalFilesEl = document.getElementById('totalFiles');
    const totalFavoritesEl = document.getElementById('totalFavorites');
    const mostUsedCategoryEl = document.getElementById('mostUsedCategory');
    const totalViewsEl = document.getElementById('totalViews');
    
    if (totalFilesEl) totalFilesEl.textContent = stats.totalFiles;
    if (totalFavoritesEl) totalFavoritesEl.textContent = stats.totalFavorites;
    if (mostUsedCategoryEl) {
        mostUsedCategoryEl.textContent = stats.mostUsedCategory === 'none' ? '-' : 
            stats.mostUsedCategory.charAt(0).toUpperCase() + stats.mostUsedCategory.slice(1);
    }
    if (totalViewsEl) totalViewsEl.textContent = stats.totalViews;
}

// ============================================
// RECENT ACTIVITY WIDGET
// ============================================
function displayRecentActivity() {
    const list = document.getElementById('recentActivityList');
    if (!list) return;
    
    const allMedia = StorageManager.getAllMedia();
    const recent = allMedia.slice(0, 5);
    
    if (recent.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No recent activity</p>';
        return;
    }
    
    list.innerHTML = recent.map(item => `
        <div class="recent-item" onclick="viewMedia(${item.id})">
            <div class="recent-item-icon">${getCategoryIcon(item.category)}</div>
            <div class="recent-item-content">
                <div class="recent-item-title">${escapeHtml(item.title)}</div>
                <div class="recent-item-meta">
                    ${item.createdDate} • ${item.category}
                    ${item.viewCount ? ` • ${item.viewCount} views` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function toggleRecentActivity() {
    const list = document.getElementById('recentActivityList');
    const btn = document.querySelector('.widget-toggle');
    
    if (list && btn) {
        if (list.style.display === 'none') {
            list.style.display = 'grid';
            btn.textContent = '−';
        } else {
            list.style.display = 'none';
            btn.textContent = '+';
        }
    }
}

// ============================================
// MEDIA GALLERY - Display media
// ============================================
let currentSearchQuery = '';
let currentSortType = 'newest';
let currentView = 'grid';
let currentSize = 'medium';

function displayMediaGallery(filter = 'all', searchQuery = '') {
    const mediaGrid = document.getElementById('mediaGrid');
    const emptyState = document.getElementById('emptyState');
    const searchResults = document.getElementById('searchResults');
    const searchResultText = document.getElementById('searchResultText');
    const sortSelect = document.getElementById('sortSelect');
    
    if (!mediaGrid) return;
    
    let mediaItems;
    
    if (searchQuery) {
        mediaItems = StorageManager.searchMedia(searchQuery);
        currentSearchQuery = searchQuery;
        
        if (searchResults && searchResultText) {
            searchResults.style.display = 'flex';
            searchResultText.textContent = `Found ${mediaItems.length} result${mediaItems.length !== 1 ? 's' : ''} for "${searchQuery}"`;
        }
    } else {
        mediaItems = StorageManager.getMediaByCategory(filter);
        currentSearchQuery = '';
        
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }
    
    if (sortSelect) {
        currentSortType = sortSelect.value;
    }
    mediaItems = StorageManager.sortMedia(mediaItems, currentSortType);
    
    if (mediaItems.length === 0) {
        mediaGrid.innerHTML = '';
        if (emptyState) {
            emptyState.classList.add('show');
            if (searchQuery) {
                emptyState.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try a different search term</p>
                    <button onclick="clearSearch()" class="empty-cta">Clear Search</button>
                `;
            } else if (filter === 'favorites') {
                emptyState.innerHTML = `
                    <div class="empty-icon">⭐</div>
                    <h3>No favorites yet</h3>
                    <p>Click the star icon on media items to add them to favorites</p>
                `;
            } else if (filter === 'pinned') {
                emptyState.innerHTML = `
                    <div class="empty-icon">📌</div>
                    <h3>No pinned items</h3>
                    <p>Pin important items to keep them at the top</p>
                `;
            } else if (filter === 'popular') {
                emptyState.innerHTML = `
                    <div class="empty-icon">🔥</div>
                    <h3>No popular items yet</h3>
                    <p>Items with 5+ views will appear here</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="empty-icon">📭</div>
                    <h3>No media yet</h3>
                    <p>Start by embedding your first media item</p>
                    <a href="embed.html" class="empty-cta">Add Media</a>
                `;
            }
        }
        return;
    }
    
    if (emptyState) emptyState.classList.remove('show');
    
    mediaGrid.innerHTML = mediaItems.map(item => {
        const hasDescription = item.description && item.description.trim();
        const shortDescription = hasDescription ? truncateText(item.description, 80) : '';
        const isSelected = selectedItems.has(item.id);
        const isPopular = (item.viewCount || 0) >= 5;
        
        return `
        <div class="media-card ${isSelected ? 'selected' : ''} ${item.isPinned ? 'pinned' : ''}" 
             data-category="${item.category.toLowerCase()}" 
             data-id="${item.id}"
             oncontextmenu="showContextMenu(event, ${item.id}); return false;">
            <div class="media-card-preview">
                ${item.iframeCode}
                <div class="selection-checkbox ${isSelected ? 'checked' : ''}" 
                     data-item-id="${item.id}" 
                     onclick="toggleSelection(${item.id})">
                </div>
                ${item.isPinned ? '<div class="pin-badge">📌 Pinned</div>' : ''}
                ${isPopular ? '<div class="popular-badge">🔥 Popular</div>' : ''}
                <button class="favorite-btn ${item.isFavorite ? 'active' : ''}" 
                        onclick="toggleFavorite(${item.id})" 
                        title="${item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    ${item.isFavorite ? '⭐' : '☆'}
                </button>
            </div>
            <div class="media-card-content">
                <h3 class="media-card-title">${highlightText(escapeHtml(item.title), searchQuery)}</h3>
                ${hasDescription ? `
                    <p class="media-card-description">${highlightText(escapeHtml(shortDescription), searchQuery)}${item.description.length > 80 ? '...' : ''}</p>
                ` : ''}
                <div class="media-card-meta">
                    <span class="media-card-category" onclick="filterByCategory('${escapeHtml(item.category).toLowerCase()}')">
                        ${getCategoryIcon(item.category)} ${highlightText(escapeHtml(item.category), searchQuery)}
                    </span>
                    ${item.viewCount ? `
                        <span class="media-card-category" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #ef4444;">
                            👁️ ${item.viewCount} views
                        </span>
                    ` : ''}
                </div>
                ${item.tags ? `
                    <div class="media-card-tags">
                        ${item.tags.split(',').map(tag => 
                            `<span class="media-tag" onclick="searchByTag('${escapeHtml(tag.trim())}')">${highlightText(escapeHtml(tag.trim()), searchQuery)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                <div class="date-time-badge">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M2 6H12M5 1V3M9 1V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    ${item.createdDate} at ${item.createdTime}
                </div>
                ${item.lastViewed ? `
                    <div class="date-time-badge" style="background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #3b82f6;">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2V7L10 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        Last viewed: ${new Date(item.lastViewed).toLocaleDateString()}
                    </div>
                ` : ''}
                <div class="media-card-actions">
                    <button class="card-action-btn view" onclick="viewMedia(${item.id})">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        View
                    </button>
                    <button class="card-action-btn edit" onclick="openEditModal(${item.id})">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.5 2L14 4.5L5 13.5L2 14L2.5 11L11.5 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Edit
                    </button>
                    <button class="card-action-btn delete" onclick="deleteMedia(${item.id})">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4H14M6 2H10M6 12V7M10 12V7M3 4L4 14H12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
    
    updateStatistics();
    displayRecentActivity();
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
}

function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCategoryIcon(category) {
    const icons = {
        video: '🎥',
        image: '🖼️',
        document: '📄',
        presentation: '📊',
        other: '📁'
    };
    return icons[category.toLowerCase()] || '📁';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// CONTEXT MENU
// ============================================
let contextMenuTargetId = null;

function showContextMenu(event, id) {
    event.preventDefault();
    const menu = document.getElementById('contextMenu');
    if (!menu) return;
    
    contextMenuTargetId = id;
    
    menu.style.display = 'block';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    
    document.addEventListener('click', hideContextMenu);
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) {
        menu.style.display = 'none';
    }
    document.removeEventListener('click', hideContextMenu);
}

function contextAction(action) {
    if (!contextMenuTargetId) return;
    
    switch(action) {
        case 'view':
            viewMedia(contextMenuTargetId);
            break;
        case 'edit':
            openEditModal(contextMenuTargetId);
            break;
        case 'favorite':
            toggleFavorite(contextMenuTargetId);
            break;
        case 'pin':
            togglePin(contextMenuTargetId);
            break;
        case 'addToCollection':
            showAddToCollectionModal(contextMenuTargetId);
            break;
        case 'duplicate':
            duplicateMedia(contextMenuTargetId);
            break;
        case 'recommendations':
            showRecommendations(contextMenuTargetId);
            break;
        case 'delete':
            deleteMedia(contextMenuTargetId);
            break;
    }
    
    hideContextMenu();
}

function duplicateMedia(id) {
    const media = StorageManager.getMediaById(id);
    if (!media) return;
    
    const duplicate = {
        ...media,
        title: media.title + ' (Copy)',
        id: undefined,
        createdAt: undefined,
        viewCount: 0,
        lastViewed: null
    };
    
    delete duplicate.id;
    delete duplicate.createdAt;
    
    if (StorageManager.saveMedia(duplicate)) {
        showNotification('Item duplicated successfully', 'success');
        displayMediaGallery(getCurrentFilter());
    }
}

function showAddToCollectionModal(mediaId) {
    selectedItems.clear();
    selectedItems.add(mediaId);
    showBulkCollectionModal();
}

// ============================================
// VIEW CONTROLS
// ============================================
const viewButtons = document.querySelectorAll('.view-btn');
viewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        viewButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentView = this.dataset.view;
        
        const mediaGrid = document.getElementById('mediaGrid');
        if (mediaGrid) {
            mediaGrid.className = `media-grid view-${currentView} size-${currentSize}`;
        }
    });
});

const sizeButtons = document.querySelectorAll('.size-btn');
sizeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        sizeButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentSize = this.dataset.size;
        
        const mediaGrid = document.getElementById('mediaGrid');
        if (mediaGrid) {
            mediaGrid.className = `media-grid view-${currentView} size-${currentSize}`;
        }
    });
});

// ============================================
// SORTING
// ============================================
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
    sortSelect.addEventListener('change', function() {
        const activeFilter = document.querySelector('.filter-btn.active');
        const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
        
        if (currentSearchQuery) {
            displayMediaGallery('all', currentSearchQuery);
        } else {
            displayMediaGallery(currentFilter);
        }
    });
}

// ============================================
// FAVORITE & PIN
// ============================================
function toggleFavorite(id) {
    event.stopPropagation();
    const isFavorite = StorageManager.toggleFavorite(id);
    
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
        const favBtn = card.querySelector('.favorite-btn');
        if (favBtn) {
            favBtn.classList.toggle('active', isFavorite);
            favBtn.textContent = isFavorite ? '⭐' : '☆';
            favBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
        }
    }
    
    showNotification(isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    updateStatistics();
    
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter && activeFilter.dataset.filter === 'favorites') {
        displayMediaGallery('favorites');
    }
}

function togglePin(id) {
    const isPinned = StorageManager.togglePin(id);
    showNotification(isPinned ? 'Item pinned' : 'Item unpinned', 'success');
    displayMediaGallery(getCurrentFilter());
}

// ============================================
// SEARCH
// ============================================
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

if (searchInput) {
    let searchTimeout;
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (clearSearchBtn) {
            clearSearchBtn.style.display = query ? 'flex' : 'none';
        }
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (query) {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                displayMediaGallery('all', query);
            } else {
                clearSearch();
            }
        }, 300);
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.style.display = 'none';
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    
    displayMediaGallery('all');
}

function searchByTag(tag) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = tag;
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    displayMediaGallery('all', tag);
}

function filterByCategory(category) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        }
    });
    
    displayMediaGallery(category);
}

// ============================================
// FULLSCREEN MODE
// ============================================
function toggleFullscreen() {
    const body = document.body;
    
    if (!document.fullscreenElement) {
        body.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
        body.classList.add('fullscreen-mode');
    } else {
        document.exitFullscreen();
        body.classList.remove('fullscreen-mode');
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen-mode');
    }
});
// ============================================
// COLLECTIONS MANAGEMENT
// ============================================
function openCollectionsModal() {
    const modal = document.getElementById('collectionsModal');
    if (modal) {
        displayCollections();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeCollectionsModal() {
    const modal = document.getElementById('collectionsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function showCreateCollectionForm() {
    const form = document.getElementById('createCollectionForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('newCollectionName').focus();
    }
}

function hideCreateCollectionForm() {
    const form = document.getElementById('createCollectionForm');
    if (form) {
        form.style.display = 'none';
        document.getElementById('newCollectionName').value = '';
        document.getElementById('newCollectionDesc').value = '';
    }
}

function createCollection() {
    const name = document.getElementById('newCollectionName').value.trim();
    const desc = document.getElementById('newCollectionDesc').value.trim();
    
    if (!name) {
        showNotification('Please enter a collection name', 'error');
        return;
    }
    
    if (StorageManager.createCollection(name, desc)) {
        showNotification('Collection created successfully', 'success');
        hideCreateCollectionForm();
        displayCollections();
    }
}

function displayCollections() {
    const list = document.getElementById('collectionsList');
    if (!list) return;
    
    const collections = StorageManager.getAllCollections();
    
    if (collections.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No collections yet. Create your first one!</p>';
        return;
    }
    
    list.innerHTML = collections.map(col => {
        const items = col.items.map(id => StorageManager.getMediaById(id)).filter(Boolean);
        
        return `
        <div class="collection-card">
            <div class="collection-header">
                <h3 class="collection-title">${escapeHtml(col.name)}</h3>
                <span class="collection-count">${col.items.length} items</span>
            </div>
            ${col.description ? `
                <p class="collection-description">${escapeHtml(col.description)}</p>
            ` : ''}
            <div class="collection-actions">
                <button class="collection-btn" onclick="viewCollection(${col.id})">
                    👁️ View
                </button>
                <button class="collection-btn" onclick="playCollection(${col.id})">
                    ▶️ Play
                </button>
                <button class="collection-btn danger" onclick="deleteCollection(${col.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `}).join('');
}

function viewCollection(collectionId) {
    const collection = StorageManager.getCollectionById(collectionId);
    if (!collection) return;
    
    closeCollectionsModal();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const mediaGrid = document.getElementById('mediaGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!mediaGrid) return;
    
    const items = collection.items.map(id => StorageManager.getMediaById(id)).filter(Boolean);
    
    if (items.length === 0) {
        mediaGrid.innerHTML = '';
        if (emptyState) {
            emptyState.classList.add('show');
            emptyState.innerHTML = `
                <div class="empty-icon">📂</div>
                <h3>Empty Collection</h3>
                <p>This collection doesn't have any items yet</p>
                <button onclick="openCollectionsModal()" class="empty-cta">Back to Collections</button>
            `;
        }
        return;
    }
    
    if (emptyState) emptyState.classList.remove('show');
    
    mediaGrid.innerHTML = items.map(item => {
        const hasDescription = item.description && item.description.trim();
        const shortDescription = hasDescription ? truncateText(item.description, 80) : '';
        
        return `
        <div class="media-card" data-id="${item.id}">
            <div class="media-card-preview">
                ${item.iframeCode}
                <button class="favorite-btn ${item.isFavorite ? 'active' : ''}" 
                        onclick="toggleFavorite(${item.id})" 
                        title="${item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    ${item.isFavorite ? '⭐' : '☆'}
                </button>
            </div>
            <div class="media-card-content">
                <h3 class="media-card-title">${escapeHtml(item.title)}</h3>
                ${hasDescription ? `
                    <p class="media-card-description">${escapeHtml(shortDescription)}${item.description.length > 80 ? '...' : ''}</p>
                ` : ''}
                <div class="media-card-actions">
                    <button class="card-action-btn view" onclick="viewMedia(${item.id})">👁️ View</button>
                    <button class="card-action-btn delete" onclick="removeFromCollection(${collectionId}, ${item.id})">✖️ Remove</button>
                </div>
            </div>
        </div>
    `}).join('');
}

function removeFromCollection(collectionId, mediaId) {
    if (StorageManager.removeFromCollection(collectionId, mediaId)) {
        showNotification('Item removed from collection', 'success');
        viewCollection(collectionId);
    }
}

function deleteCollection(collectionId) {
    const collection = StorageManager.getCollectionById(collectionId);
    if (!collection) return;
    
    if (!confirm(`Delete collection "${collection.name}"? Items won't be deleted.`)) return;
    
    if (StorageManager.deleteCollection(collectionId)) {
        showNotification('Collection deleted', 'success');
        displayCollections();
    }
}

// ============================================
// PLAYLIST MODE
// ============================================
let currentPlaylist = [];
let currentPlaylistIndex = 0;
let autoplayEnabled = false;

function playCollection(collectionId) {
    const collection = StorageManager.getCollectionById(collectionId);
    if (!collection) return;
    
    const items = collection.items.map(id => StorageManager.getMediaById(id)).filter(Boolean);
    
    if (items.length === 0) {
        showNotification('This collection is empty', 'error');
        return;
    }
    
    // Filter only video items
    const videos = items.filter(item => item.category.toLowerCase() === 'video');
    
    if (videos.length === 0) {
        showNotification('No videos in this collection', 'error');
        return;
    }
    
    currentPlaylist = videos;
    currentPlaylistIndex = 0;
    autoplayEnabled = false;
    
    closeCollectionsModal();
    openPlaylistModal(collection.name);
}

function openPlaylistModal(title) {
    const modal = document.getElementById('playlistModal');
    const titleEl = document.getElementById('playlistTitle');
    
    if (modal && titleEl) {
        titleEl.textContent = title;
        playVideoAtIndex(0);
        updatePlaylistQueue();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closePlaylistModal() {
    const modal = document.getElementById('playlistModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        currentPlaylist = [];
        currentPlaylistIndex = 0;
        autoplayEnabled = false;
    }
}

function playVideoAtIndex(index) {
    if (index < 0 || index >= currentPlaylist.length) return;
    
    currentPlaylistIndex = index;
    const video = currentPlaylist[index];
    const player = document.getElementById('playlistPlayer');
    
    if (player && video) {
        player.innerHTML = video.iframeCode;
        StorageManager.incrementViewCount(video.id);
        updatePlaylistQueue();
        
        // Auto-advance if autoplay is on
        if (autoplayEnabled && index < currentPlaylist.length - 1) {
            setTimeout(() => {
                nextVideo();
            }, 5000); // Auto-advance after 5 seconds (adjust as needed)
        }
    }
}

function previousVideo() {
    if (currentPlaylistIndex > 0) {
        playVideoAtIndex(currentPlaylistIndex - 1);
    } else {
        showNotification('Already at first video', 'error');
    }
}

function nextVideo() {
    if (currentPlaylistIndex < currentPlaylist.length - 1) {
        playVideoAtIndex(currentPlaylistIndex + 1);
    } else {
        showNotification('Playlist ended', 'success');
        if (autoplayEnabled) {
            playVideoAtIndex(0); // Loop back to start
        }
    }
}

function toggleAutoplay() {
    autoplayEnabled = !autoplayEnabled;
    const text = document.getElementById('autoplayText');
    if (text) {
        text.textContent = autoplayEnabled ? '⏸️ Autoplay: ON' : '▶️ Autoplay: OFF';
    }
    showNotification(autoplayEnabled ? 'Autoplay enabled' : 'Autoplay disabled', 'success');
}

function updatePlaylistQueue() {
    const queue = document.getElementById('playlistQueue');
    const count = document.getElementById('queueCount');
    
    if (!queue || !count) return;
    
    count.textContent = currentPlaylist.length;
    
    queue.innerHTML = currentPlaylist.map((video, index) => `
        <div class="playlist-queue-item ${index === currentPlaylistIndex ? 'active' : ''}" 
             onclick="playVideoAtIndex(${index})">
            <div class="playlist-queue-number">${index + 1}</div>
            <div class="playlist-queue-info">
                <div class="playlist-queue-title">${escapeHtml(video.title)}</div>
                <div class="playlist-queue-category">${video.category}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// ANALYTICS
// ============================================
function openAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        displayAnalytics();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function displayAnalytics() {
    displayMostViewed();
    displayRecentlyViewed();
    displayCategoryChart();
    displayActivityHeatmap();
}

function displayMostViewed() {
    const list = document.getElementById('mostViewedList');
    if (!list) return;
    
    const allMedia = StorageManager.getAllMedia()
        .filter(item => (item.viewCount || 0) > 0)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5);
    
    if (allMedia.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No views yet</p>';
        return;
    }
    
    list.innerHTML = allMedia.map(item => `
        <div class="analytics-item" onclick="viewMedia(${item.id})">
            <span class="analytics-item-title">${escapeHtml(item.title)}</span>
            <span class="analytics-item-value">${item.viewCount} views</span>
        </div>
    `).join('');
}

function displayRecentlyViewed() {
    const list = document.getElementById('recentlyViewedList');
    if (!list) return;
    
    const allMedia = StorageManager.getAllMedia()
        .filter(item => item.lastViewed)
        .sort((a, b) => new Date(b.lastViewed) - new Date(a.lastViewed))
        .slice(0, 5);
    
    if (allMedia.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No recent views</p>';
        return;
    }
    
    list.innerHTML = allMedia.map(item => `
        <div class="analytics-item" onclick="viewMedia(${item.id})">
            <span class="analytics-item-title">${escapeHtml(item.title)}</span>
            <span class="analytics-item-value" style="font-size: 0.75rem;">${new Date(item.lastViewed).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function displayCategoryChart() {
    const chart = document.getElementById('categoryChart');
    if (!chart) return;
    
    const stats = StorageManager.getStatistics();
    const categories = stats.categories;
    
    if (Object.keys(categories).length === 0) {
        chart.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No data yet</p>';
        return;
    }
    
    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    
    chart.innerHTML = Object.entries(categories).map(([cat, count]) => {
        const percentage = (count / total * 100).toFixed(1);
        return `
            <div class="category-bar">
                <div class="category-bar-label">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                <div class="category-bar-track">
                    <div class="category-bar-fill" style="width: ${percentage}%">
                        ${count}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayActivityHeatmap() {
    const heatmap = document.getElementById('activityHeatmap');
    if (!heatmap) return;
    
    const analytics = StorageManager.getAnalytics();
    const days = [];
    
    // Get last 28 days
    for (let i = 27; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push({
            date: dateStr,
            count: analytics[dateStr] ? analytics[dateStr].added : 0
        });
    }
    
    const maxCount = Math.max(...days.map(d => d.count), 1);
    
    heatmap.innerHTML = days.map(day => {
        const level = day.count === 0 ? 0 : Math.min(Math.ceil(day.count / maxCount * 5), 5);
        return `
            <div class="heatmap-day level-${level}" 
                 title="${day.date}: ${day.count} items added"></div>
        `;
    }).join('');
}

// ============================================
// TRASH MANAGEMENT
// ============================================
function openTrashModal() {
    const modal = document.getElementById('trashModal');
    if (modal) {
        displayTrash();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeTrashModal() {
    const modal = document.getElementById('trashModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function displayTrash() {
    const list = document.getElementById('trashList');
    if (!list) return;
    
    const trash = StorageManager.getTrash();
    
    if (trash.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Trash is empty</p>';
        return;
    }
    
    list.innerHTML = trash.map(item => {
        const daysLeft = 30 - Math.floor((new Date() - new Date(item.deletedAt)) / (1000 * 60 * 60 * 24));
        
        return `
        <div class="trash-item">
            <div class="trash-item-content">
                <div class="trash-item-title">${escapeHtml(item.title)}</div>
                <div class="trash-item-meta">
                    Deleted ${new Date(item.deletedAt).toLocaleDateString()} • 
                    ${daysLeft} days left
                </div>
            </div>
            <div class="trash-item-actions">
                <button class="trash-btn restore" onclick="restoreItem(${item.id})">
                    ↩️ Restore
                </button>
                <button class="trash-btn permanent" onclick="permanentDeleteItem(${item.id})">
                    🗑️ Delete Forever
                </button>
            </div>
        </div>
    `}).join('');
}

function restoreItem(id) {
    if (StorageManager.restoreFromTrash(id)) {
        showNotification('Item restored successfully', 'success');
        displayTrash();
        displayMediaGallery(getCurrentFilter());
        updateStatistics();
    }
}

function permanentDeleteItem(id) {
    if (!confirm('This will permanently delete the item. Continue?')) return;
    
    if (StorageManager.permanentDelete(id)) {
        showNotification('Item permanently deleted', 'success');
        displayTrash();
    }
}

function emptyTrash() {
    if (!confirm('This will permanently delete all items in trash. Continue?')) return;
    
    if (StorageManager.emptyTrash()) {
        showNotification('Trash emptied', 'success');
        displayTrash();
    }
}

// ============================================
// DUPLICATE DETECTION
// ============================================
function findDuplicates() {
    const duplicates = StorageManager.findDuplicates();
    
    if (duplicates.length === 0) {
        showNotification('No duplicates found! 🎉', 'success');
        return;
    }
    
    showDuplicatesModal(duplicates);
}

function showDuplicatesModal(duplicates) {
    const modal = document.getElementById('duplicatesModal');
    const count = document.getElementById('duplicatesCount');
    const list = document.getElementById('duplicatesList');
    
    if (!modal || !count || !list) return;
    
    count.textContent = `Found ${duplicates.length} duplicate group${duplicates.length !== 1 ? 's' : ''}`;
    
    list.innerHTML = duplicates.map((group, index) => {
        const items = group.map(id => StorageManager.getMediaById(id)).filter(Boolean);
        
        return `
            <div class="duplicate-group">
                <div class="duplicate-group-header">Duplicate Group ${index + 1}</div>
                <div class="duplicate-items">
                    ${items.map(item => `
                        <div class="analytics-item">
                            <span class="analytics-item-title">${escapeHtml(item.title)}</span>
                            <button class="trash-btn permanent" onclick="deleteMedia(${item.id}); closeDuplicatesModal();">
                                Delete
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeDuplicatesModal() {
    const modal = document.getElementById('duplicatesModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================
// RECOMMENDATIONS
// ============================================
function showRecommendations(id) {
    const recommendations = StorageManager.getRecommendations(id);
    const sourceMedia = StorageManager.getMediaById(id);
    
    if (!sourceMedia) return;
    
    const modal = document.getElementById('recommendationsModal');
    const title = document.getElementById('recommendationsTitle');
    const list = document.getElementById('recommendationsList');
    
    if (!modal || !title || !list) return;
    
    title.textContent = `Items similar to "${sourceMedia.title}"`;
    
    if (recommendations.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No similar items found</p>';
    } else {
        list.innerHTML = recommendations.map(item => `
            <div class="recommendation-item" onclick="viewMedia(${item.id})">
                <h4>${escapeHtml(item.title)}</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem;">
                    ${item.category} ${item.tags ? `• ${item.tags}` : ''}
                </p>
            </div>
        `).join('');
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeRecommendationsModal() {
    const modal = document.getElementById('recommendationsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================
// TOUCH GESTURES (Mobile)
// ============================================
let touchStartX = 0;
let touchEndX = 0;
let touchTargetCard = null;

document.addEventListener('touchstart', function(e) {
    const card = e.target.closest('.media-card');
    if (card) {
        touchStartX = e.changedTouches[0].screenX;
        touchTargetCard = card;
    }
});

document.addEventListener('touchend', function(e) {
    if (!touchTargetCard) return;
    
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    touchTargetCard = null;
});

function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) < swipeThreshold) return;
    
    const id = parseInt(touchTargetCard.dataset.id);
    
    if (diff > 0) {
        // Swipe left - Delete
        showSwipeIndicator('left', '🗑️');
        deleteMedia(id);
    } else {
        // Swipe right - Favorite
        showSwipeIndicator('right', '⭐');
        toggleFavorite(id);
    }
}

function showSwipeIndicator(direction, icon) {
    const indicator = document.createElement('div');
    indicator.className = `swipe-indicator ${direction} show`;
    indicator.textContent = icon;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => indicator.remove(), 300);
    }, 1000);
}
// ============================================
// EDIT FUNCTIONALITY
// ============================================
function openEditModal(id) {
    const media = StorageManager.getMediaById(id);
    if (!media) return;
    
    document.getElementById('editMediaId').value = media.id;
    document.getElementById('editIframeCode').value = media.iframeCode;
    document.getElementById('editMediaTitle').value = media.title;
    document.getElementById('editMediaDescription').value = media.description || '';
    document.getElementById('editCategoryInput').value = media.category;
    document.getElementById('editTags').value = media.tags || '';
    
    const modal = document.getElementById('editModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditModal();
    });
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('editMediaId').value);
        const updatedData = {
            iframeCode: document.getElementById('editIframeCode').value.trim(),
            title: document.getElementById('editMediaTitle').value.trim(),
            description: document.getElementById('editMediaDescription').value.trim(),
            category: document.getElementById('editCategoryInput').value.trim(),
            tags: document.getElementById('editTags').value.trim()
        };
        
        if (StorageManager.updateMedia(id, updatedData)) {
            showNotification('Media updated successfully!', 'success');
            closeEditModal();
            
            const activeFilter = document.querySelector('.filter-btn.active');
            const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
            
            if (currentSearchQuery) {
                displayMediaGallery('all', currentSearchQuery);
            } else {
                displayMediaGallery(currentFilter);
            }
        } else {
            showNotification('Failed to update media', 'error');
        }
    });
}

// ============================================
// VIEW MEDIA IN MODAL
// ============================================
function viewMedia(id) {
    const media = StorageManager.getMediaById(id);
    
    if (!media) return;
    
    // Increment view count
    StorageManager.incrementViewCount(id);
    
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches;
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    
    const modal = document.createElement('div');
    modal.className = 'media-modal show';
    modal.id = 'viewMediaModal';
    
    if (isMobile) {
        modal.classList.add('mobile-view');
    } else if (isTablet) {
        modal.classList.add('tablet-view');
    } else {
        modal.classList.add('desktop-view');
    }
    
    if (isLandscape) {
        modal.classList.add('landscape');
    }
    
    const hasDescription = media.description && media.description.trim();
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()" aria-label="Close modal">&times;</button>
            <div class="preview-metadata" style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <h3 style="font-size: 1.75rem; margin: 0; flex: 1;">${escapeHtml(media.title)}</h3>
                    <button class="favorite-btn ${media.isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite(${media.id}); event.stopPropagation();" 
                            title="${media.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${media.isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
                ${hasDescription ? `
                    <div class="description-full">${escapeHtml(media.description)}</div>
                ` : ''}
                <div class="metadata-tags">
                    <span class="metadata-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>${escapeHtml(media.category)}</span>
                    </span>
                    ${media.tags ? `
                        <span class="metadata-item">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 8L8 2L14 8L8 14L2 8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                            </svg>
                            <span>${escapeHtml(media.tags)}</span>
                        </span>
                    ` : ''}
                    <span class="metadata-item" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #10b981;">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M2 6H14M5 1V3M11 1V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <span>${media.createdDate} at ${media.createdTime}</span>
                    </span>
                    ${media.viewCount ? `
                        <span class="metadata-item" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #ef4444;">
                            👁️ ${media.viewCount} views
                        </span>
                    ` : ''}
                    ${media.isPinned ? `
                        <span class="metadata-item" style="background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.3); color: #fbbf24;">
                            📌 Pinned
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="modal-embed">
                ${media.iframeCode}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    const handleOrientationChange = () => {
        const newLandscape = window.matchMedia("(orientation: landscape)").matches;
        if (newLandscape) {
            modal.classList.add('landscape');
        } else {
            modal.classList.remove('landscape');
        }
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Update display after view count increment
    updateStatistics();
    displayRecentActivity();
}

function closeModal() {
    const modal = document.getElementById('viewMediaModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    
    // Refresh gallery to show updated view count
    displayMediaGallery(getCurrentFilter());
}

// ============================================
// DELETE MEDIA
// ============================================
function deleteMedia(id) {
    if (!confirm('Move this item to trash?')) return;
    
    if (StorageManager.deleteMedia(id)) {
        const activeFilter = document.querySelector('.filter-btn.active');
        const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
        
        if (currentSearchQuery) {
            displayMediaGallery('all', currentSearchQuery);
        } else {
            displayMediaGallery(currentFilter);
        }
        
        showNotification('Media moved to trash', 'success');
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
        border: 1px solid ${type === 'success' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// FORM HANDLING - Embed page
// ============================================
const embedForm = document.getElementById('embedForm');
if (embedForm) {
    const iframeCodeInput = document.getElementById('iframeCode');
    const categoryInput = document.getElementById('categoryInput');
    const mediaTitleInput = document.getElementById('mediaTitle');
    const tagSuggestionEl = document.getElementById('tagSuggestion');
    
    if (iframeCodeInput && categoryInput) {
        iframeCodeInput.addEventListener('input', function() {
            const detectedCategory = detectCategory(this.value);
            categoryInput.value = detectedCategory;
            
            categoryInput.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            setTimeout(() => {
                categoryInput.style.borderColor = '';
            }, 1000);
        });
    }
    
    if (mediaTitleInput && tagSuggestionEl) {
        mediaTitleInput.addEventListener('input', function() {
            const suggestions = suggestTags(this.value);
            if (suggestions) {
                tagSuggestionEl.textContent = `💡 Suggested tags: ${suggestions}`;
                tagSuggestionEl.style.display = 'block';
            } else {
                tagSuggestionEl.style.display = 'none';
            }
        });
    }
    
    embedForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const iframeCode = document.getElementById('iframeCode').value.trim();
        const mediaTitle = document.getElementById('mediaTitle').value.trim();
        const mediaDescription = document.getElementById('mediaDescription').value.trim();
        const category = document.getElementById('categoryInput').value.trim();
        const tags = document.getElementById('tags').value.trim();
        
        const mediaItem = {
            iframeCode,
            title: mediaTitle,
            description: mediaDescription,
            category,
            tags
        };
        
        if (StorageManager.saveMedia(mediaItem)) {
            displayEmbeddedMedia(iframeCode, mediaTitle, mediaDescription, category, tags);
            showSuccessMessage();
            showNotification('Media embedded successfully!');
        } else {
            showNotification('Failed to save media', 'error');
        }
    });
}

function displayEmbeddedMedia(iframeCode, title, description, category, tags) {
    const previewContainer = document.getElementById('previewContainer');
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const previewCategory = document.getElementById('previewCategory');
    const previewTags = document.getElementById('previewTags');
    const previewEmbed = document.getElementById('previewEmbed');
    const previewTagsContainer = document.getElementById('previewTagsContainer');
    
    previewTitle.textContent = title;
    
    if (description) {
        previewDescription.textContent = description;
        previewDescription.style.display = 'block';
    } else {
        previewDescription.style.display = 'none';
    }
    
    previewCategory.textContent = capitalizeFirstLetter(category);
    previewEmbed.innerHTML = iframeCode;
    
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        previewTags.textContent = tagArray.join(', ');
        previewTagsContainer.style.display = 'inline-flex';
    } else {
        previewTagsContainer.style.display = 'none';
    }
    
    previewContainer.classList.remove('hidden');
    
    setTimeout(() => {
        previewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showSuccessMessage() {
    const button = document.querySelector('.submit-button');
    const originalHTML = button.innerHTML;
    
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10L8.5 13.5L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Embedded Successfully!</span>
    `;
    
    button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.background = '';
    }, 2000);
}

const clearButton = document.getElementById('clearPreview');
if (clearButton) {
    clearButton.addEventListener('click', function() {
        const previewContainer = document.getElementById('previewContainer');
        const form = document.getElementById('embedForm');
        previewContainer.classList.add('hidden');
        form.reset();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ============================================
// FILTER FUNCTIONALITY
// ============================================
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        displayMediaGallery(filter);
    });
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.media-modal.show');
        if (openModal) {
            if (openModal.id === 'editModal') {
                closeEditModal();
            } else if (openModal.id === 'bulkCategoryModal') {
                closeBulkCategoryModal();
            } else if (openModal.id === 'shortcutsModal') {
                closeShortcutsModal();
            } else if (openModal.id === 'collectionsModal') {
                closeCollectionsModal();
            } else if (openModal.id === 'analyticsModal') {
                closeAnalyticsModal();
            } else if (openModal.id === 'trashModal') {
                closeTrashModal();
            } else if (openModal.id === 'playlistModal') {
                closePlaylistModal();
            } else if (openModal.id === 'recommendationsModal') {
                closeRecommendationsModal();
            } else if (openModal.id === 'duplicatesModal') {
                closeDuplicatesModal();
            } else if (openModal.id === 'bulkCollectionModal') {
                closeBulkCollectionModal();
            } else {
                closeModal();
            }
        } else {
            clearSearch();
        }
    }
    
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            openShortcutsModal();
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            selectAll();
        }
    }
    
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

// ============================================
// SHORTCUTS MODAL
// ============================================
function openShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.8)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    displayMediaGallery('all');
    updateStatistics();
    displayRecentActivity();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // PWA Install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    function showInstallPrompt() {
        if (deferredPrompt) {
            setTimeout(() => {
                const install = confirm('Install MediaEmbed as an app for better experience?');
                if (install) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('PWA installed');
                        }
                        deferredPrompt = null;
                    });
                }
            }, 5000);
        }
    }
});

const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
formInputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = '';
    });
});

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('media-modal')) {
        const modalId = e.target.id;
        if (modalId === 'editModal') {
            closeEditModal();
        } else if (modalId === 'bulkCategoryModal') {
            closeBulkCategoryModal();
        } else if (modalId === 'shortcutsModal') {
            closeShortcutsModal();
        } else if (modalId === 'collectionsModal') {
            closeCollectionsModal();
        } else if (modalId === 'analyticsModal') {
            closeAnalyticsModal();
        } else if (modalId === 'trashModal') {
            closeTrashModal();
        } else if (modalId === 'playlistModal') {
            closePlaylistModal();
        }
    }
});

// Log initialization
console.log('%c✨ MediaEmbed Pro Loaded Successfully!', 'color: #a855f7; font-size: 18px; font-weight: bold;');
console.log('%c📱 PWA Ready | 📊 Analytics | 📂 Collections | 🗑️ Trash System', 'color: #ec4899; font-size: 14px;');
console.log('%cKeyboard Shortcuts:', 'color: #10b981; font-weight: bold;');
console.log('• Ctrl/Cmd + K: Focus Search');
console.log('• Escape: Close Modals / Clear Search');
console.log('• ?: Show Shortcuts Help');
console.log('• Ctrl/Cmd + A: Select All Items');
console.log('• F11: Toggle Fullscreen');
console.log('%c💡 Swipe left to delete, swipe right to favorite (mobile)', 'color: #fbbf24;');