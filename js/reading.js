/* PrepMate: reading.js */
/* --- ШРИФТЫ --- */
function initFontSettings() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(LS.FONT)); } catch (e) { localStorage.removeItem(LS.FONT); }
    if (saved) {
        state.fontSize = saved.size;
        state.lineHeight = saved.height;
    }
    const savedType = localStorage.getItem(LS.FONT_TYPE);
    if (savedType) {
        if (savedType === 'serif') document.body.classList.add('serif-mode');
        const rb = $(`input[name="fontType"][value="${savedType}"]`);
        if (rb) rb.checked = true;
    }

    applyFontSettings();

    safeAddListener('#fontBtn', 'click', () => {
        const dlg = $('#fontSettingsDialog');
        if (dlg) dlg.open ? dlg.close() : dlg.showModal();
    });

    safeAddListener('#fontInc', 'click', () => changeFont(1));
    safeAddListener('#fontDec', 'click', () => changeFont(-1));
    safeAddListener('#lhInc', 'click', () => changeLH(0.1));
    safeAddListener('#lhDec', 'click', () => changeLH(-0.1));

    // Font Type Toggle
    $$('input[name="fontType"]').forEach(rb => {
        rb.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'serif') document.body.classList.add('serif-mode');
            else document.body.classList.remove('serif-mode');
            localStorage.setItem(LS.FONT_TYPE, val);
        });
    });
}

function changeFont(delta) {
    state.fontSize = Math.max(12, Math.min(24, state.fontSize + delta));
    applyFontSettings();
}

function changeLH(delta) {
    state.lineHeight = Math.max(1.2, Math.min(2.0, parseFloat((state.lineHeight + delta).toFixed(1))));
    applyFontSettings();
}

function applyFontSettings() {
    document.documentElement.style.setProperty('--font-size', state.fontSize + 'px');
    document.documentElement.style.setProperty('--line-height', state.lineHeight);
    localStorage.setItem(LS.FONT, JSON.stringify({ size: state.fontSize, height: state.lineHeight }));
    const sizeVal = $('#fontSizeVal');
    const lhVal = $('#lhVal');
    if (sizeVal) sizeVal.textContent = state.fontSize + 'px';
    if (lhVal) lhVal.textContent = state.lineHeight.toFixed(1);
}

/* --- ТАЙМЕР --- */
function initTimer() {
    const timerEl = $('#egeTimer');
    if (!timerEl) return;
    timerEl.textContent = 'ЕГЭ завершён';
}

/* --- ПОИСК --- */
function initSearchHistory() {
    const stored = localStorage.getItem(LS.SEARCH);
    try { if (stored) state.searchHistory = JSON.parse(stored); } catch (e) { localStorage.removeItem(LS.SEARCH); }

    const input = $('#searchInput');
    const container = $('#searchHistory');
    if (!input || !container) return;

    input.addEventListener('focus', () => {
        if (state.searchHistory.length > 0 && input.value === '') {
            renderSearchHistory();
            container.hidden = false;
        }
    });

    const debouncedSearch = debounce((q) => {
        if (!q && state.searchHistory.length > 0) {
            renderSearchHistory();
            container.hidden = false;
        } else {
            container.hidden = true;
            filterArticles(q);
        }
    }, 300);

    input.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) container.hidden = true;
    });
}

function saveSearchQuery(query) {
    if (!query) return;
    state.searchHistory = state.searchHistory.filter(q => q !== query);
    state.searchHistory.unshift(query);
    if (state.searchHistory.length > 5) state.searchHistory.pop();
    localStorage.setItem(LS.SEARCH, JSON.stringify(state.searchHistory));
}

function renderSearchHistory() {
    const container = $('#searchHistory');
    if (!container) return;
    container.innerHTML = '';
    state.searchHistory.forEach(q => {
        const item = document.createElement('div');
        item.className = 'search-history-item';
        item.textContent = q;
        item.addEventListener('click', () => {
            $('#searchInput').value = q;
            container.hidden = true;
            performSearch(q);
        });
        container.appendChild(item);
    });
}

