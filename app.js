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
    teacherMode: false,
    markersMode: false,
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
    activeSearchQuery: '',
    speech: null,
    audio: {
        currentArticleId: null,
        isPlaying: false,
        rate: 1.0,
        utterance: null
    },
    // Map State
    mapZoom: 1,
    mapPan: { x: 0, y: 0 }
};

const LS = {
    THEME: 'ic-theme',
    TEACHER: 'ic-teacher-mode',
    MARKERS: 'ic-markers-mode',
    FAVORITES: 'ic-favorites',
    FAV_FOLDERS: 'ic-fav-folders-list',
    ARTICLE_FOLDERS: 'ic-article-folders-map',
    NOTES: 'ic-user-notes',
    FONT: 'ic-font-settings',
    FONT_TYPE: 'ic-font-type',
    HIGHSCORE: 'ic-game-highscore',
    SEARCH: 'ic-search-history',
    PROGRESS: 'ic-chapter-progress',
    CACHE_CHAPTERS: 'ic-chapters-cache'
};

const DICTIONARY = {
    "суверенитет": "Независимость государства во внешних делах и верховенство государственной власти во внутренних делах.",
    "демократическое": "Государство, в котором источником власти является народ, а управление осуществляется через выборы.",
    "федеративное": "Форма устройства, при которой государство состоит из самостоятельных субъектов (республик, краев), имеющих свои полномочия.",
    "правовое государство": "Государство, где закон превыше всего, и ему подчиняются все, включая саму власть.",
    "республиканская": "Форма правления, при которой высшие органы власти избираются на определенный срок.",
    "светское государство": "Государство, в котором никакая религия не может быть обязательной, а церковь отделена от государства.",
    "социальное государство": "Государство, политика которого направлена на обеспечение достойной жизни граждан (пенсии, пособия, МРОТ).",
    "презумпция невиновности": "Принцип, согласно которому человек считается невиновным, пока его вина не доказана судом.",
    "референдум": "Всенародное голосование граждан по наиболее важным вопросам государственного значения.",
    "импичмент": "Процедура отрешения Президента от должности парламентом в случае совершения им тяжкого преступления.",
    "амнистия": "Освобождение от наказания неопределенного круга лиц (объявляется Госдумой).",
    "помилование": "Освобождение от наказания конкретного лица (осуществляется Президентом).",
    "экстрадиция": "Выдача преступника другому государству для суда или отбывания наказания."
};

const MARKERS = {
    federal: ['регулирование', 'федеральный', 'федеральные', 'основы', 'судоустройство', 'прокуратура', 'амнистия', 'помилование', 'оборона', 'безопасность', 'валютное', 'кредитное', 'таможенное', 'денежная эмиссия', 'стандарты', 'метрологическая', 'геодезия', 'картография', 'государственные награды'],
    joint: ['совместном', 'обеспечение', 'защита', 'координация', 'охрана', 'общие принципы', 'общие вопросы', 'административное', 'трудовое', 'семейное', 'жилищное', 'адвокатура', 'нотариат', 'кадры']
};

/* --- ДАННЫЕ ДЛЯ КАРТЫ --- */
const FEDERAL_DISTRICTS = {
    "reg-cen": {
        title: "Центральный ФО",
        list: "Москва, Московская область, Белгородская область, Брянская область, Владимирская область, Воронежская область, Ивановская область, Калужская область, Костромская область, Курская область, Липецкая область, Орловская область, Рязанская область, Смоленская область, Тамбовская область, Тверская область, Тульская область, Ярославская область"
    },
    "reg-nw": {
        title: "Северо-Западный ФО",
        list: "Санкт-Петербург, Ленинградская область, Архангельская область, Вологодская область, Калининградская область, Мурманская область, Новгородская область, Псковская область, Республика Карелия, Республика Коми, Ненецкий АО"
    },
    "reg-south": {
        title: "Южный ФО",
        list: "Краснодарский край, Астраханская область, Волгоградская область, Ростовская область, Республика Адыгея, Республика Калмыкия, Республика Крым, Севастополь"
    },
    "reg-kav": {
        title: "Северо-Кавказский ФО",
        list: "Ставропольский край, Республика Дагестан, Республика Ингушетия, Кабардино-Балкарская Республика, Карачаево-Черкесская Республика, Северная Осетия — Алания, Чеченская Республика"
    },
    "reg-vol": {
        title: "Приволжский ФО",
        list: "Татарстан, Башкортостан, Чувашия, Пермский край, Нижегородская область, Самарская область, Саратовская область, Ульяновская область, Пензенская область, Оренбургская область, Кировская область, Марий Эл, Мордовия, Удмуртия"
    },
    "reg-ural": {
        title: "Уральский ФО",
        list: "Свердловская область, Челябинская область, Курганская область, Тюменская область, Ханты-Мансийский АО, Ямало-Ненецкий АО"
    },
    "reg-sib": {
        title: "Сибирский ФО",
        list: "Новосибирская область, Омская область, Томская область, Кемеровская область, Иркутская область, Красноярский край, Алтайский край, Республика Алтай, Тыва, Хакасия"
    },
    "reg-fe": {
        title: "Дальневосточный ФО",
        list: "Приморский край, Хабаровский край, Амурская область, Магаданская область, Сахалинская область, Якутия, Бурятия, Забайкальский край, Еврейская АО, Чукотский АО, Камчатский край"
    }
};

