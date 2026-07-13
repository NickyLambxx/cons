/* PrepMate: articles-ui.js */
/* --- SCROLL & SPY LOGIC --- */
function updateScrollState() {
    const scrollTop = window.scrollY;
    const bar = $('#scrollProgress .bar');
    if (bar) {
        const docHeight = document.body.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollPercent = scrollTop / (docHeight - winHeight);
        bar.style.width = Math.round(scrollPercent * 100) + '%';
    }
    const btnUp = $('#backToTop');
    if (btnUp) {
        if (scrollTop > 300) btnUp.classList.add('visible');
        else btnUp.classList.remove('visible');
    }
}

function initSpyScroll() {
    const toc = $('#toc');
    const checkActiveChapter = debounce(() => {
        if (!toc) return;
        const cards = $$('.card');
        if (cards.length === 0) return;

        const headerOffset = 100;
        let activeCard = null;
        
        for (let card of cards) {
            const rect = card.getBoundingClientRect();
            if (rect.bottom > headerOffset) {
                activeCard = card;
                break;
            }
        }

        if (!activeCard) return;

        const articleId = activeCard.dataset.articleId;
        const article = state.articles.find(a => a.id === articleId);

        if (article) {
            $$('.toc-chapter').forEach(el => el.classList.remove('active'));
            const chapters = $$('.toc-chapter');
            chapters.forEach(ch => {
                const titleSpan = ch.querySelector('.toc-chapter-header span:first-child');
                if (titleSpan && titleSpan.textContent === article.chapterTitle) {
                    ch.classList.add('active');
                }
            });
        }
    }, 100);

    window.addEventListener('scroll', checkActiveChapter);
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showReturnButton() { const btn = $('#btn-return'); if (btn) btn.classList.add('visible'); }
function hideReturnButton() { const btn = $('#btn-return'); if (btn) btn.classList.remove('visible'); }

function returnBack() {
    if (state.returnPosition !== null) {
        state.isJumping = true;
        window.scrollTo({ top: state.returnPosition, behavior: 'smooth' });
        hideReturnButton();
        setTimeout(() => {
            state.isJumping = false;
            state.returnPosition = null;
            state.landingPosition = null;
        }, 1000);
    }
}

function buildTOC() {
    const nav = $('#toc');
    if (!nav) return;
    nav.innerHTML = '<div class="toc-title">Оглавление</div><ul class="toc-list"></ul>';
    const ul = $('.toc-list', nav);

    const chapters = {};
    state.articles.forEach(a => {
        if (!chapters[a.chapterTitle]) chapters[a.chapterTitle] = [];
        chapters[a.chapterTitle].push(a);
    });

    Object.keys(chapters).forEach(chTitle => {
        const slug = chTitle.replace(/[^а-яёa-z0-9]/gi, '-');
        const chArts = chapters[chTitle];
        const li = document.createElement('li');
        li.className = 'toc-chapter';
        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'toc-chapter-header';
        header.setAttribute('aria-expanded', 'false');
        header.innerHTML = `<span>${chTitle}</span><span class="toc-chapter-progress" id="toc-prog-${slug}">0/${chArts.length}</span><span class="toc-toggle-icon">▼</span>`;
        header.addEventListener('click', () => {
            const isOpen = li.classList.toggle('open');
            header.setAttribute('aria-expanded', String(isOpen));
        });

        // Прогресс-бар под заголовком главы
        const progressBar = document.createElement('div');
        progressBar.className = 'toc-progress-bar';
        progressBar.innerHTML = `<div class="toc-progress-bar-fill" id="toc-bar-${slug}" style="width:0%"></div>`;

        const subUl = document.createElement('ul');
        subUl.className = 'toc-articles';
        chapters[chTitle].forEach(art => {
            const subLi = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = art.title;
            a.addEventListener('click', e => {
                e.preventDefault();
                // Закрываем мобильное боковое меню сразу
                const sidebarPanel = $('#sidebarPanel');
                if (sidebarPanel) sidebarPanel.classList.remove('visible');
                $$('.nav-item').forEach(b => b.classList.remove('active'));
                if (state.showFavoritesOnly) setFavFilterMode();
                let el = document.getElementById(art.id);
                if (!el) {
                    resetStudyFilters();
                    el = document.getElementById(art.id);
                }
                if (el) {
                    const offset = 80;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = el.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
                }
            });
            subLi.append(a);
            subUl.append(subLi);
        });
        li.append(header);
        li.append(progressBar);
        li.append(subUl);
        ul.append(li);
    });

    // Отрисовать актуальный прогресс
    updateProgressUI();
}

function renderArticles(list = state.articles) {
    const container = $('#content');
    if (!container) return;
    container.innerHTML = '';

    let displayList = applyStudyFilters(list);
    if (state.showFavoritesOnly) {
        displayList = list.filter(a => state.favorites.has(a.id));
        // Filter by Folder
        if (state.currentFolderFilter !== 'all') {
            displayList = displayList.filter(a => state.articleFolders[a.id] === state.currentFolderFilter);
        }

        if (displayList.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted)">В этой папке пока ничего нет.</div>';
            return;
        }
    }

    updateFilterSummary(displayList.length, list === state.articles ? state.articles.length : list.length);

    if (displayList.length === 0) {
        container.innerHTML = '<div class="empty-state">По выбранным условиям ничего не найдено. Попробуйте сбросить фильтры.</div>';
        return;
    }

    const template = $('#articleCardTmpl');

    displayList.forEach(a => {
        const node = template.content.cloneNode(true);
        const card = $('.card', node);
        card.dataset.articleId = a.id;
        card.id = a.id;

        const crumbs = $('.breadcrumbs', node);
        const chShort = a.chapterTitle.split('.')[0] || a.chapterTitle;
        crumbs.innerHTML = highlightPlainText(`${chShort.trim()} > ${a.title}`, state.activeSearchQuery);

        $('.title', node).innerHTML = highlightPlainText(a.title, state.activeSearchQuery);

        let processedBody = processText(a.bodyHTML);
        if (state.activeSearchQuery && state.activeSearchQuery.length > 2) {
             const escaped = state.activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             const re = new RegExp(`(${escaped})(?![^<]*>)`, 'gi');
             processedBody = processedBody.replace(re, '<mark>$1</mark>');
        }
        $('.body', node).innerHTML = processedBody;

        const explain = $('.explain', node);
        let processedExplain = a.explainHTML ? processText(a.explainHTML) : '';
        let foundInExplain = false;

        if (a.explainHTML) {
             if (state.activeSearchQuery && state.activeSearchQuery.length > 2) {
                const escaped = state.activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(`(${escaped})(?![^<]*>)`, 'gi');
                if (re.test(processedExplain)) foundInExplain = true;
                processedExplain = processedExplain.replace(re, '<mark>$1</mark>');
            }
            $('.explain-body', node).innerHTML = processedExplain;
            
            // ALWAYS VISIBLE (removed TeacherMode check)
            if (foundInExplain) { explain.open = true; }
        } else { explain.hidden = true; }

        const favBtn = $('.btn-fav', node);
        const isFav = state.favorites.has(a.id);
        favBtn.textContent = isFav ? '★' : '☆';
        if (isFav) favBtn.classList.add('active');
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(a.id); });


        const shareBtn = $('.btn-share', node);
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openShareDialog(a.title, a.bodyHTML.replace(/<[^>]+>/g, ' '));
        });

        const link = $('.deeplink', node);
        link.href = `#${a.id}`;
        link.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            history.replaceState(null, '', `#${a.id}`);
            const articleUrl = location.href;
            const snippet = a.bodyHTML.replace(/<[^>]+>/g, ' ').trim().slice(0, 120).trim() + '…';

            if (isMobileDevice() && navigator.share) {
                // На мобиле — нативный шаринг с заголовком и отрывком
                navigator.share({
                    title: `${a.title} — Конституция РФ`,
                    text: snippet,
                    url: articleUrl
                }).catch(err => { if (err.name !== 'AbortError') console.error(err); });
            } else {
                // На десктопе — копируем + информативный тост
                navigator.clipboard.writeText(articleUrl)
                    .then(() => showToast(`Ссылка на «${a.title}» скопирована`))
                    .catch(() => showToast(`Ссылка на «${a.title}» скопирована`));
            }
        });

        const noteBtn = $('.btn-note', node);
        const noteContainer = $('.note-container', node);
        const noteArea = $('.note-area', node);
        
        if (state.notes[a.id]) {
            noteArea.value = state.notes[a.id];
            noteContainer.hidden = false;
            noteBtn.classList.add('active');
        }

        noteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            noteContainer.hidden = !noteContainer.hidden;
            if (!noteContainer.hidden) noteArea.focus();
        });

        noteArea.addEventListener('input', debounce((e) => {
            saveNote(a.id, e.target.value);
            if (e.target.value.trim()) noteBtn.classList.add('active');
            else noteBtn.classList.remove('active');
        }, 500));

        const practice = ARTICLE_PRACTICE[a.id];
        const practiceBlock = $('.practice-situation', node);
        if (practice && practiceBlock) {
            practiceBlock.hidden = false;
            $('.practice-story', node).textContent = practice.situation;
            $('.practice-question', node).textContent = practice.question;
            const answer = $('.practice-answer', node);
            const label = document.createElement('strong');
            label.textContent = 'Разбор: ';
            answer.append(label, document.createTextNode(practice.answer));
        }

        if (a.title.includes('Статья 65')) {
            const mapBtn = document.createElement('button');
            mapBtn.className = 'btn btn-primary';
            mapBtn.style.marginTop = '10px';
            mapBtn.textContent = '🗺️ Открыть карту РФ';
            mapBtn.onclick = () => $('#mapDialog').showModal();
            $('.body', node).appendChild(mapBtn);
        }

        // Кнопка "Прочитал"
        const readBtn = $('.btn-read', node);
        if (readBtn) {
            setReadBtn(readBtn, !!state.progress[a.id]);
            readBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleProgress(a.id);
            });
        }

        const studyMeta = getArticleStudyMeta(a);
        const importance = $('.importance-badge', node);
        const importanceLabels = { key: 'Ключевая для ЕГЭ', useful: 'Полезная', reference: 'Справочная' };
        importance.textContent = importanceLabels[studyMeta.importance];
        importance.classList.add(`importance-${studyMeta.importance}`);

        const statusSelect = $('.article-status', node);
        statusSelect.value = state.articleStatuses[a.id] || 'new';
        statusSelect.addEventListener('change', event => {
            setArticleStatus(a.id, event.target.value);
            if (state.studyFilters.status !== 'all') renderArticles(list);
            else if (event.target.value === 'mastered' && readBtn) setReadBtn(readBtn, true);
        });

        container.append(node);
    });

    initDynamicEvents(container);
}

