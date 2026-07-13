/* PrepMate: mobile-pwa.js */
function closeMobileExtras() {
    $('#mobileToolsSheet').hidden = true;
    $('#sidebarPanel')?.classList.remove('visible');
    const overlay = $('#mobileSearchOverlay');
    if (overlay) overlay.hidden = true;
}

function initMobileNav() {
    safeAddListener('#navHome', 'click', () => {
        closeMobileExtras();
        if (state.showFavoritesOnly) setFavFilterMode();
        scrollToTop();
        $$('.nav-item').forEach(b => b.classList.remove('active'));
        $('#navHome').classList.add('active');
    });

    // Сброс поиска через баннер (без double-tap — он вызывает зум)
    safeAddListener('#mobileSearchBannerClear', 'click', () => {
        filterArticles('');
        const si = $('#searchInput'); if (si) si.value = '';
        const mi = $('#mobileSearchInput'); if (mi) mi.value = '';
        showToast('Поиск сброшен');
    });

    safeAddListener('#navSearch', 'click', () => {
        closeMobileExtras();
        if (state.showFavoritesOnly) setFavFilterMode();
        $$('.nav-item').forEach(b => b.classList.remove('active'));
        $('#navSearch').classList.add('active');
        const overlay = $('#mobileSearchOverlay');
        overlay.hidden = false;
        const mobileInput2 = $('#mobileSearchInput');
        if (mobileInput2) mobileInput2.value = '';
        showMobileSearchHistory();
        setTimeout(() => mobileInput2?.focus(), 100);
    });

    safeAddListener('#navFav', 'click', () => {
        closeMobileExtras();
        setFavFilterMode();
        $$('.nav-item').forEach(b => b.classList.remove('active'));
        if (state.showFavoritesOnly) $('#navFav').classList.add('active');
    });

    safeAddListener('#navMenu', 'click', () => {
        $('#mobileToolsSheet').hidden = true;
        const overlay = $('#mobileSearchOverlay');
        if (overlay) overlay.hidden = true;
        $('#sidebarPanel').classList.toggle('visible');
        $$('.nav-item').forEach(b => b.classList.remove('active'));
        if ($('#sidebarPanel').classList.contains('visible')) $('#navMenu').classList.add('active');
    });

    safeAddListener('#navTools', 'click', () => {
        const sheet = $('#mobileToolsSheet');
        if (!sheet) return;
        // Просто переключаем sheet — ничего больше не трогаем.
        // Sheet имеет z-index 4700 → появляется поверх поиска, меню, избранного.
        sheet.hidden = !sheet.hidden;
    });

    // Кнопки в sheet — дублируем функции из header-tools
    safeAddListener('#mobileFlashcards', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#flashcardsBtn')?.click(); });
    safeAddListener('#mobileDictionary', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#dictionaryBtn')?.click(); });
    safeAddListener('#mobileMixedTraining', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#mixedTrainingBtn')?.click(); });
    safeAddListener('#mobileGame23', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#game23Btn')?.click(); });
    safeAddListener('#mobileGame', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#gameBtn')?.click(); });
    safeAddListener('#mobileFontBtn', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#fontBtn')?.click(); });
    safeAddListener('#mobileTheme', 'click', () => { $('#mobileToolsSheet').hidden = true; toggleTheme(); });
    safeAddListener('#mobileArgumentBank', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#argumentBankBtn')?.click(); });
    safeAddListener('#mobileFindError', 'click', () => { $('#mobileToolsSheet').hidden = true; $('#findErrorBtn')?.click(); });

    // Закрытие мобильного поиска
    safeAddListener('#mobileSearchClose', 'click', () => {
        $('#mobileSearchOverlay').hidden = true;
        $$('.nav-item').forEach(b => b.classList.remove('active'));
        $('#navHome').classList.add('active');
    });

    // Поиск при вводе (с задержкой)
    const mobileInput = $('#mobileSearchInput');
    if (mobileInput) {
        mobileInput.addEventListener('input', debounce((e) => {
            const q = e.target.value.trim();
            const container = $('#mobileSearchResults');
            if (!q) { showMobileSearchHistory(); return; }
            const results = getArticleSearchResults(q, state.articles).slice(0, 15);
            container.innerHTML = results.length
                ? results.map(a => `<div class="mobile-search-result-item" data-id="${escapeHTML(a.id)}" data-title="${escapeHTML(a.title)}"><strong>${highlightPlainText(a.title, q)}</strong><span class="mobile-result-chapter">${highlightPlainText(a.chapterTitle, q)}</span></div>`).join('')
                : '<div style="padding:20px;text-align:center;color:var(--muted)">Ничего не найдено</div>';
            container.querySelectorAll('.mobile-search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                    const selectedArticle = state.articles.find(article => article.id === el.dataset.id);
                    if (!selectedArticle) return;
                    saveSearchQuery(q);
                    $('#mobileSearchOverlay').hidden = true;
                    $$('.nav-item').forEach(b => b.classList.remove('active'));
                    state.showFavoritesOnly = false;
                    state.currentFolderFilter = 'all';
                    state.studyFilters = { chapter: 'all', exam: 'all', status: 'all' };
                    ['chapterFilter', 'examFilter', 'statusFilter'].forEach(id => { if ($(`#${id}`)) $(`#${id}`).value = 'all'; });
                    state.activeSearchQuery = q.toLocaleLowerCase('ru');
                    document.body.classList.add('search-active');
                    updateMobileSearchBanner(q);
                    renderArticles([selectedArticle]);
                    updateFilterSummary(1, state.articles.length);
                    requestAnimationFrame(() => {
                        const target = document.getElementById(el.dataset.id);
                        if (target) { scrollSearchMatchToTop(target, 'auto'); target.classList.add('highlight'); setTimeout(() => target.classList.remove('highlight'), 1500); }
                    });
                });
            });
        }, 300));
        mobileInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = mobileInput.value.trim();
                if (q) {
                    saveSearchQuery(q);
                    $('#mobileSearchOverlay').hidden = true;
                    $$('.nav-item').forEach(b => b.classList.remove('active'));
                    filterArticles(q);
                    requestAnimationFrame(() => {
                        const firstResult = $('#content .card');
                        if (firstResult) scrollSearchMatchToTop(firstResult, 'auto');
                    });
                }
            }
        });
    }
}

function showMobileSearchHistory() {
    const container = $('#mobileSearchResults');
    if (!container) return;
    if (!state.searchHistory || !state.searchHistory.length) {
        container.innerHTML = '<div style="padding:30px 20px;text-align:center;color:var(--muted);font-size:14px">Начните вводить запрос...</div>';
        return;
    }
    container.innerHTML =
        '<div style="padding:6px 4px 8px;color:var(--muted);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px">Недавние запросы</div>' +
        state.searchHistory.map(q =>
            `<div class="mobile-search-result-item mobile-history-item" data-q="${q}" style="display:flex;align-items:center;gap:10px">
                <span style="font-size:16px;opacity:0.5">🕐</span>
                <span>${q}</span>
            </div>`
        ).join('');
    container.querySelectorAll('.mobile-history-item').forEach(el => {
        el.addEventListener('click', () => {
            const q = el.dataset.q;
            $('#mobileSearchInput').value = q;
            $('#mobileSearchOverlay').hidden = true;
            $$('.nav-item').forEach(b => b.classList.remove('active'));
            filterArticles(q);
        });
    });
}

/* --- INIT FOLDERS UI HANDLERS --- */
function initFoldersUI() {
    const select = $('#folderSelectFilter');
    if (select) {
        select.addEventListener('change', (e) => {
            state.currentFolderFilter = e.target.value;
            renderArticles();
        });
    }
}

function initPWAInstall() {
    let deferredPrompt;
    const btn = $('#installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        btn.hidden = false; // Show button in header
    });

    btn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            btn.hidden = true;
        }
    });
}

