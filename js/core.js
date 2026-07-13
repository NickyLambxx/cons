/* PrepMate: core.js */
/* Интерактивная Конституция — Защищенная версия */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function safeAddListener(selector, event, handler) {
    const el = $(selector);
    if (el) el.addEventListener(event, handler);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const state = {
    showFavoritesOnly: false,
    articles: [],
    favorites: new Set(),
    favFolders: ['General'],
    articleFolders: {}, 
    currentFolderFilter: 'all',
    notes: {}, 
    returnPosition: null,
    landingPosition: null,
    isJumping: false,
    fontSize: 16,
    lineHeight: 1.6,
    searchHistory: [],
    progress: {},
    articleStatuses: {},
    studyFilters: { chapter: 'all', exam: 'all', status: 'all' },
    activeSearchQuery: '',
    mapZoom: 1,
    mapPan: { x: 0, y: 0 }
};

const LS = {
    THEME: 'ic-theme',
    FAVORITES: 'ic-favorites',
    FAV_FOLDERS: 'ic-fav-folders-list',
    ARTICLE_FOLDERS: 'ic-article-folders-map',
    NOTES: 'ic-user-notes',
    FONT: 'ic-font-settings',
    FONT_TYPE: 'ic-font-type',
    HIGHSCORE: 'ic-game-highscore',
    SEARCH: 'ic-search-history',
    PROGRESS: 'ic-chapter-progress',
    CACHE_CHAPTERS: 'ic-chapters-cache',
    ARTICLE_STATUS: 'ic-article-statuses'
};