function performSearch(query) {
    saveSearchQuery(query);
    filterArticles(query);
    $('#searchHistory').hidden = true;
}

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}

function htmlToSearchText(html = '') {
    const template = document.createElement('template');
    template.innerHTML = html;
    return (template.content.textContent || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru');
}

function getArticleSearchResults(query, sourceList = state.articles) {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');
    if (!normalizedQuery) return sourceList;

    const articleQuery = normalizedQuery.match(/^(?:статья\s+)?(\d+(?:\.\d+)?)$/i);
    if (articleQuery) {
        const requestedNumber = articleQuery[1];
        return sourceList.filter(article => article.title.match(/Статья\s+(\d+(?:\.\d+)?)/i)?.[1] === requestedNumber);
    }

    return sourceList.filter(article => {
        const title = article.title.toLocaleLowerCase('ru');
        const visibleText = `${htmlToSearchText(article.bodyHTML)} ${htmlToSearchText(article.explainHTML)}`;
        if (title.includes(normalizedQuery) || visibleText.includes(normalizedQuery)) return true;

        if (normalizedQuery.length < 4) return false;
        const words = `${title} ${visibleText}`.match(/[а-яёa-z0-9.-]+/gi) || [];
        return words.some(word => Math.abs(word.length - normalizedQuery.length) <= 1
            && word[0] === normalizedQuery[0]
            && levenshtein(word, normalizedQuery) === 1);
    });
}

function scrollArticleToTop(target, behavior = 'smooth') {
    if (!target) return;
    const header = $('.site-header');
    const offset = (header?.getBoundingClientRect().height || 70) + 12;
    target.style.scrollMarginTop = `${offset}px`;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    if (behavior === 'auto') root.style.scrollBehavior = 'auto';
    target.scrollIntoView({ block: 'start', behavior });
    if (behavior === 'auto') requestAnimationFrame(() => { root.style.scrollBehavior = previousScrollBehavior; });
}

function updateMobileSearchBanner(query) {
    const banner = $('#mobileSearchBanner');
    if (!banner) return;
    if (query) {
        $('#mobileSearchBannerText').textContent = `Поиск: «${query}»`;
        banner.hidden = false;
    } else {
        banner.hidden = true;
    }
}

function filterArticles(query) {
    query = query.trim().toLocaleLowerCase('ru');
    state.activeSearchQuery = query;
    updateMobileSearchBanner(query);

    if (!query) { renderArticles(state.articles); return; }

    const sourceList = state.showFavoritesOnly ? state.articles.filter(a => state.favorites.has(a.id)) : state.articles;

    const filtered = getArticleSearchResults(query, sourceList);

    renderArticles(filtered);
}

function processText(text) {
    const articleRegex = /(стать(?:ей|ями|е|ю|я|и)\s+)((?:[\d\.\,\s–-]+|(?:\([^\)]+\))|и)+)/gi;
    text = text.replace(articleRegex, (match, prefix, listContent) => {
        const linkedList = listContent.replace(/((?:часть|пункт)\s+)?(\d+(?:\.\d+)?)/gi, (m, keyword, num) => {
            if (keyword) return m;
            const targetArt = state.articles.find(a => a.title.startsWith(`Статья ${num}`));
            if (targetArt) return `<a href="#${targetArt.id}" class="cross-link" data-target="${targetArt.id}">${num}</a>`;
            return num;
        });
        return prefix + linkedList;
    });

    return text;
}

