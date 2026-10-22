/* Demonstration mode, reading history and constitutional procedure diagrams. */
const READING_HISTORY_LIMIT = 20;
const readingHistory = [];
const PROCEDURE_SCHEMES = [
    {
        id: 'federal-law', title: 'Как принимается федеральный закон',
        steps: [
            ['104', 'Законодательная инициатива', 'Законопроект вносится в Государственную Думу субъектом права законодательной инициативы.'],
            ['105', 'Государственная Дума', 'Принимает федеральный закон большинством от общего числа депутатов, если Конституция не устанавливает иное. В течение 5 дней передаёт его в Совет Федерации.'],
            ['105', 'Совет Федерации', 'Одобряет закон большинством более половины от общего числа сенаторов. Общее правило допускает одобрение без рассмотрения в течение 14 дней, но для вопросов статьи 106 рассмотрение обязательно.'],
            ['107', 'Президент', 'Принятый закон направляется Президенту в течение 5 дней. Президент в течение 14 дней подписывает его и обнародует либо отклоняет.'],
            ['15', 'Официальное опубликование', 'Неопубликованные законы не применяются. Вступление закона в силу и его опубликование — разные этапы.']
        ],
        branches: [
            ['106', 'Когда Совет Федерации обязан рассмотреть закон?', 'В частности, по вопросам бюджета, федеральных налогов и сборов, финансового регулирования, международных договоров, государственной границы, войны и мира. Полный перечень — в статье 106.'],
            ['105', 'Если Совет Федерации отклонил закон', 'Палаты могут создать согласительную комиссию. При несогласии с решением Совета Федерации Государственная Дума может принять закон повторно не менее чем двумя третями от общего числа депутатов.'],
            ['107', 'Если Президент отклонил закон', 'Палаты повторно рассматривают закон. Для преодоления вето прежнюю редакцию должны одобрить не менее двух третей от общего числа сенаторов и не менее двух третей от общего числа депутатов. Тогда Президент подписывает закон и обнародует его в течение 7 дней.'],
            ['107', 'Проверка Конституционным Судом', 'В предусмотренном частью 3 статьи 107 случае Президент может обратиться в Конституционный Суд; срок подписания приостанавливается. При подтверждении конституционности закон подписывается в течение 3 дней с момента решения, иначе возвращается в Думу без подписания.']
        ]
    },
    {
        id: 'constitutional-law', title: 'Как принимается федеральный конституционный закон',
        steps: [
            ['108', 'Вопрос предусмотрен Конституцией', 'ФКЗ принимается по вопросам, для которых сама Конституция предусматривает такой вид закона.'],
            ['108', 'Государственная Дума', 'Не менее двух третей голосов от общего числа депутатов.'],
            ['108', 'Совет Федерации', 'Не менее трёх четвертей голосов от общего числа сенаторов.'],
            ['108', 'Президент', 'Принятый ФКЗ в течение 14 дней подлежит подписанию и обнародованию. Обычное президентское вето, предусмотренное для ФЗ, здесь не применяется.'],
            ['15', 'Официальное опубликование', 'Неопубликованный закон не применяется. Дата вступления в силу определяется отдельно.']
        ],
        branches: [
            ['108', 'Проверка Конституционным Судом', 'Президент может в указанный срок запросить проверку конституционности; срок подписания приостанавливается. Если конституционность подтверждена, Президент подписывает ФКЗ в течение 3 дней с момента решения. Если не подтверждена — возвращает в Государственную Думу без подписания.']
        ]
    },
    {
        id: 'government', title: 'Как формируется Правительство',
        steps: [
            ['111', 'Президент предлагает Председателя', 'Президент вносит кандидатуру в Государственную Думу. Сроки внесения зависят от основания и указаны в части 2 статьи 111.'],
            ['111', 'Дума утверждает кандидатуру', 'Государственная Дума рассматривает её в течение недели. После утверждения Президент назначает Председателя Правительства.'],
            ['112', 'Структура исполнительной власти', 'Председатель не позднее недельного срока после назначения представляет Президенту предложения о структуре федеральных органов исполнительной власти. Исключение указано в части 1 статьи 112.'],
            ['112', 'Заместители и большинство министров', 'Председатель представляет кандидатуры Государственной Думе. Дума принимает решение не позднее недельного срока. Для министров из пункта «д.1» статьи 83 действует отдельный порядок.'],
            ['112', 'Назначение Президентом', 'Утверждённых Думой заместителей Председателя и федеральных министров назначает Президент. Он не вправе отказать в их назначении.']
        ],
        branches: [
            ['83', 'Особый порядок для части министров', 'Президент после консультаций с Советом Федерации назначает министров по направлениям, перечисленным в пункте «д.1» статьи 83: оборона, безопасность, внутренние дела, юстиция, иностранные дела, предотвращение чрезвычайных ситуаций и ликвидация последствий стихийных бедствий, общественная безопасность. Утверждение Думой здесь не требуется.'],
            ['111', 'Три отклонения кандидатур Председателя', 'Президент назначает Председателя Правительства и вправе распустить Думу и назначить новые выборы. Роспуск не является автоматическим; действуют конституционные ограничения статьи 109.'],
            ['112', 'Исключения при назначении остальных членов', 'После трёх отклонений кандидатур заместителей и министров, а также в случаях части 5 статьи 112, возможен порядок без утверждения Думой. Условия назначения и возможного роспуска Думы приведены в частях 4–5 статьи 112.']
        ]
    }
];

