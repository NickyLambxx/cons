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
    ARTICLE_STATUS: 'ic-article-statuses',
    TRAINING_SESSIONS: 'ic-training-sessions-v1',
    DATA_SCHEMA: 'ic-data-schema-version'
};

const DATA_SCHEMA_VERSION = 1;

function migrateStoredData() {
    const current = Number.parseInt(localStorage.getItem(LS.DATA_SCHEMA) || '0', 10);
    if (!Number.isFinite(current) || current < DATA_SCHEMA_VERSION) {
        // Миграции выполняются по версиям и никогда не очищают учебные данные целиком.
        localStorage.setItem(LS.DATA_SCHEMA, String(DATA_SCHEMA_VERSION));
    }
}

function loadTrainingSessions() {
    try {
        const value = JSON.parse(localStorage.getItem(LS.TRAINING_SESSIONS) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) {
        return {};
    }
}

function getTrainingSession(name) {
    return loadTrainingSessions()[name] || null;
}

function saveTrainingSession(name, value) {
    try {
        const sessions = loadTrainingSessions();
        sessions[name] = { ...value, savedAt: Date.now() };
        localStorage.setItem(LS.TRAINING_SESSIONS, JSON.stringify(sessions));
    } catch (_) { }
}

function clearTrainingSession(name) {
    const sessions = loadTrainingSessions();
    delete sessions[name];
    try { localStorage.setItem(LS.TRAINING_SESSIONS, JSON.stringify(sessions)); } catch (_) { }
}