/* --- ИГРА №13 --- */
const POWERS = [
    { text: "Объявление амнистии", target: "gd" },
    { text: "Осуществление помилования", target: "president" },
    { text: "Назначение выборов Президента РФ", target: "sf" },
    { text: "Утверждение изменения границ между субъектами РФ", target: "sf" },
    { text: "Разработка федерального бюджета", target: "gov" },
    { text: "Управление федеральной собственностью", target: "gov" },
    { text: "Назначение Председателя Центрального банка", target: "gd" },
    { text: "Решение вопроса о возможности использования ВС РФ за пределами территории", target: "sf" },
    { text: "Обеспечение проведения единой финансовой политики", target: "gov" },
    { text: "Награждение государственными наградами РФ", target: "president" },
    { text: "Введение военного положения", target: "president" },
    { text: "Объявление недоверия Правительству РФ", target: "gd" },
    { text: "Назначение судей Конституционного Суда", target: "sf" },
    { text: "Руководство внешней политикой РФ", target: "president" },
    { text: "Обеспечение поддержки НКО и волонтеров", target: "gov" }
];

const game = { score: 0, currentQuestion: null, isBusy: false };

function initGame() {
    safeAddListener('#gameBtn', 'click', () => {
        const hs = $('#highScore');
        if (hs) hs.textContent = localStorage.getItem(LS.HIGHSCORE) || 0;
        const start = $('#gameStartScreen');
        const play = $('#gamePlayScreen');
        if (start) start.hidden = false;
        if (play) play.hidden = true;
        const dlg = $('#gameDialog');
        if (dlg) dlg.showModal();
    });

    safeAddListener('#closeGame', 'click', () => $('#gameDialog').close());
    safeAddListener('#startGameBtn', 'click', () => {
        game.score = 0;
        updateGameScore();
        $('#gameStartScreen').hidden = true;
        $('#gamePlayScreen').hidden = false;
        nextQuestion();
    });

    $$('.ans-btn').forEach(btn => btn.addEventListener('click', (e) => checkAnswer(e.target)));
}

function nextQuestion() {
    game.isBusy = false;
    const randomIndex = Math.floor(Math.random() * POWERS.length);
    game.currentQuestion = POWERS[randomIndex];
    const qText = $('#questionText');
    if (qText) {
        qText.style.opacity = 0;
        setTimeout(() => { qText.textContent = game.currentQuestion.text; qText.style.opacity = 1; }, 200);
    }
    $$('.ans-btn').forEach(btn => btn.className = 'ans-btn');
    const fb = $('#gameFeedback');
    if (fb) fb.textContent = "";
}