/* --- FAV FOLDERS LOGIC --- */
function loadFavorites() {
    try {
        const stored = localStorage.getItem(LS.FAVORITES);
        if (stored) state.favorites = new Set(JSON.parse(stored));
        const storedFolders = localStorage.getItem(LS.FAV_FOLDERS);
        if (storedFolders) state.favFolders = JSON.parse(storedFolders);
        const storedMap = localStorage.getItem(LS.ARTICLE_FOLDERS);
        if (storedMap) state.articleFolders = JSON.parse(storedMap);
    } catch (e) {
        console.warn('Ошибка загрузки избранного:', e);
        [LS.FAVORITES, LS.FAV_FOLDERS, LS.ARTICLE_FOLDERS].forEach(k => localStorage.removeItem(k));
    }

    updateFavCount();
}

function toggleFavorite(id) {
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
        delete state.articleFolders[id];
        saveFolders();
    } else {
        state.favorites.add(id);
        state.articleFolders[id] = 'General'; // Default
        saveFolders();
    }
    localStorage.setItem(LS.FAVORITES, JSON.stringify([...state.favorites]));
    updateFavCount();
    renderArticles();
}

function saveFolders() {
    localStorage.setItem(LS.FAV_FOLDERS, JSON.stringify(state.favFolders));
    localStorage.setItem(LS.ARTICLE_FOLDERS, JSON.stringify(state.articleFolders));
}

function updateFavCount() {
    const badge = $('#favCount');
    if (badge) badge.textContent = state.favorites.size;
}

function setFavFilterMode() {
    state.showFavoritesOnly = !state.showFavoritesOnly;
    const btn = $('#favFilterBtn');

    if (state.showFavoritesOnly) {
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = `⭐ Скрыть избранное <span class="badge">${state.favorites.size}</span>`;
    } else {
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `⭐ Избранное <span class="badge">${state.favorites.size}</span>`;
        state.currentFolderFilter = 'all'; // reset
    }

    const search = $('#searchInput');
    if (search) search.value = '';
    state.activeSearchQuery = '';
    renderArticles();
}

function renderFolderSelect() {
    const select = $('#folderSelectFilter');
    select.innerHTML = '<option value="all">Все папки</option>';
    state.favFolders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        if (f === state.currentFolderFilter) opt.selected = true;
        select.appendChild(opt);
    });
}

/* --- ЗАМЕТКИ --- */
function loadNotes() {
    const stored = localStorage.getItem(LS.NOTES);
    try { if (stored) state.notes = JSON.parse(stored); } catch (e) { localStorage.removeItem(LS.NOTES); }
    updateNotesBadge();
}

function saveNote(id, text) {
    if (!text.trim()) delete state.notes[id];
    else state.notes[id] = text;
    localStorage.setItem(LS.NOTES, JSON.stringify(state.notes));
    updateNotesBadge();
}

function updateNotesBadge() {
    const count = Object.keys(state.notes).length;
    const badge = $('#notesCount');
    if (badge) { badge.textContent = count; badge.hidden = count === 0; }
}

/* --- ПРОГРЕСС ЧТЕНИЯ --- */
function loadProgress() {
    try {
        const stored = localStorage.getItem(LS.PROGRESS);
        if (stored) state.progress = JSON.parse(stored);
    } catch (e) { localStorage.removeItem(LS.PROGRESS); }
}

function toggleProgress(id) {
    if (state.progress[id]) delete state.progress[id];
    else state.progress[id] = 1;
    localStorage.setItem(LS.PROGRESS, JSON.stringify(state.progress));

    // Обновить кнопку на карточке
    const card = document.getElementById(id);
    if (card) {
        const btn = card.querySelector('.btn-read');
        if (btn) setReadBtn(btn, !!state.progress[id]);
    }
    updateProgressUI();
}

function setReadBtn(btn, isRead) {
    if (isRead) {
        btn.classList.add('read');
        btn.textContent = '✓ Прочитано';
    } else {
        btn.classList.remove('read');
        btn.textContent = '✓ Прочитал';
    }
}