function readingAnchor() {
    const top = ($('#lessonToolbar:not([hidden])') || $('.site-header'))?.getBoundingClientRect().bottom || 70;
    const cards = $$('#content .card');
    const card = cards.find(item => item.getBoundingClientRect().bottom > top);
    if (!card) return { scrollY: window.scrollY };
    const elements = [...card.querySelectorAll('.title, .body p, .explain > summary, .explain-body p')];
    const index = elements.findIndex(item => item.getClientRects().length && item.getBoundingClientRect().bottom > top);
    const element = elements[index] || card;
    return { cardId: card.id, index, offset: element.getBoundingClientRect().top, scrollY: window.scrollY };
}

function restoreReadingAnchor(anchor) {
    const card = anchor.cardId && document.getElementById(anchor.cardId);
    const elements = card ? [...card.querySelectorAll('.title, .body p, .explain > summary, .explain-body p')] : [];
    const element = elements[anchor.index] || card;
    const top = element ? window.scrollY + element.getBoundingClientRect().top - anchor.offset : anchor.scrollY;
    window.scrollTo({ top, behavior: 'instant' });
}

function rememberReadingLocation() {
    const scheme = $('#proceduresDialog');
    const articleDialog = $('#articleDialog');
    readingHistory.push({
        anchor: readingAnchor(), ids: $$('#content .card').map(card => card.id),
        query: state.activeSearchQuery, filters: { ...state.studyFilters },
        favorites: state.showFavoritesOnly, folder: state.currentFolderFilter,
        explanations: $$('#content .explain[open]').map(item => item.closest('.card').id),
        notes: $$('#content .note-container:not([hidden])').map(item => item.closest('.card').id),
        hash: location.hash,
        dictionary: $('#dictionaryDialog').open ? { query: $('#dictionarySearch').value, letter: $('#dictionaryAlphabet .active')?.dataset.letter || 'all', scrollTop: $('#dictionaryList').scrollTop } : null,
        scheme: scheme.open ? { id: $('#procedureSelect').value, scrollTop: scheme.querySelector('.procedures-body').scrollTop, openBranches: $$('#procedureContent details').map(details => details.open) } : null,
        articleDialog: articleDialog.open ? { title: $('#dialogTitle').textContent, html: $('#dialogBody').innerHTML, scrollTop: articleDialog.scrollTop } : null
    });
    if (readingHistory.length > READING_HISTORY_LIMIT) readingHistory.shift();
    updateReadingReturnButton();
}

function updateReadingReturnButton() {
    const last = readingHistory.at(-1);
    const button = $('#btn-return');
    if (!last) { hideReturnButton(); return; }
    const article = state.articles.find(item => item.id === last.anchor.cardId);
    button.textContent = last.dictionary ? '↩ Назад к словарю' : last.scheme ? '↩ Назад к схеме' : `↩ Назад к чтению${article ? ` · ${article.title}` : ''}`;
    button.setAttribute('aria-label', button.textContent.slice(2));
    showReturnButton();
}