function checkAnswer(btn) {
    if (game.isBusy) return;
    game.isBusy = true;
    const target = btn.dataset.target;
    const isCorrect = target === game.currentQuestion.target;
    const fb = $('#gameFeedback');

    if (isCorrect) {
        btn.classList.add('correct');
        game.score++;
        if (fb) { fb.textContent = "Верно! 🎉"; fb.style.color = "#22c55e"; }
    } else {
        btn.classList.add('wrong');
        const correctBtn = $(`.ans-btn[data-target="${game.currentQuestion.target}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
        if (fb) { fb.textContent = "Ошибка 😔"; fb.style.color = "#ef4444"; }
    }
    updateGameScore();
    const currentHigh = parseInt(localStorage.getItem(LS.HIGHSCORE) || 0);
    if (game.score > currentHigh) localStorage.setItem(LS.HIGHSCORE, game.score);
    setTimeout(nextQuestion, 1500);
}

function updateGameScore() {
    const sc = $('#currentScore');
    if (sc) sc.textContent = game.score;
}

/* --- ЗАДАНИЕ №23 --- */
const TASKS_23 = [
    {
        question: "РФ — социальное государство",
        options: [
            { id: 1, text: "Охрана труда и здоровья людей", correct: true },
            { id: 2, text: "Установление гарантированного МРОТ", correct: true },
            { id: 3, text: "Разделение государственной власти на три ветви", correct: false },
            { id: 4, text: "Обеспечение государственной поддержки семьи", correct: true },
            { id: 5, text: "Признание идеологического многообразия", correct: false }
        ]
    },
    {
        question: "РФ — светское государство",
        options: [
            { id: 1, text: "Никакая религия не может устанавливаться в качестве государственной", correct: true },
            { id: 2, text: "Религиозные объединения отделены от государства", correct: true },
            { id: 3, text: "Во взаимоотношениях с федеральными органами все субъекты равноправны", correct: false },
            { id: 4, text: "Гарантия свободы совести и вероисповедания", correct: true },
            { id: 5, text: "Земля и другие природные ресурсы используются как основа жизни", correct: false }
        ]
    },
    {
        question: "РФ — республиканская форма правления",
        options: [
            { id: 1, text: "Глава государства (Президент) избирается сроком на 6 лет", correct: true },
            { id: 2, text: "Государственная Дума избирается сроком на 5 лет", correct: true },
            { id: 3, text: "Единственным источником власти является многонациональный народ", correct: false },
            { id: 4, text: "Высшим непосредственным выражением власти народа являются выборы", correct: true },
            { id: 5, text: "Осуществление правосудия только судом", correct: false }
        ]
    }
];

const game23 = { currentTaskIndex: 0, selectedIds: new Set() };

function initGame23() {
    safeAddListener('#game23Btn', 'click', () => {
        game23.currentTaskIndex = 0;
        renderTask23();
        $('#game23Dialog').showModal();
    });
    safeAddListener('#closeGame23', 'click', () => $('#game23Dialog').close());

    safeAddListener('#checkTask23Btn', 'click', checkTask23);
    safeAddListener('#nextTask23Btn', 'click', () => {
        game23.currentTaskIndex = (game23.currentTaskIndex + 1) % TASKS_23.length;
        renderTask23();
    });
}

function renderTask23() {
    const task = TASKS_23[game23.currentTaskIndex];
    game23.selectedIds.clear();

    $('#task23Question').textContent = task.question;
    const container = $('#task23Options');
    container.innerHTML = '';
    const shuffled = [...task.options].sort(() => Math.random() - 0.5);

    shuffled.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'task23-option';
        div.textContent = opt.text;
        div.dataset.id = opt.id;
        div.addEventListener('click', () => toggleOption23(div, opt.id));
        container.appendChild(div);
    });

    $('#checkTask23Btn').disabled = true;
    $('#checkTask23Btn').style.display = 'inline-block';
    $('#nextTask23Btn').style.display = 'none';
    $('#task23Feedback').textContent = '';
}

function toggleOption23(el, id) {
    if ($('#nextTask23Btn').style.display === 'inline-block') return;

    if (game23.selectedIds.has(id)) {
        game23.selectedIds.delete(id);
        el.classList.remove('selected');
    } else {
        if (game23.selectedIds.size < 3) {
            game23.selectedIds.add(id);
            el.classList.add('selected');
        }
    }
    $('#checkTask23Btn').disabled = game23.selectedIds.size !== 3;
}

function checkTask23() {
    const task = TASKS_23[game23.currentTaskIndex];
    const correctIds = new Set(task.options.filter(o => o.correct).map(o => o.id));
    let errors = 0;

    $$('.task23-option').forEach(el => {
        const id = parseInt(el.dataset.id);
        const isSelected = game23.selectedIds.has(id);
        const isCorrect = correctIds.has(id);

        if (isSelected && isCorrect) {
            el.classList.add('correct');
        } else if (isSelected && !isCorrect) {
            el.classList.add('wrong');
            errors++;
        } else if (!isSelected && isCorrect) {
            el.style.border = "2px dashed #22c55e";
        }
    });

    const fb = $('#task23Feedback');
    if (errors === 0 && game23.selectedIds.size === 3) {
        fb.textContent = "Отлично! Все верно. +3 балла";
        fb.style.color = "#22c55e";
    } else {
        fb.textContent = `Ошибок: ${errors}. Попробуйте запомнить верные положения.`;
        fb.style.color = "#ef4444";
    }

    $('#checkTask23Btn').style.display = 'none';
    $('#nextTask23Btn').style.display = 'inline-block';
}

/* --- FLASHCARDS --- */
const flashcards = {
    terms: [],
    index: 0
};

function initFlashcards() {
    safeAddListener('#flashcardsBtn', 'click', () => {
        flashcards.terms = Object.keys(DICTIONARY).sort(() => Math.random() - 0.5);
        flashcards.index = 0;
        renderFlashcard();
        $('#flashcardsDialog').showModal();
    });

    safeAddListener('#closeFlashcards', 'click', () => $('#flashcardsDialog').close());
    
    safeAddListener('#fcNext', 'click', () => {
        if (flashcards.index < flashcards.terms.length - 1) {
            $('#flashcard').classList.remove('flipped');
            setTimeout(() => {
                flashcards.index++;
                renderFlashcard();
            }, 300);
        }
    });

    safeAddListener('#fcPrev', 'click', () => {
        if (flashcards.index > 0) {
            $('#flashcard').classList.remove('flipped');
            setTimeout(() => {
                flashcards.index--;
                renderFlashcard();
            }, 300);
        }
    });

    safeAddListener('#flashcard', 'click', () => {
        $('#flashcard').classList.toggle('flipped');
    });
}

function renderFlashcard() {
    if (flashcards.terms.length === 0) return;
    const term = flashcards.terms[flashcards.index];
    
    $('#fcTerm').textContent = term.charAt(0).toUpperCase() + term.slice(1);
    $('#fcDef').textContent = DICTIONARY[term];
    $('#fcCounter').textContent = `${flashcards.index + 1} / ${flashcards.terms.length}`;

    $('#fcPrev').disabled = flashcards.index === 0;
    $('#fcNext').disabled = flashcards.index === flashcards.terms.length - 1;
}

/* --- ШРИФТЫ --- */
function initFontSettings() {
    const saved = JSON.parse(localStorage.getItem(LS.FONT));
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
        if (dlg) dlg.open ? dlg.close() : dlg.show();
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
}

/* --- ТАЙМЕР --- */
function initTimer() {
    const timerEl = $('#egeTimer');
    if (!timerEl) return;
    const examDate = new Date('2026-06-11T09:00:00');

    function update() {
        const now = new Date();
        const diff = examDate - now;
        if (diff <= 0) { timerEl.innerHTML = "ЕГЭ уже идет!"; return; }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        let txt = 'дней';
        const lastDigit = days % 10;
        const lastTwo = days % 100;
        if (lastDigit === 1 && lastTwo !== 11) txt = 'день';
        else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwo)) txt = 'дня';
        timerEl.innerHTML = `До ЕГЭ по обществознанию:<br><span>${days} ${txt}</span>`;
    }
    update();
    setInterval(update, 1000 * 60 * 60);
}

/* --- ПОИСК --- */
function initSearchHistory() {
    const stored = localStorage.getItem(LS.SEARCH);
    if (stored) state.searchHistory = JSON.parse(stored);

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
    if (!query || query.length < 2) return;
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

function filterArticles(query) {
    query = query.trim().toLowerCase(); 
    state.activeSearchQuery = query;

    if (!query) { renderArticles(state.articles); return; }

    const sourceList = state.showFavoritesOnly ? state.articles.filter(a => state.favorites.has(a.id)) : state.articles;
    
    // Fuzzy Filter Logic
    const filtered = sourceList.filter(a => {
        const t = a.title.toLowerCase();
        const body = a.bodyHTML.replace(/<[^>]+>/g, ' ').toLowerCase();
        
        if (t.includes(query) || body.includes(query)) return true;

        if (query.length > 3) {
            const titleWords = t.split(/\s+/);
            const bodyWords = body.split(/\s+/).slice(0, 100); 
            
            const matchWord = (word) => {
                if (Math.abs(word.length - query.length) > 2) return false;
                const dist = levenshtein(word, query);
                return dist <= 2;
            };

            return titleWords.some(matchWord) || bodyWords.some(matchWord);
        }
        return false;
    });

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

    for (let term in DICTIONARY) {
        const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeTerm}[а-я]*)`, 'gi');
        text = text.replace(regex, (match) => {
            if (match.includes('<') || match.includes('>')) return match;
            return `<span class="term" data-term="${term}">${match}</span>`;
        });
    }

    if (state.markersMode) {
        const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        MARKERS.federal.forEach(word => {
            const regex = new RegExp(`(${escapeReg(word)})`, 'gi');
            text = text.replace(regex, '<span class="mark-fed">$1</span>');
        });
        MARKERS.joint.forEach(word => {
            const regex = new RegExp(`(${escapeReg(word)})`, 'gi');
            text = text.replace(regex, '<span class="mark-joint">$1</span>');
        });
    }
    return text;
}

