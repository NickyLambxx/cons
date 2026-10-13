/* PrepMate: study-tools.js — фильтры, важность и статусы изучения */
const KEY_ARTICLES = new Set([
    1, 2, 3, 4, 5, 6, 7, 10, 13, 14, 15, 17, 19, 20, 21, 22, 23, 24, 25,
    27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 45, 46,
    47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 71, 72, 80,
    81, 83, 84, 86, 87, 88, 89, 90, 93, 94, 95, 97, 98, 102, 103, 104, 105,
    106, 107, 108, 110, 111, 114, 115, 117, 118, 120, 123, 125, 129
]);

function getArticleNumber(article) {
    return Number(article.title.match(/Статья\s+(\d+)/i)?.[1] || 0);
}

function getArticleStudyMeta(article) {
    const number = getArticleNumber(article);
    const exam = [];
    if ((number >= 80 && number <= 117) || number === 125) exam.push('13');
    if (number >= 1 && number <= 129) exam.push('23');
    if (number >= 17 && number <= 64) exam.push('rights');
    if (number >= 65 && number <= 79) exam.push('federation');
    const importance = KEY_ARTICLES.has(number) ? 'key' : (number <= 129 ? 'useful' : 'reference');
    return { number, exam, importance };
}

function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function highlightPlainText(value, query, minLength = 1) {
    const safe = escapeHTML(value);
    if (!query || query.length < minLength) return safe;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
}

function highlightHTMLText(html, query) {
    const template = document.createElement('template');
    template.innerHTML = html;
    if (!query) return template.innerHTML;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(`(${escapedQuery})`, 'gi');
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(textNode => {
        if (!textNode.nodeValue.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'))) return;
        const fragment = document.createDocumentFragment();
        textNode.nodeValue.split(matcher).forEach(part => {
            if (!part) return;
            if (part.toLocaleLowerCase('ru') === query.toLocaleLowerCase('ru')) {
                const mark = document.createElement('mark');
                mark.textContent = part;
                fragment.append(mark);
            } else {
                fragment.append(document.createTextNode(part));
            }
        });
        textNode.replaceWith(fragment);
    });

    return template.innerHTML;
}

function loadArticleStatuses() {
    try {
        state.articleStatuses = JSON.parse(localStorage.getItem(LS.ARTICLE_STATUS) || '{}');
    } catch (_) {
        state.articleStatuses = {};
        localStorage.removeItem(LS.ARTICLE_STATUS);
    }
}

function setArticleStatus(id, status) {
    if (status === 'new') delete state.articleStatuses[id];
    else state.articleStatuses[id] = status;
    if (status === 'mastered') {
        state.progress[id] = 1;
        localStorage.setItem(LS.PROGRESS, JSON.stringify(state.progress));
    }
    localStorage.setItem(LS.ARTICLE_STATUS, JSON.stringify(state.articleStatuses));
    updateProgressUI();
    updateStudyFilterCounts();
}

function applyStudyFilters(list) {
    const { chapter, exam, status } = state.studyFilters;
    return list.filter(article => {
        const meta = getArticleStudyMeta(article);
        const articleStatus = state.articleStatuses[article.id] || 'new';
        return (chapter === 'all' || article.chapterTitle === chapter)
            && (exam === 'all' || meta.exam.includes(exam))
            && (status === 'all' || articleStatus === status);
    });
}

function updateFilterSummary(visible, total = state.articles.length, sourceList = null) {
    const summary = $('#filterSummary');
    if (summary) summary.textContent = visible === total ? `Показаны все статьи: ${total}` : `Показано статей: ${visible} из ${total}`;
    updateStudyFilterCounts(sourceList);
}

function updateStudyFilterCounts(sourceList = null) {
    const searchList = sourceList || (state.activeSearchQuery ? getArticleSearchResults(state.activeSearchQuery) : state.articles);
    const filterKeys = { chapterFilter: 'chapter', examFilter: 'exam', statusFilter: 'status' };
    Object.entries(filterKeys).forEach(([id, key]) => {
        const select = $(`#${id}`);
        if (!select) return;
        [...select.options].forEach(option => {
            if (!option.dataset.label) option.dataset.label = option.textContent.replace(/ \(\d+\)$/, '');
            const count = searchList.filter(article => {
                const meta = getArticleStudyMeta(article);
                const values = { ...state.studyFilters, [key]: option.value };
                return (values.chapter === 'all' || article.chapterTitle === values.chapter)
                    && (values.exam === 'all' || meta.exam.includes(values.exam))
                    && (values.status === 'all' || (state.articleStatuses[article.id] || 'new') === values.status);
            }).length;
            option.textContent = `${option.dataset.label} (${count})`;
        });
    });
}

function syncChapterFilter() {
    const select = $('#chapterFilter');
    if (!select || select.options.length > 1) return;
    [...new Set(state.articles.map(article => article.chapterTitle))].forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        select.append(option);
    });
}

function resetStudyFilters() {
    state.studyFilters = { chapter: 'all', exam: 'all', status: 'all' };
    ['chapterFilter', 'examFilter', 'statusFilter'].forEach(id => { if ($(`#${id}`)) $(`#${id}`).value = 'all'; });
    renderArticles();
}

function initStudyTools() {
    loadArticleStatuses();
    const toggle = $('#toggleStudyFilters');
    const body = $('#studyFilterBody');
    if (toggle && body) {
        const mobile = matchMedia('(max-width: 768px)').matches;
        body.hidden = mobile;
        toggle.setAttribute('aria-expanded', String(!mobile));
        toggle.textContent = mobile ? 'Показать фильтры' : 'Свернуть';
        toggle.addEventListener('click', () => {
            body.hidden = !body.hidden;
            toggle.setAttribute('aria-expanded', String(!body.hidden));
            toggle.textContent = body.hidden ? 'Показать фильтры' : 'Свернуть';
        });
    }
    [['chapterFilter', 'chapter'], ['examFilter', 'exam'], ['statusFilter', 'status']].forEach(([id, key]) => {
        safeAddListener(`#${id}`, 'change', event => {
            state.studyFilters[key] = event.target.value;
            renderArticles();
        });
    });
    safeAddListener('#resetStudyFilters', 'click', resetStudyFilters);
}