function navigateReadingArticle(id, remember = true) {
    if (!state.articles.some(article => article.id === id)) return;
    if (remember) rememberReadingLocation();
    $('#proceduresDialog').close();
    $('#articleDialog').close();
    $('#dictionaryDialog').close();
    closeMobileExtras();
    let target = document.getElementById(id);
    if (!target) {
        state.activeSearchQuery = '';
        state.showFavoritesOnly = false;
        state.currentFolderFilter = 'all';
        state.studyFilters = { chapter: 'all', exam: 'all', status: 'all' };
        syncReadingControls();
        renderArticles();
        $$('#content .card').forEach(card => card.classList.add('reading-stable'));
        target = document.getElementById(id);
    }
    history.replaceState(null, '', `#${id}`);
    scrollArticleToTop(target, 'auto');
    if (target) {
        target.classList.add('reading-target');
        setTimeout(() => target.classList.remove('reading-target'), 1000);
    }
}

function syncReadingControls() {
    ['searchInput', 'mobileSearchInput'].forEach(id => { const input = $(`#${id}`); if (input) input.value = state.activeSearchQuery; });
    [['chapterFilter', 'chapter'], ['examFilter', 'exam'], ['statusFilter', 'status']].forEach(([id, key]) => { $(`#${id}`).value = state.studyFilters[key]; });
    $('#favFilterBtn').setAttribute('aria-pressed', String(state.showFavoritesOnly));
    document.body.classList.toggle('search-active', Boolean(state.activeSearchQuery));
    updateMobileSearchBanner(state.activeSearchQuery);
}

function restoreReadingLocation() {
    const previous = readingHistory.pop();
    if (!previous) return;
    state.activeSearchQuery = previous.query;
    state.studyFilters = previous.filters;
    state.showFavoritesOnly = previous.favorites;
    state.currentFolderFilter = previous.folder;
    syncReadingControls();
    const byId = new Map(state.articles.map(article => [article.id, article]));
    renderArticles(previous.ids.map(id => byId.get(id)).filter(Boolean));
    $$('#content .card').forEach(card => card.classList.add('reading-stable'));
    $$('#content .explain').forEach(details => { details.open = previous.explanations.includes(details.closest('.card').id); });
    previous.notes.forEach(id => { const note = document.getElementById(id)?.querySelector('.note-container'); if (note) note.hidden = false; });
    history.replaceState(null, '', previous.hash || location.pathname + location.search);
    restoreReadingAnchor(previous.anchor);
    if (previous.dictionary) {
        $('#dictionaryDialog').showModal();
        $('#dictionaryDialog').dispatchEvent(new CustomEvent('restore-view', { detail: previous.dictionary }));
    } else if (previous.scheme) {
        $('#procedureSelect').value = previous.scheme.id;
        renderProcedureScheme();
        $$('#procedureContent details').forEach((details, index) => { details.open = previous.scheme.openBranches[index]; });
        $('#proceduresDialog').showModal();
        $('#proceduresDialog .procedures-body').scrollTop = previous.scheme.scrollTop;
    } else if (previous.articleDialog) {
        $('#dialogTitle').textContent = previous.articleDialog.title;
        $('#dialogBody').innerHTML = previous.articleDialog.html;
        initDynamicEvents($('#dialogBody'));
        $('#articleDialog').showModal();
        $('#articleDialog').scrollTop = previous.articleDialog.scrollTop;
    }
    updateReadingReturnButton();
}

function renderProcedureScheme() {
    const scheme = PROCEDURE_SCHEMES.find(item => item.id === $('#procedureSelect').value) || PROCEDURE_SCHEMES[0];
    const stepMarkup = ([article, title, description], index) => `<li><button type="button" class="procedure-step" data-article="art${article}"><span class="procedure-step-number">${index + 1}</span><span><strong>${escapeHTML(title)}</strong><span>${escapeHTML(description)}</span><small>Открыть статью ${article} →</small></span></button></li>`;
    $('#procedureContent').innerHTML = `<h2>${escapeHTML(scheme.title)}</h2><ol class="procedure-flow">${scheme.steps.map(stepMarkup).join('')}</ol><h3>Развилки и особенности</h3><div class="procedure-branches">${scheme.branches.map(([article, title, text]) => `<details><summary>${escapeHTML(title)}</summary><p>${escapeHTML(text)}</p><button type="button" class="btn" data-article="art${article}">Статья ${article} →</button></details>`).join('')}</div>`;
}

function openProcedureScheme(id) {
    closeMobileExtras();
    if (PROCEDURE_SCHEMES.some(scheme => scheme.id === id)) $('#procedureSelect').value = id;
    renderProcedureScheme();
    $('#proceduresDialog').showModal();
}