function updateProgressUI() {
    const total = state.articles.length;
    if (total === 0) return;
    const done = Object.keys(state.progress).length;
    const pct = Math.round(done / total * 100);

    const txt = $('#progressText');
    if (txt) txt.textContent = `${done} / ${total} статей прочитано`;
    const fill = $('#progressFill');
    if (fill) fill.style.width = `${pct}%`;

    // Обновить прогресс-бары в TOC
    const chapters = {};
    state.articles.forEach(a => {
        if (!chapters[a.chapterTitle]) chapters[a.chapterTitle] = { total: 0, done: 0 };
        chapters[a.chapterTitle].total++;
        if (state.progress[a.id]) chapters[a.chapterTitle].done++;
    });
    Object.keys(chapters).forEach(ch => {
        const { total: t, done: d } = chapters[ch];
        const slug = ch.replace(/[^а-яёa-z0-9]/gi, '-');
        const pEl = $(`#toc-prog-${slug}`);
        if (pEl) pEl.textContent = `${d}/${t}`;
        const barEl = $(`#toc-bar-${slug}`);
        if (barEl) barEl.style.width = `${Math.round(d / t * 100)}%`;
    });
}

/* --- ПАНЕЛЬ ЗАМЕТОК --- */
function openNotesPanel() {
    const dlg = $('#notesDialog');
    if (!dlg) return;
    const body = $('#notesDialogBody');
    const search = $('#notesSearch');
    const renderNotes = () => {
        const query = (search?.value || '').trim().toLocaleLowerCase('ru');
        const articles = state.articles.filter(a => state.notes[a.id] && (!query
            || a.title.toLocaleLowerCase('ru').includes(query)
            || state.notes[a.id].toLocaleLowerCase('ru').includes(query)));
        body.innerHTML = '';
        if (articles.length === 0) {
            body.innerHTML = `<div class="empty-state">${query ? 'По этому запросу заметок нет.' : 'Нет заметок. Нажмите 📝 на любой статье, чтобы добавить.'}</div>`;
            return;
        }
        articles.forEach(a => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'notes-list-item';
            item.dataset.id = a.id;
            const title = document.createElement('span');
            title.className = 'notes-list-title';
            title.textContent = a.title;
            const preview = document.createElement('span');
            preview.className = 'notes-list-preview';
            preview.textContent = state.notes[a.id];
            item.append(title, preview);
            body.appendChild(item);
        });
        body.querySelectorAll('.notes-list-item').forEach(el => {
            el.addEventListener('click', () => {
                dlg.close();
                // Закрыть мобильное меню если открыто
                $('#sidebarPanel')?.classList.remove('visible');
                $('#mobileToolsSheet').hidden = true;
                state.showFavoritesOnly = false;
                state.currentFolderFilter = 'all';
                state.activeSearchQuery = '';
                const desktopSearch = $('#searchInput'); if (desktopSearch) desktopSearch.value = '';
                resetStudyFilters();
                const revealSavedNote = () => {
                    const currentTarget = document.getElementById(el.dataset.id);
                    if (!currentTarget) return;
                    const note = $('.note-container', currentTarget);
                    if (note) note.hidden = false;
                    currentTarget.tabIndex = -1;
                    currentTarget.focus({ preventScroll: true });
                    scrollArticleToTop(currentTarget, 'auto');
                    currentTarget.classList.add('highlight');
                    setTimeout(() => currentTarget.classList.remove('highlight'), 1500);
                };
                requestAnimationFrame(revealSavedNote);
                setTimeout(revealSavedNote, 700);
            });
        });
    };
    if (search) {
        search.value = '';
        search.oninput = debounce(renderNotes, 150);
    }
    renderNotes();
    dlg.showModal();
}

function applyTheme(init = false) {
    let t = localStorage.getItem(LS.THEME);
    if (!t && init) {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        t = systemPrefersDark ? 'dark' : 'light';
    } else if (!t) { t = 'dark'; }
    document.documentElement.classList.toggle('light', t === 'light');
    if (!init) updateScrollState();
}

function toggleTheme() {
    const isLight = document.documentElement.classList.contains('light');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem(LS.THEME, newTheme);
    applyTheme();
}