/* --- FAV FOLDERS LOGIC --- */
function loadFavorites() {
    const stored = localStorage.getItem(LS.FAVORITES);
    if (stored) { state.favorites = new Set(JSON.parse(stored)); }
    
    const storedFolders = localStorage.getItem(LS.FAV_FOLDERS);
    if (storedFolders) { state.favFolders = JSON.parse(storedFolders); }

    const storedMap = localStorage.getItem(LS.ARTICLE_FOLDERS);
    if (storedMap) { state.articleFolders = JSON.parse(storedMap); }

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
    const folderUI = $('#favFoldersContainer');
    
    if (state.showFavoritesOnly) {
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = `⭐ Скрыть избранное <span class="badge">${state.favorites.size}</span>`;
        folderUI.hidden = false;
        renderFolderSelect();
    } else {
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `⭐ Избранное <span class="badge">${state.favorites.size}</span>`;
        folderUI.hidden = true;
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
    if (stored) state.notes = JSON.parse(stored);
}

function saveNote(id, text) {
    if (!text.trim()) delete state.notes[id];
    else state.notes[id] = text;
    localStorage.setItem(LS.NOTES, JSON.stringify(state.notes));
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
        const li = document.createElement('li');
        li.className = 'toc-chapter';
        const header = document.createElement('div');
        header.className = 'toc-chapter-header';
        header.innerHTML = `<span>${chTitle}</span><span class="toc-toggle-icon">▼</span>`;
        header.addEventListener('click', () => { li.classList.toggle('open'); });

        const subUl = document.createElement('ul');
        subUl.className = 'toc-articles';
        chapters[chTitle].forEach(art => {
            const subLi = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = art.title;
            a.addEventListener('click', e => {
                e.preventDefault();
                if (state.showFavoritesOnly) setFavFilterMode();
                const el = document.getElementById(art.id);
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
        li.append(subUl);
        ul.append(li);
    });
}

function renderArticles(list = state.articles) {
    const container = $('#content');
    if (!container) return;
    container.innerHTML = '';

    let displayList = list;
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

    if (displayList.length === 0 && state.activeSearchQuery) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted)">Ничего не найдено.</div>';
        return;
    }

    const template = $('#articleCardTmpl');

    displayList.forEach(a => {
        const node = template.content.cloneNode(true);
        const card = $('.card', node);
        card.dataset.articleId = a.id;
        card.id = a.id;

        // FOLDER UI
        const folderSelector = $('.fav-folder-selector', node);
        const cardFolderSelect = $('.card-folder-select', node);
        if (state.favorites.has(a.id)) {
            folderSelector.hidden = false;
            // Populate options
            cardFolderSelect.innerHTML = '';
            state.favFolders.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                if (state.articleFolders[a.id] === f) opt.selected = true;
                cardFolderSelect.appendChild(opt);
            });
            // Change listener
            cardFolderSelect.addEventListener('change', (e) => {
                state.articleFolders[a.id] = e.target.value;
                saveFolders();
                if (state.showFavoritesOnly) renderArticles(); // re-render to apply filter
            });
        } else {
            folderSelector.hidden = true;
        }

        const crumbs = $('.breadcrumbs', node);
        const chShort = a.chapterTitle.split('.')[0] || a.chapterTitle;
        crumbs.textContent = `${chShort.trim()} > ${a.title}`;

        $('.title', node).textContent = a.title;

        let processedBody = processText(a.bodyHTML);
        if (state.activeSearchQuery && state.activeSearchQuery.length > 2) {
             const escaped = state.activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             const re = new RegExp(`(${escaped})`, 'gi');
             processedBody = processedBody.replace(re, '<mark>$1</mark>');
        }
        $('.body', node).innerHTML = processedBody;

        const explain = $('.explain', node);
        let processedExplain = a.explainHTML ? processText(a.explainHTML) : '';
        let foundInExplain = false;

        if (a.explainHTML) {
             if (state.activeSearchQuery && state.activeSearchQuery.length > 2) {
                const escaped = state.activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(`(${escaped})`, 'gi');
                if (re.test(processedExplain)) foundInExplain = true;
                processedExplain = processedExplain.replace(re, '<mark>$1</mark>');
            }
            $('.explain-body', node).innerHTML = processedExplain;

            if (foundInExplain) { explain.hidden = false; explain.open = true; }
            else { explain.hidden = !state.teacherMode; explain.open = false; }
        } else { explain.hidden = true; }

        const favBtn = $('.btn-fav', node);
        const isFav = state.favorites.has(a.id);
        favBtn.textContent = isFav ? '★' : '☆';
        if (isFav) favBtn.classList.add('active');
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(a.id); });

        const audioBtn = $('.btn-audio', node);
        audioBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            playArticle(a.id);
        });

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
            navigator.clipboard.writeText(window.location.href).then(showToast);
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

        if (a.title.includes('Статья 65')) {
            const mapBtn = document.createElement('button');
            mapBtn.className = 'btn btn-primary';
            mapBtn.style.marginTop = '10px';
            mapBtn.innerHTML = '🗺️ Открыть карту РФ';
            mapBtn.onclick = () => $('#mapDialog').showModal();
            $('.body', node).appendChild(mapBtn);
        }

        container.append(node);
    });

    initDynamicEvents(container);
}