function addProcedureShortcut(card) {
    const choices = { art104: 'federal-law', art105: 'federal-law', art107: 'federal-law', art108: 'constitutional-law', art111: 'government', art112: 'government' };
    const scheme = PROCEDURE_SCHEMES.find(item => item.id === choices[card.id]);
    if (!scheme) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn procedure-shortcut';
    button.textContent = `🔀 Схема: ${scheme.title.toLocaleLowerCase('ru')}`;
    button.addEventListener('click', () => openProcedureScheme(scheme.id));
    card.querySelector('.body').after(button);
}

let lessonExplanationState = new Map();
const lessonPointer = { enabled: false, overlay: null, owner: null, touchTimer: null };

function hideLessonPointer() {
    const overlay = lessonPointer.overlay;
    if (!overlay) return;
    if (overlay.matches(':popover-open')) overlay.hidePopover();
    overlay.hidden = true;
}

function setLessonPointer(enabled) {
    lessonPointer.enabled = enabled && isLessonMode();
    $$('.lesson-pointer-toggle').forEach(button => button.setAttribute('aria-pressed', String(lessonPointer.enabled)));
    if (!lessonPointer.enabled) hideLessonPointer();
}

function initLessonPointer() {
    const overlay = document.createElement('div');
    overlay.className = 'lesson-pointer';
    overlay.setAttribute('popover', 'manual');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.append(overlay);
    lessonPointer.overlay = overlay;
    $$('.lesson-pointer-toggle').forEach(button => button.addEventListener('click', () => setLessonPointer(!lessonPointer.enabled)));
    const move = event => {
        if (!lessonPointer.enabled || !isLessonMode()) return;
        clearTimeout(lessonPointer.touchTimer);
        const owner = event.target.closest('dialog');
        if (owner !== lessonPointer.owner) { hideLessonPointer(); lessonPointer.owner = owner; }
        overlay.hidden = false;
        overlay.style.left = `${event.clientX - 11}px`;
        overlay.style.top = `${event.clientY - 11}px`;
        if (!overlay.matches(':popover-open')) overlay.showPopover();
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', move, { passive: true });
    const moveTouch = event => {
        const touch = event.touches[0];
        if (touch) move({ target: event.target, clientX: touch.clientX, clientY: touch.clientY });
    };
    document.addEventListener('touchstart', moveTouch, { passive: true });
    document.addEventListener('touchmove', moveTouch, { passive: true });
    document.addEventListener('touchend', () => {
        clearTimeout(lessonPointer.touchTimer);
        lessonPointer.touchTimer = setTimeout(hideLessonPointer, 700);
    }, { passive: true });
    document.addEventListener('pointerup', event => {
        if (event.pointerType !== 'mouse') lessonPointer.touchTimer = setTimeout(hideLessonPointer, 700);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse' && (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= innerWidth || event.clientY >= innerHeight)) hideLessonPointer();
    });
    window.addEventListener('blur', hideLessonPointer);
}
function applyLessonArticleSettings() {
    if (!document.body.classList.contains('lesson-mode')) return;
    $$('#content .explain').forEach(details => { details.open = $('#lessonExplanations').checked; });
}
function setLessonAnswers(show) {
    document.body.classList.toggle('lesson-answers-visible', show);
    $$('.lesson-answer-toggle').forEach(button => { button.textContent = show ? 'Скрыть ответы' : 'Показать ответы'; button.setAttribute('aria-pressed', String(show)); });
}

function setLessonMode(enabled) {
    const anchor = readingAnchor();
    if (enabled) {
        Object.keys(lessonTrainingSessions).forEach(key => delete lessonTrainingSessions[key]);
        lessonExplanationState = new Map($$('#content .explain').map(details => [details.closest('.card').id, details.open]));
        closeMobileExtras();
        $('#lessonExplanations').checked = false;
        document.body.classList.remove('lesson-explanations');
        $$('#content .explain').forEach(details => { details.open = false; });
        const select = $('#lessonArticleSelect');
        select.innerHTML = state.articles.map(article => `<option value="${escapeHTML(article.id)}">${escapeHTML(article.title)}</option>`).join('');
        select.value = anchor.cardId || state.articles[0]?.id || '';
    } else {
        $$('#content .explain').forEach(details => { details.open = lessonExplanationState.get(details.closest('.card').id) || false; });
    }
    document.body.classList.toggle('lesson-mode', enabled);
    setLessonPointer(false);
    $('#lessonToolbar').hidden = !enabled;
    setLessonAnswers(false);
    requestAnimationFrame(() => {
        if (enabled && anchor.cardId) scrollArticleToTop(document.getElementById(anchor.cardId), 'auto');
        else restoreReadingAnchor(anchor);
        if (enabled) $('#exitLessonMode').focus({ preventScroll: true });
        else $('#lessonModeBtn').focus({ preventScroll: true });
    });
}

function initLessonTools() {
    safeAddListener('#lessonModeBtn', 'click', () => setLessonMode(true));
    safeAddListener('#exitLessonMode', 'click', () => setLessonMode(false));
    safeAddListener('#mobileLessonMode', 'click', () => setLessonMode(true));
    safeAddListener('#lessonArticleSelect', 'change', event => navigateReadingArticle(event.target.value));
    safeAddListener('#lessonToolSelect', 'change', event => { if (event.target.value) $(`#${event.target.value}`).click(); event.target.value = ''; });
    safeAddListener('#lessonExplanations', 'change', event => {
        const anchor = readingAnchor();
        document.body.classList.toggle('lesson-explanations', event.target.checked);
        $$('#content .explain').forEach(details => { details.open = event.target.checked; });
        restoreReadingAnchor(anchor);
    });
    safeAddListener('#proceduresBtn', 'click', () => openProcedureScheme());
    safeAddListener('#mobileProcedures', 'click', () => openProcedureScheme());
    safeAddListener('#closeProcedures', 'click', () => $('#proceduresDialog').close());
    safeAddListener('#procedureSelect', 'change', () => { renderProcedureScheme(); $('#proceduresDialog .procedures-body').scrollTop = 0; });
    safeAddListener('#procedureContent', 'click', event => {
        const button = event.target.closest('[data-article]');
        if (button) navigateReadingArticle(button.dataset.article);
    });
    ['gameDialog', 'game23Dialog', 'mixedTrainingDialog', 'findErrorDialog'].forEach(id => {
        const dialog = $(`#${id}`);
        const row = document.createElement('div');
        row.className = 'lesson-dialog-controls';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn lesson-answer-toggle';
        button.addEventListener('click', () => {
            const show = !document.body.classList.contains('lesson-answers-visible');
            if (show) {
                if (id === 'game23Dialog' && !officialExamState.shown23) showOfficial23Model(true);
                if (id === 'gameDialog' && !officialExamState.checked13) {
                    const task = OFFICIAL_TASKS_13[officialExamState.task13];
                    $('#gameFeedback').textContent = `Верный ответ: ${task.answer}.`;
                }
                if (id === 'mixedTrainingDialog' && !mixedTraining.answered) {
                    const task = mixedTraining.questions[mixedTraining.index];
                    if (task) $('#mixedFeedback').textContent = `Правильный ответ: ${task.correct}`;
                }
                if (id === 'findErrorDialog' && !findErrorState.answered) {
                    const task = findErrorState.tasks[findErrorState.index];
                    if (task) $('#findErrorFeedback').textContent = task.explanation;
                }
            }
            setLessonAnswers(show);
        });
        const pointerButton = document.createElement('button');
        pointerButton.type = 'button'; pointerButton.className = 'btn lesson-pointer-toggle';
        pointerButton.textContent = 'Указка'; pointerButton.setAttribute('aria-pressed', 'false');
        row.append(button, pointerButton);
        dialog.querySelector('.game-header, .dialog-header').after(row);
    });
    ['proceduresDialog', 'flashcardsDialog'].forEach(id => {
        const row = document.createElement('div');
        row.className = 'lesson-dialog-controls';
        row.innerHTML = '<button type="button" class="btn lesson-pointer-toggle" aria-pressed="false">Указка</button>';
        $(`#${id} .game-header, #${id} .dialog-header`).after(row);
    });
    initLessonPointer();
    setLessonAnswers(false);
    document.addEventListener('click', event => {
        if (event.target.closest('#nextGameQuestionBtn, #nextTask23Btn, #mixedNext, #findErrorNext, #gameBtn, #game23Btn, #mixedTrainingBtn, #findErrorBtn, #resetGame23, #resetPowerGameSession')) setLessonAnswers(false);
    }, true);
}
