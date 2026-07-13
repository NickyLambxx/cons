/* PrepMate: app.js */
/* --- ЗАЩИЩЕННАЯ ЗАГРУЗКА --- */
async function loadChapters() {
    const container = $('#content');
    const cachedData = localStorage.getItem(LS.CACHE_CHAPTERS);
    
    // 1. Попытка показать кэш (для скорости)
    if (cachedData) {
        try {
            state.articles = JSON.parse(cachedData);
            syncChapterFilter();
            renderArticles(); 
            buildTOC();
        } catch (e) { console.error('Ошибка кэша:', e); }
    }

    try {
        const files = [
            'chapters/chapter1.html', 'chapters/chapter2.html', 'chapters/chapter3.html',
            'chapters/chapter4.html', 'chapters/chapter5.html', 'chapters/chapter6.html',
            'chapters/chapter7.html', 'chapters/chapter8.html', 'chapters/chapter9.html'
        ];
        
        // Fetch с тайм-аутом, чтобы не висело вечно
        const fetchWithTimeout = (url, timeout = 5000) => {
            return Promise.race([
                fetch(url).then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.text();
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
            ]);
        };

        const results = await Promise.allSettled(files.map(f => fetchWithTimeout(f)));

        let newArticles = [];
        const parser = new DOMParser();

        results.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                const html = res.value;
                const doc = parser.parseFromString(html, 'text/html');
                const chapterTitle = doc.querySelector('h2')?.textContent?.trim() || `Глава ${index + 1}`;
                
                // Ищем статьи. Если формат сбит, пробуем более широкий поиск
                const articlesNodes = doc.querySelectorAll('article.interactive-article, article, div.article');
                
                articlesNodes.forEach(artNode => {
                    const id = artNode.id || `article-${index}-${Math.random().toString(36).slice(2, 7)}`;
                    const titleHeader = artNode.querySelector('h3') || artNode.querySelector('h4') || artNode.querySelector('strong');
                    const title = artNode.getAttribute('data-title') || titleHeader?.textContent?.trim() || 'Статья';
                    
                    // Парсинг пояснений
                    let explain = artNode.getAttribute('data-comment') || '';
                    const explainNode = artNode.querySelector('.explanation-source');
                    if (explainNode) {
                        explain = explainNode.innerHTML;
                        // Не удаляем узел из DOM сразу, чтобы не ломать клонирование ниже, если что
                        // но для bodyHTML нужно удалить
                    }

                    // Клонируем для bodyHTML
                    const bodyClone = artNode.cloneNode(true);
                    // Удаляем заголовок из тела, чтобы не дублировался
                    const h3 = bodyClone.querySelector('h3, h4');
                    if(h3) h3.remove();
                    
                    // Удаляем блок с пояснением из тела
                    const expSource = bodyClone.querySelector('.explanation-source');
                    if(expSource) expSource.remove();

                    if (bodyClone.textContent.trim().length > 0) {
                         newArticles.push({ id, title, bodyHTML: bodyClone.innerHTML, explainHTML: explain, chapterTitle });
                    }
                });
            } else {
                console.warn(`Пропущена глава ${index + 1}:`, res.reason);
            }
        });

        if (newArticles.length > 0) {
            state.articles = newArticles;
            syncChapterFilter();
            try { localStorage.setItem(LS.CACHE_CHAPTERS, JSON.stringify(newArticles)); } catch (e) { }

            // Безопасный рендер
            try { renderArticles(); } catch(e) { console.error('Render error:', e); }
            try { buildTOC(); } catch(e) { console.error('TOC error:', e); }

            applyFontSettings();

            // Прокрутить к статье если открыли по прямой ссылке (#article-id)
            const hash = location.hash.replace('#', '');
            if (hash) {
                setTimeout(() => {
                    const target = document.getElementById(hash);
                    if (target) {
                        const pos = target.getBoundingClientRect().top + window.scrollY - 90;
                        window.scrollTo({ top: pos, behavior: 'smooth' });
                        target.classList.add('highlight');
                        setTimeout(() => target.classList.remove('highlight'), 2000);
                    }
                }, 300);
            }
        } else if (!cachedData) {
            throw new Error("Не удалось загрузить ни одной главы (пустой результат).");
        }
        
    } catch (e) {
        console.error('Critical load error:', e);
        if (state.articles.length === 0 && container) {
            container.innerHTML = `<div class="error" style="color:red;padding:20px;border:1px solid red;text-align:center">
                <h3>Ошибка загрузки</h3>
                <p>${e.message}</p>
                <button onclick="location.reload()" class="btn">Попробовать еще раз</button>
            </div>`;
        }
    } finally {
        // Снимаем лоадер ВСЕГДА, даже если была ошибка
        if (container) container.classList.remove('loading');
        updateScrollState();
    }
}

function openDialogById(id) {
    const art = state.articles.find(x => x.id === id); if (!art) return;
    const dlg = $('#articleDialog'); if (!dlg) return;
    $('#dialogTitle').textContent = art.title;
    $('#dialogBody').innerHTML = processText(art.bodyHTML) + (art.explainHTML ? `<hr><div class="muted">Пояснение:</div>${processText(art.explainHTML)}` : '');
    initDynamicEvents($('#dialogBody'));
    dlg.showModal();
}

function boot() {
    applyTheme(true);
    loadFavorites();
    loadNotes();
    loadProgress();
    initStudyTools();
    initPracticeTools();
    initFontSettings(); 
    initSearchHistory(); 
    initTimer(); 
    initGame(); 
    initGame23(); 
    initFlashcards(); 
    initMixedTraining();
    initDictionary(); 
    initMap(); 
    initMobileNav(); 
    initFoldersUI(); 
    initEvents();
    initSpyScroll();
    initPWAInstall();
    initServiceWorker();
    loadChapters();
}

document.addEventListener('DOMContentLoaded', boot);