function openShareDialog(title, text) {
    const dlg = $('#shareDialog');
    const canvas = $('#shareCanvas');
    if (!dlg || !canvas) return;

    generateQuoteImage(canvas, title, text);
    dlg.showModal();

    safeAddListener('#closeShare', 'click', () => dlg.close());
    
    $('#downloadImgBtn').onclick = () => {
        const link = document.createElement('a');
        link.download = `constitution-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    $('#shareNativeBtn').onclick = () => {
        canvas.toBlob(blob => {
            const file = new File([blob], "quote.png", { type: "image/png" });
            if (navigator.share) {
                navigator.share({
                    files: [file],
                    title: 'Цитата из Конституции',
                    text: `${title}\n${text.substring(0, 50)}...`
                }).catch(console.error);
            } else {
                showToast("Ваш браузер не поддерживает отправку картинок");
            }
        });
    };
}

function generateQuoteImage(canvas, title, text) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#12141a');
    grad.addColorStop(1, '#1e2330');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    ctx.fillStyle = '#6ea8fe';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 200);

    ctx.fillStyle = '#e8ebf0';
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center'; 
    
    wrapText(ctx, text, w / 2, 350, w - 200, 80);

    ctx.fillStyle = '#9aa3af';
    ctx.font = 'italic 40px sans-serif';
    ctx.fillText('PrepMate — Интерактивная Конституция', w / 2, h - 100);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    
    if (words.length > 80) text = words.slice(0, 80).join(' ') + '...';

    for(let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

function initDynamicEvents(container) {
    const tooltip = $('#tooltip');
    container.querySelectorAll('.term').forEach(term => {
        term.addEventListener('mouseenter', (e) => {
            const def = DICTIONARY[term.dataset.term];
            if (def && tooltip) {
                tooltip.innerHTML = `<b>${term.dataset.term}</b>${def}`;
                tooltip.classList.add('show');
                moveTooltip(e);
            }
        });
        term.addEventListener('mousemove', (e) => { if (tooltip) moveTooltip(e); });
        term.addEventListener('mouseleave', () => { if (tooltip) tooltip.classList.remove('show'); });
    });
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
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function initDictionary() {
    safeAddListener('#dictionaryBtn', 'click', () => {
        const dlg = $('#dictionaryDialog'); if (!dlg) return;
        const list = $('#dictionaryList');
        if (list && list.innerHTML === '') {
            Object.keys(DICTIONARY).sort().forEach(term => {
                const div = document.createElement('div');
                div.className = 'dict-item';
                div.innerHTML = `<span class="dict-term">${term.charAt(0).toUpperCase() + term.slice(1)}</span><span class="dict-def">${DICTIONARY[term]}</span>`;
                list.appendChild(div);
            });
        }
        dlg.showModal();
    });
    safeAddListener('#closeDictionary', 'click', () => $('#dictionaryDialog').close());
}

function initAudioPlayer() {
    const player = $('#audioPlayer');
    const playBtn = $('#playerPlayPause');
    const rateBtn = $('#playerRate');
    const bar = $('#playerBar');

    if (!player) return;

    safeAddListener('#playerPlayPause', 'click', () => {
        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                playBtn.textContent = '⏸';
            } else {
                window.speechSynthesis.pause();
                playBtn.textContent = '▶';
            }
        } else if (state.audio.currentArticleId) {
            playArticle(state.audio.currentArticleId);
        }
    });

    safeAddListener('#playerClose', 'click', () => {
        window.speechSynthesis.cancel();
        player.hidden = true;
    });

    safeAddListener('#playerRate', 'click', () => {
        const rates = [1.0, 1.5, 2.0];
        let idx = rates.indexOf(state.audio.rate);
        state.audio.rate = rates[(idx + 1) % rates.length];
        rateBtn.textContent = `x${state.audio.rate}`;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            playArticle(state.audio.currentArticleId);
        }
    });

    safeAddListener('#playerNext', 'click', playNextArticle);
    safeAddListener('#playerPrev', 'click', playPrevArticle);

    setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            const w = parseFloat(bar.style.width) || 0;
            bar.style.width = ((w + 1) % 100) + '%';
        }
    }, 100);
}

function playArticle(id) {
    const article = state.articles.find(a => a.id === id);
    if (!article) return;

    window.speechSynthesis.cancel();
    state.audio.currentArticleId = id;
    
    const text = article.bodyHTML.replace(/<[^>]+>/g, ' ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = state.audio.rate;

    utterance.onstart = () => {
        $('#audioPlayer').hidden = false;
        $('#playerTitle').textContent = article.title;
        $('#playerPlayPause').textContent = '⏸';
        state.audio.isPlaying = true;
    };

    utterance.onend = () => {
        $('#playerPlayPause').textContent = '▶';
        state.audio.isPlaying = false;
        playNextArticle();
    };

    window.speechSynthesis.speak(utterance);
}

function playNextArticle() {
    if (!state.audio.currentArticleId) return;
    const idx = state.articles.findIndex(a => a.id === state.audio.currentArticleId);
    if (idx !== -1 && idx < state.articles.length - 1) {
        playArticle(state.articles[idx + 1].id);
    }
}

function playPrevArticle() {
    if (!state.audio.currentArticleId) return;
    const idx = state.articles.findIndex(a => a.id === state.audio.currentArticleId);
    if (idx > 0) {
        playArticle(state.articles[idx - 1].id);
    }
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

function initMobileNav() {
    safeAddListener('#navHome', 'click', () => scrollToTop());
    safeAddListener('#navSearch', 'click', () => { $('#searchInput').focus(); scrollToTop(); });
    safeAddListener('#navFav', 'click', () => { setFavFilterMode(); $('#navFav').classList.toggle('active'); });
    safeAddListener('#navMenu', 'click', () => { $('#sidebarPanel').classList.toggle('visible'); });
}

/* --- INIT FOLDERS UI HANDLERS --- */
function initFoldersUI() {
    safeAddListener('#addFolderBtn', 'click', () => {
        const name = prompt("Введите название новой папки:");
        if (name && !state.favFolders.includes(name)) {
            state.favFolders.push(name);
            saveFolders();
            renderFolderSelect();
        }
    });

    const select = $('#folderSelectFilter');
    if (select) {
        select.addEventListener('change', (e) => {
            state.currentFolderFilter = e.target.value;
            renderArticles();
        });
    }
}

/* --- PWA INSTALL (UPDATED: SHOW BUTTON) --- */
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

async function loadChapters() {
    const container = $('#content');
    const cachedData = localStorage.getItem(LS.CACHE_CHAPTERS);
    if (cachedData) {
        try {
            state.articles = JSON.parse(cachedData);
            renderArticles(); buildTOC();
            if (container) container.classList.remove('loading');
        } catch (e) { console.error(e); }
    }

    try {
        const files = [
            'chapters/chapter1.html', 'chapters/chapter2.html', 'chapters/chapter3.html',
            'chapters/chapter4.html', 'chapters/chapter5.html', 'chapters/chapter6.html',
            'chapters/chapter7.html', 'chapters/chapter8.html', 'chapters/chapter9.html'
        ];
        
        const results = await Promise.allSettled(files.map(f => fetch(f).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })));

        let newArticles = [];
        const parser = new DOMParser();

        results.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                const html = res.value;
                const doc = parser.parseFromString(html, 'text/html');
                const chapterTitle = doc.querySelector('h2')?.textContent?.trim() || `Глава ${index + 1}`;
                doc.querySelectorAll('article.interactive-article, article').forEach(artNode => {
                    const id = artNode.id || `article-${index}-${Math.random().toString(36).slice(2, 7)}`;
                    const title = artNode.getAttribute('data-title') || artNode.querySelector('h3')?.textContent?.trim() || 'Статья';
                    const bodyClone = artNode.cloneNode(true);
                    bodyClone.querySelector('h3')?.remove();
                    const explain = artNode.getAttribute('data-comment') || '';
                    newArticles.push({ id, title, bodyHTML: bodyClone.innerHTML, explainHTML: explain, chapterTitle });
                });
            } else {
                console.error(`Ошибка загрузки главы ${index + 1}:`, res.reason);
            }
        });

        if (newArticles.length > 0) {
            state.articles = newArticles;
            try { localStorage.setItem(LS.CACHE_CHAPTERS, JSON.stringify(newArticles)); } catch (e) { }
            renderArticles(); buildTOC(); applyFontSettings();
        } else if (!cachedData) {
            throw new Error("Не удалось загрузить ни одной главы.");
        }
        
        if (container) container.classList.remove('loading');
        updateScrollState();
    } catch (e) {
        if (!state.articles.length && container) {
            container.innerHTML = `<div class="error" style="color:red;padding:20px;border:1px solid red">Ошибка загрузки: ${e.message}. Проверьте соединение.</div>`;
        }
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

function setTeacherMode(isActive) {
    state.teacherMode = isActive; localStorage.setItem(LS.TEACHER, isActive ? '1' : '0');
    const btn = $('#teacherModeBtn'); if (btn) btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    const toggle = $('#toggleExplanations'); if (toggle) toggle.checked = isActive;
    if (!state.activeSearchQuery) { $$('#content details.explain').forEach(d => d.hidden = !isActive); } else { renderArticles(); }
}

function setMarkersMode(isActive) {
    state.markersMode = isActive; localStorage.setItem(LS.MARKERS, isActive ? '1' : '0');
    const btn = $('#markersBtn'); if (btn) btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    renderArticles();
}

function initContextMenu() {
    const menu = $('#contextMenu');
    if (!menu) return;

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#contextMenu') && !e.target.closest('.sheet-btn')) {
            menu.hidden = true;
        }
    });

    document.addEventListener('selectionchange', debounce(() => {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed || !selection.toString().trim()) {
            return;
        }
        const anchor = selection.anchorNode;
        if (!anchor || !anchor.parentElement) return;
        const card = anchor.parentElement.closest('.card');
        
        if (card) {
             menu.hidden = false;
             const text = selection.toString().trim();
             
             $('#ctxCopy').onclick = () => {
                 navigator.clipboard.writeText(text).then(() => showToast('Скопировано!'));
                 menu.hidden = true;
             };

             $('#ctxNote').onclick = () => {
                 const cardId = card.dataset.articleId;
                 const noteArea = card.querySelector('.note-area');
                 const noteContainer = card.querySelector('.note-container');
                 
                 if (noteArea) {
                     noteContainer.hidden = false;
                     noteArea.value = (noteArea.value ? noteArea.value + '\n' : '') + text;
                     saveNote(cardId, noteArea.value);
                     card.querySelector('.btn-note').classList.add('active');
                     noteArea.scrollIntoView({behavior: 'smooth', block: 'center'});
                 }
                 menu.hidden = true;
             };

             $('#ctxDict').onclick = () => {
                const term = text.toLowerCase().replace(/[.,!?;:]/g, '');
                if (DICTIONARY[term]) {
                    alert(`${term.toUpperCase()}: ${DICTIONARY[term]}`);
                } else {
                    $('#dictionaryBtn').click();
                }
                menu.hidden = true;
             };
        }
    }, 500));
}

function initEvents() {
    safeAddListener('#themeToggle', 'click', toggleTheme);
    safeAddListener('#printBtn', 'click', () => window.print());
    safeAddListener('#teacherModeBtn', 'click', () => setTeacherMode(!state.teacherMode));
    safeAddListener('#markersBtn', 'click', () => setMarkersMode(!state.markersMode));
    safeAddListener('#favFilterBtn', 'click', setFavFilterMode);
    safeAddListener('#closeDialog', 'click', () => $('#articleDialog').close());
    safeAddListener('#toggleExplanations', 'change', e => setTeacherMode(e.target.checked));

    $$('dialog').forEach(dlg => {
        dlg.addEventListener('click', (e) => {
            const rect = dlg.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                dlg.close();
            }
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

function boot() {
    applyTheme(true);
    const teacherMode = localStorage.getItem(LS.TEACHER) === '1'; setTeacherMode(teacherMode);
    const markersMode = localStorage.getItem(LS.MARKERS) === '1'; state.markersMode = markersMode;
    const mBtn = $('#markersBtn'); if (mBtn) mBtn.setAttribute('aria-pressed', markersMode ? 'true' : 'false');

    loadFavorites(); 
    loadNotes(); 
    initFontSettings(); 
    initSearchHistory(); 
    initTimer(); 
    initGame(); 
    initGame23(); 
    initFlashcards(); 
    initDictionary(); 
    initMap(); 
    initMobileNav(); 
    initFoldersUI(); 
    initEvents();
    initSpyScroll();
    initContextMenu();
    initAudioPlayer();
    initPWAInstall();
    initServiceWorker(); 
    loadChapters();
}

document.addEventListener('DOMContentLoaded', boot);