let _shareTitle = '';

function cleanHtmlToText(rawHtml) {
    return rawHtml
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function updateSharePreview(canvas) {
    const img = $('#sharePreviewImg');
    if (img) img.src = canvas.toDataURL('image/png');
    // Показываем подсказку для мобильных
    const hint = $('#shareLongPressHint');
    if (hint) hint.style.display = isMobileDevice() ? 'block' : 'none';
}

function openShareDialog(title, text) {
    const dlg = $('#shareDialog');
    const canvas = $('#shareCanvas');
    if (!dlg || !canvas) return;

    _shareTitle = title;
    const bodyText = cleanHtmlToText(text);

    const quoteEdit = $('#quoteEditText');
    if (quoteEdit) quoteEdit.value = bodyText;

    generateQuoteImage(canvas, title, bodyText);
    updateSharePreview(canvas);
    dlg.showModal();

    safeAddListener('#closeShare', 'click', () => dlg.close());

    $('#regenerateQuoteBtn').onclick = () => {
        const txt = ($('#quoteEditText')?.value || '').trim();
        if (txt) { generateQuoteImage(canvas, _shareTitle, txt); updateSharePreview(canvas); }
    };

    $('#downloadImgBtn').onclick = () => {
        const mobile = isMobileDevice();
        canvas.toBlob(blob => {
            const file = new File([blob], 'quote-constitution.png', { type: 'image/png' });
            // На мобиле с поддержкой Share API — сохраняем через него (попадает в галерею)
            if (mobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: 'Цитата из Конституции РФ' })
                    .catch(err => { if (err.name !== 'AbortError') console.error(err); });
            } else {
                // Desktop или iOS без Share API — обычное скачивание
                const link = document.createElement('a');
                link.download = `quote-constitution-${Date.now()}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                setTimeout(() => URL.revokeObjectURL(link.href), 5000);
            }
        });
    };

    $('#shareNativeBtn').onclick = () => {
        canvas.toBlob(blob => {
            const file = new File([blob], 'quote.png', { type: 'image/png' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: 'Конституция РФ', text: _shareTitle }).catch(console.error);
            } else if (navigator.share) {
                navigator.share({ title: 'Конституция РФ', text: `${_shareTitle}\n${$('#quoteEditText')?.value || ''}` }).catch(console.error);
            } else {
                showToast('Ваш браузер не поддерживает отправку');
            }
        });
    };
}

// Вспомогательная функция: разбивает текст на строки с переносом
function wrapToLines(ctx, text, maxWidth) {
    const lines = [];
    for (const para of text.split('\n')) {
        const trimmed = para.trim();
        if (!trimmed) { lines.push(''); continue; }
        const words = trimmed.split(' ');
        let line = '';
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
    }
    return lines;
}

function generateQuoteImage(canvas, title, text) {
    // --- Константы тетради ---
    const CELL     = 26;        // размер клетки в px
    const W        = 820;       // ширина листа (≈ A5 landscape)
    const MARG_L   = 80;        // красная полоса (левый отступ)
    const MARG_R   = 40;        // правый отступ
    const MARG_T   = CELL * 3;  // верхний отступ (3 клетки)
    const MARG_B   = CELL * 3;  // нижний отступ
    const FONT_SZ  = 20;        // размер шрифта (влезет в клетку CELL=26)
    const FONT     = `${FONT_SZ}px "Georgia","Times New Roman",serif`;
    const FONT_B   = `bold ${FONT_SZ}px "Georgia","Times New Roman",serif`;
    const TEXT_W   = W - MARG_L - MARG_R - 10;

    // --- Временный контекст для измерений ---
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = 10;
    const tc = tmp.getContext('2d');

    tc.font = FONT_B;
    const titleLines = wrapToLines(tc, title, TEXT_W);

    tc.font = FONT;
    const bodyLines = wrapToLines(tc, String(text || '').trim(), TEXT_W);

    // Итоговый список строк: заголовок, пустая, текст статьи, пустая
    const allLines = [...titleLines, '', ...bodyLines];

    // --- Высота холста ---
    const H = MARG_T + allLines.length * CELL + MARG_B;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');

    // === ФОНОВАЯ БУМАГА ===
    ctx.fillStyle = '#fdf8ee'; // тёплый кремовый
    ctx.fillRect(0, 0, W, H);

    // Лёгкая тень по краям (книжный эффект)
    const shadow = ctx.createLinearGradient(0, 0, 18, 0);
    shadow.addColorStop(0, 'rgba(0,0,0,0.07)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, 18, H);
    const shadow2 = ctx.createLinearGradient(W - 18, 0, W, 0);
    shadow2.addColorStop(0, 'rgba(0,0,0,0)');
    shadow2.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = shadow2;
    ctx.fillRect(W - 18, 0, 18, H);

    // === КЛЕТКА ===
    ctx.strokeStyle = 'rgba(130, 190, 220, 0.5)';
    ctx.lineWidth = 0.8;
    // Горизонтальные
    for (let y = CELL; y < H; y += CELL) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Вертикальные
    for (let x = CELL; x < W; x += CELL) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // === КРАСНАЯ ПОЛОСА (поля) ===
    ctx.strokeStyle = 'rgba(215, 55, 55, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(MARG_L, 0); ctx.lineTo(MARG_L, H); ctx.stroke();

    // === ТЕКСТ ===
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    // Первая строка: снизу первой клетки отступа + шрифт
    let y = MARG_T;

    for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i];
        if (!line) { y += CELL; continue; }
        const isTitleLine = i < titleLines.length;
        ctx.font = isTitleLine ? FONT_B : FONT;
        ctx.fillStyle = isTitleLine ? '#1a237e' : '#1c1c2e';
        ctx.fillText(line, MARG_L + 8, y);
        y += CELL;
    }

    // === ДИАГОНАЛЬНЫЙ ВОДЯНОЙ ЗНАК ===
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#1a237e';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const wmAngle = -Math.PI / 6; // -30°
    const wmSpX = 200;
    const wmSpY = 80;
    for (let wx = -wmSpX; wx < W + wmSpX; wx += wmSpX) {
        for (let wy = -wmSpY; wy < H + wmSpY; wy += wmSpY) {
            ctx.save();
            ctx.translate(wx, wy);
            ctx.rotate(wmAngle);
            ctx.fillText('PrepMate', 0, 0);
            ctx.restore();
        }
    }
    ctx.restore();

    // === ШТАМП PrepMate (нижний правый угол) ===
    ctx.fillStyle = 'rgba(26,35,126,0.82)';
    ctx.font = 'italic bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('PrepMate — Конституция РФ', W - 12, H - 8);
}

// Считает количество строк (с учётом \n как принудительного переноса)
function countLines(ctx, text, maxWidth) {
    let count = 0;
    for (const para of text.split('\n')) {
        const words = para.trim().split(' ').filter(Boolean);
        if (!words.length) { count++; continue; }
        let line = '';
        for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth && line) {
                count++;
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        count++;
    }
    return count;
}

// Рисует текст с переносами по словам и по \n (с отступом между параграфами)
function wrapTextCentered(ctx, text, x, y, maxWidth, lineHeight) {
    const paras = text.split('\n');
    for (let p = 0; p < paras.length; p++) {
        if (p > 0) y += lineHeight * 0.45; // дополнительный отступ между пунктами
        const words = paras[p].trim().split(' ').filter(Boolean);
        if (!words.length) continue;
        let line = '';
        for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth && line) {
                ctx.fillText(line.trim(), x, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) { ctx.fillText(line.trim(), x, y); y += lineHeight; }
    }
    return y - lineHeight;
}

function initDynamicEvents(container) {
    container.querySelectorAll('.cross-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            state.returnPosition = window.scrollY; state.isJumping = true;
            const targetId = link.dataset.target;
            const el = document.getElementById(targetId);
            if (el) {
                const offset = 80;
                const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
                state.landingPosition = elementPosition - offset;
                showReturnButton();
                el.classList.add('highlight');
                setTimeout(() => { el.classList.remove('highlight'); state.isJumping = false; }, 1000);
            }
        });
    });
}

function moveTooltip(e) {
    const tooltip = $('#tooltip'); if (!tooltip) return;
    const x = e.clientX; const y = e.clientY;
    tooltip.style.left = (x + 15) + 'px'; tooltip.style.top = (y + 15) + 'px';
    if (x + 320 > window.innerWidth) tooltip.style.left = (x - 315) + 'px';
    if (y + 100 > window.innerHeight) tooltip.style.top = (y - 100) + 'px';
}

function showToast(msg = "Ссылка скопирована!") {
    const toast = $('#toast'); if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

function initDictionary() {
    let activeLetter = 'all';
    const renderDictionary = () => {
        const list = $('#dictionaryList');
        if (!list) return;
        const query = ($('#dictionarySearch')?.value || '').trim().toLocaleLowerCase('ru');
        const terms = Object.keys(DICTIONARY).sort((a, b) => a.localeCompare(b, 'ru')).filter(term => {
            const matchesLetter = activeLetter === 'all' || term.toLocaleUpperCase('ru').startsWith(activeLetter);
            const matchesQuery = !query || term.toLocaleLowerCase('ru').includes(query) || DICTIONARY[term].toLocaleLowerCase('ru').includes(query);
            return matchesLetter && matchesQuery;
        });
        list.innerHTML = '';
        terms.forEach(term => {
            const div = document.createElement('div');
            div.className = 'dict-item';
            const name = document.createElement('span');
            name.className = 'dict-term';
            name.textContent = term.charAt(0).toLocaleUpperCase('ru') + term.slice(1);
            const definition = document.createElement('span');
            definition.className = 'dict-def';
            definition.textContent = DICTIONARY[term];
            div.append(name, definition);
            list.appendChild(div);
        });
        if (!terms.length) list.innerHTML = '<div class="empty-state">Термины не найдены.</div>';
        const count = $('#dictionaryCount');
        if (count) count.textContent = `Найдено: ${terms.length}`;
    };

    const alphabet = $('#dictionaryAlphabet');
    if (alphabet) {
        ['Все', ...new Set(Object.keys(DICTIONARY).map(term => term[0].toLocaleUpperCase('ru')))].forEach(letter => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = letter;
            button.dataset.letter = letter === 'Все' ? 'all' : letter;
            if (letter === 'Все') button.classList.add('active');
            button.addEventListener('click', () => {
                activeLetter = button.dataset.letter;
                $$('#dictionaryAlphabet button').forEach(item => item.classList.toggle('active', item === button));
                renderDictionary();
            });
            alphabet.append(button);
        });
    }
    $('#dictionarySearch')?.addEventListener('input', debounce(renderDictionary, 150));
    safeAddListener('#dictionaryBtn', 'click', () => {
        const dlg = $('#dictionaryDialog'); if (!dlg) return;
        renderDictionary();
        dlg.showModal();
    });
    safeAddListener('#closeDictionary', 'click', () => $('#dictionaryDialog').close());
}


/* --- IMPROVED MAP LOGIC (ZOOM) --- */
function initMap() {
    safeAddListener('#closeMap', 'click', () => $('#mapDialog').close());
    const title = $('#mapRegionTitle');
    const list = $('#mapRegionList');
    const zoomLayer = $('#zoomLayer');

    // Zoom Controls
    safeAddListener('#zoomIn', 'click', () => changeZoom(0.3));
    safeAddListener('#zoomOut', 'click', () => changeZoom(-0.3));
    safeAddListener('#zoomReset', 'click', () => { state.mapZoom = 1; state.mapPan = {x:0,y:0}; updateMapTransform(); });

    // Click on region
    $$('.region').forEach(reg => {
        reg.addEventListener('click', (e) => {
            const id = e.target.id;
            const data = FEDERAL_DISTRICTS[id];
            if (data) {
                title.textContent = data.title;
                list.innerHTML = '';
                const items = data.list.split(',').map(s => s.trim());
                items.forEach(i => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="flag-placeholder"></span> ${i}`;
                    list.appendChild(li);
                });
            }
        });
    });

    // Drag Logic
    const container = $('#mapContainer');
    let isDragging = false;
    let startX, startY;

    container.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX - state.mapPan.x; startY = e.clientY - state.mapPan.y; });
    window.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        state.mapPan.x = e.clientX - startX;
        state.mapPan.y = e.clientY - startY;
        updateMapTransform();
    });
}

function changeZoom(delta) {
    state.mapZoom = Math.max(1, Math.min(3, state.mapZoom + delta));
    updateMapTransform();
}

function updateMapTransform() {
    const layer = $('#zoomLayer');
    if (layer) {
        layer.style.transform = `translate(${state.mapPan.x}px, ${state.mapPan.y}px) scale(${state.mapZoom})`;
    }
}