function initEvents() {
    let resetSnapshot = null;
    let undoTimer = null;
    let printExplanationState = [];
    safeAddListener('#themeToggle', 'click', toggleTheme);
    safeAddListener('#printBtn', 'click', () => window.print());
    safeAddListener('#favFilterBtn', 'click', setFavFilterMode);
    safeAddListener('#closeDialog', 'click', () => $('#articleDialog').close());
    safeAddListener('#notesBtn', 'click', openNotesPanel);
    safeAddListener('#mobileNotesBtn', 'click', () => { $('#mobileToolsSheet').hidden = true; openNotesPanel(); });
    safeAddListener('#closeNotes', 'click', () => $('#notesDialog').close());
    safeAddListener('#resetProgressBtn', 'click', () => $('#resetProgressDialog')?.showModal());
    safeAddListener('#cancelResetProgress', 'click', () => $('#resetProgressDialog')?.close());
    safeAddListener('#confirmResetProgress', 'click', () => {
        resetSnapshot = { ...state.progress };
        state.progress = {};
        localStorage.removeItem(LS.PROGRESS);
        $$('.btn-read').forEach(btn => setReadBtn(btn, false));
        updateProgressUI();
        $('#resetProgressDialog')?.close();
        const toast = $('#undoProgressToast');
        if (toast) toast.hidden = false;
        clearTimeout(undoTimer);
        undoTimer = setTimeout(() => { if (toast) toast.hidden = true; resetSnapshot = null; }, 7000);
    });
    safeAddListener('#undoProgressBtn', 'click', () => {
        if (!resetSnapshot) return;
        state.progress = resetSnapshot;
        localStorage.setItem(LS.PROGRESS, JSON.stringify(state.progress));
        $$('.card').forEach(card => setReadBtn(card.querySelector('.btn-read'), !!state.progress[card.dataset.articleId]));
        updateProgressUI();
        resetSnapshot = null;
        clearTimeout(undoTimer);
        if ($('#undoProgressToast')) $('#undoProgressToast').hidden = true;
        showToast('Прогресс восстановлен');
    });

    window.addEventListener('beforeprint', () => {
        printExplanationState = $$('.card details.explain').map(details => ({ details, open: details.open }));
        printExplanationState.forEach(item => { item.details.open = true; });
    });
    window.addEventListener('afterprint', () => {
        printExplanationState.forEach(item => { item.details.open = item.open; });
        printExplanationState = [];
    });
    
    $$('dialog').forEach(dlg => {
        dlg.addEventListener('click', (e) => {
            if (e.target === dlg) dlg.close();
        });
    });

    const searchInput = $('#searchInput');
    const searchBtn = $('#searchTriggerBtn');
    if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(searchInput.value); });
    if (searchBtn) searchBtn.addEventListener('click', () => { if (searchInput) performSearch(searchInput.value); });

    safeAddListener('#backToTop', 'click', scrollToTop);
    safeAddListener('#btn-return', 'click', returnBack);

    const content = $('#content');
    if (content) {
        content.addEventListener('click', e => {
            if (e.target.closest('.player-btn') || e.target.closest('.sheet-btn')) return;

            if (e.target.closest('.term') || e.target.closest('.cross-link') || e.target.closest('button') || e.target.closest('.note-area') || e.target.closest('select')) return;
            const card = e.target.closest('.card');
            if (card && e.altKey) openDialogById(card.dataset.articleId);
        });
        content.addEventListener('dblclick', e => {
            if (e.target.closest('.term') || e.target.closest('.cross-link') || e.target.closest('button') || e.target.closest('.note-area') || e.target.closest('select')) return;
            const card = e.target.closest('.card');
            if (card) openDialogById(card.dataset.articleId);
        });
    }

    window.addEventListener('hashchange', () => {
        const hash = location.hash.replace('#', ''); if (!hash) return;
        const target = document.getElementById(hash);
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('highlight'); setTimeout(() => target.classList.remove('highlight'), 1500); }
    });
    window.addEventListener('scroll', updateScrollState);
    window.addEventListener('keydown', e => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); $('#searchInput').focus(); }
    });
}

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });

        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.update(); 
            const showUpdateUI = (worker) => {
                const toast = $('#updateNotification');
                const btn = $('#reloadBtn');
                if (toast && btn) {
                    toast.hidden = false;
                    btn.onclick = () => {
                        btn.disabled = true;
                        btn.textContent = 'Обновление...';
                        worker.postMessage({ type: 'SKIP_WAITING' });
                    };
                }
            };
            if (reg.waiting) { showUpdateUI(reg.waiting); return; }
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateUI(newWorker);
                    }
                });
            });
        }).catch(err => console.error('SW Error:', err));
    }
}
