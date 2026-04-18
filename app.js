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
    mapZoom: 1,
    mapPan: { x: 0, y: 0 }
};

const LS = {
    THEME: 'ic-theme',
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

// --- СЛОВАРЬ ТЕРМИНОВ ---
const DICTIONARY = {
    "адвокат": "Квалифицированный юрист, оказывающий профессиональную юридическую помощь (ст. 48 гарантирует право на помощь адвоката).",
    "амнистия": "Освобождение от наказания неопределенного круга лиц, объявляется Государственной Думой (ст. 103).",
    "безопасность": "Состояние защищенности жизненно важных интересов личности, общества и государства (ведение РФ - ст. 71).",
    "бюджет": "Федеральный бюджет — план доходов и расходов государства, принимаемый в виде федерального закона (ст. 114).",
    "валюта": "Денежная единица страны. В РФ рубль является законным платежным средством (ст. 75).",
    "вероисповедание": "Принадлежность к какой-либо религии или отказ от неё, гарантированная свобода совести (ст. 28).",
    "власть": "Способность оказывать воздействие на поведение людей. В РФ власть делится на законодательную, исполнительную и судебную (ст. 10).",
    "выборы": "Свободное волеизъявление граждан при избрании Президента и депутатов Государственной Думы (ст. 3, 32).",
    "гражданство": "Устойчивая правовая связь лица с Российской Федерацией (ст. 6).",
    "демократическое": "Характеристика РФ как государства, где единственным источником власти является народ (ст. 1).",
    "депутат": "Избранный представитель народа в Государственной Думе (ст. 97).",
    "договор": "Соглашение двух или более сторон. Международные договоры являются частью правовой системы РФ (ст. 15).",
    "думе": "Государственная Дума — нижняя палата парламента РФ (ст. 95).",
    "жилище": "Место проживания гражданина, которое неприкосновенно (ст. 25).",
    "закон": "Нормативный правовой акт, обладающий высшей юридической силой (после Конституции) (ст. 15, 76).",
    "здоровье": "Состояние физического и психического благополучия. Каждый имеет право на охрану здоровья (ст. 41).",
    "имущество": "Материальные ценности, находящиеся в собственности граждан или государства (ст. 35).",
    "конституция": "Основной закон государства, имеющий высшую юридическую силу и прямое действие (ст. 15).",
    "местное самоуправление": "Самостоятельное решение населением вопросов местного значения (ст. 12, 130).",
    "налоги": "Обязательные платежи, взимаемые государством. Каждый обязан платить законно установленные налоги (ст. 57).",
    "наследство": "Переход имущества умершего к другим лицам. Право наследования гарантируется (ст. 35).",
    "оборона": "Система мер по защите государства от внешнего нападения (ст. 71, 87).",
    "образование": "Целенаправленный процесс обучения. Основное общее образование обязательно (ст. 43).",
    "охрана": "Деятельность государства по защите прав, природы, здоровья и т.д. (ст. 9, 41).",
    "пенсия": "Регулярная денежная выплата гражданам (по возрасту, инвалидности). Гарантируется социальным государством (ст. 39).",
    "помилование": "Освобождение конкретного лица от наказания, осуществляется Президентом РФ (ст. 89).",
    "пошлины": "Денежные сборы, взимаемые уполномоченными органами (ст. 71, 74).",
    "правительство": "Высший исполнительный орган власти РФ (ст. 110).",
    "правовое": "Характеристика государства, где закон превыше всего (ст. 1).",
    "правосудие": "Деятельность судов по рассмотрению и разрешению дел (ст. 118).",
    "президент": "Глава государства, гарант Конституции РФ (ст. 80).",
    "присяга": "Торжественное обещание, даваемое Президентом при вступлении в должность (ст. 82).",
    "прокурор": "Должностное лицо, осуществляющее надзор за соблюдением законов (ст. 129).",
    "республиканская": "Форма правления РФ, при которой глава государства избирается (ст. 1).",
    "референдум": "Всенародное голосование по важным вопросам (ст. 3).",
    "светское": "Государство, где религия отделена от власти (ст. 14).",
    "свобода": "Возможность человека действовать по своему усмотрению (свобода слова, совести, передвижения) (Глава 2).",
    "семья": "Союз людей, находящийся под защитой государства (ст. 38).",
    "собственность": "Право владеть, пользоваться и распоряжаться имуществом (частная, государственная, муниципальная) (ст. 8, 35).",
    "собрание": "Федеральное Собрание — парламент РФ (ст. 94). Также право собираться мирно (ст. 31).",
    "совет федерации": "Верхняя палата парламента РФ (ст. 95).",
    "социальное": "Государство, политика которого направлена на достойную жизнь граждан (ст. 7).",
    "суверенитет": "Верховенство и независимость власти (ст. 4).",
    "суд": "Орган, осуществляющий правосудие (ст. 118).",
    "судья": "Лицо, наделенное полномочиями осуществлять правосудие. Судьи независимы и подчиняются только закону (ст. 120).",
    "таможня": "Государственный орган, контролирующий перемещение через границу (ст. 74 - таможенные границы).",
    "труд": "Деятельность человека. Труд свободен, принудительный труд запрещен (ст. 37).",
    "указ": "Нормативный акт, издаваемый Президентом РФ (ст. 90).",
    "федерация": "Форма государственного устройства РФ (ст. 1, 5).",
    "экология": "Вопросы, связанные с окружающей средой. Каждый имеет право на благоприятную окружающую среду (ст. 42)."
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

/* --- ИГРА №13 (РАСШИРЕННАЯ БАЗА) --- */
const POWERS = [
    { text: "Назначение выборов Государственной Думы", target: "president" },
    { text: "Роспуск Государственной Думы", target: "president" },
    { text: "Назначение референдума", target: "president" },
    { text: "Внесение законопроектов в Государственную Думу", target: "president" },
    { text: "Подписание и обнародование федеральных законов", target: "president" },
    { text: "Ежегодное обращение к Федеральному Собранию", target: "president" },
    { text: "Осуществление помилования", target: "president" },
    { text: "Решение вопросов гражданства РФ", target: "president" },
    { text: "Предоставление политического убежища", target: "president" },
    { text: "Награждение государственными наградами", target: "president" },
    { text: "Присвоение почетных званий", target: "president" },
    { text: "Присвоение высших воинских званий", target: "president" },
    { text: "Назначение Председателя Правительства РФ (с согласия ГД)", target: "president" },
    { text: "Принятие отставки Правительства РФ", target: "president" },
    { text: "Назначение федеральных министров", target: "president" },
    { text: "Руководство внешней политикой РФ", target: "president" },
    { text: "Ведение переговоров и подписание международных договоров", target: "president" },
    { text: "Назначение послов (после консультаций с парламентом)", target: "president" },
    { text: "Утверждение военной доктрины", target: "president" },
    { text: "Является Верховным Главнокомандующим", target: "president" },
    { text: "Введение военного положения", target: "president" },
    { text: "Введение чрезвычайного положения", target: "president" },
    { text: "Назначение судей федеральных судов (кроме высших)", target: "president" },
    { text: "Представление Совету Федерации кандидатур судей высших судов", target: "president" },
    { text: "Представление Совету Федерации кандидатуры Генпрокурора", target: "president" },
    { text: "Формирование Государственного Совета", target: "president" },
    { text: "Формирование Совета Безопасности", target: "president" },
    { text: "Назначение Администрации Президента", target: "president" },
    { text: "Утверждение изменения границ между субъектами РФ", target: "sf" },
    { text: "Утверждение указа Президента о введении военного положения", target: "sf" },
    { text: "Утверждение указа Президента о введении чрезвычайного положения", target: "sf" },
    { text: "Решение вопроса о возможности использования ВС РФ за пределами территории", target: "sf" },
    { text: "Назначение выборов Президента РФ", target: "sf" },
    { text: "Отрешение Президента РФ от должности", target: "sf" },
    { text: "Назначение судей Конституционного Суда РФ", target: "sf" },
    { text: "Назначение судей Верховного Суда РФ", target: "sf" },
    { text: "Назначение Генерального прокурора РФ (по представлению Президента)", target: "sf" },
    { text: "Назначение заместителей Генерального прокурора", target: "sf" },
    { text: "Назначение Председателя Счетной палаты", target: "sf" },
    { text: "Дача согласия Президенту на назначение Председателя Правительства", target: "gd" },
    { text: "Утверждение кандидатур заместителей Председателя Правительства", target: "gd" },
    { text: "Утверждение кандидатур федеральных министров (не силовых)", target: "gd" },
    { text: "Решение вопроса о доверии Правительству РФ", target: "gd" },
    { text: "Назначение Председателя Центрального банка РФ", target: "gd" },
    { text: "Освобождение от должности Председателя Центрального банка", target: "gd" },
    { text: "Назначение заместителя Председателя Счетной палаты", target: "gd" },
    { text: "Назначение Уполномоченного по правам человека", target: "gd" },
    { text: "Объявление амнистии", target: "gd" },
    { text: "Выдвижение обвинения против Президента РФ", target: "gd" },
    { text: "Разработка федерального бюджета", target: "gov" },
    { text: "Представление федерального бюджета Государственной Думе", target: "gov" },
    { text: "Обеспечение исполнения федерального бюджета", target: "gov" },
    { text: "Представление отчета об исполнении бюджета", target: "gov" },
    { text: "Обеспечение проведения единой финансовой политики", target: "gov" },
    { text: "Проведение единой политики в области культуры", target: "gov" },
    { text: "Проведение единой политики в области науки и образования", target: "gov" },
    { text: "Проведение единой политики в области здравоохранения", target: "gov" },
    { text: "Проведение единой политики в области социального обеспечения", target: "gov" },
    { text: "Проведение единой политики в области экологии", target: "gov" },
    { text: "Управление федеральной собственностью", target: "gov" },
    { text: "Осуществление мер по обеспечению обороны страны", target: "gov" },
    { text: "Осуществление мер по обеспечению государственной безопасности", target: "gov" },
    { text: "Поддержка добровольческой (волонтерской) деятельности", target: "gov" },
    { text: "Содействие развитию предпринимательства", target: "gov" }
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

/* --- ЗАДАНИЕ №23 (РАСШИРЕННАЯ БАЗА) --- */
const TASKS_23 = [
    {
        question: "РФ — социальное государство",
        options: [
            { id: 1, text: "Охрана труда и здоровья людей", correct: true },
            { id: 2, text: "Установление гарантированного МРОТ", correct: true },
            { id: 3, text: "Обеспечение государственной поддержки семьи, материнства, отцовства и детства", correct: true },
            { id: 4, text: "Развитие системы социальных служб", correct: true },
            { id: 5, text: "Установление государственных пенсий и пособий", correct: true },
            { id: 6, text: "Разделение государственной власти на три ветви", correct: false },
            { id: 7, text: "Признание идеологического многообразия", correct: false }
        ]
    },
    {
        question: "РФ — светское государство",
        options: [
            { id: 1, text: "Никакая религия не может устанавливаться в качестве государственной или обязательной", correct: true },
            { id: 2, text: "Религиозные объединения отделены от государства", correct: true },
            { id: 3, text: "Религиозные объединения равны перед законом", correct: true },
            { id: 4, text: "Гарантия свободы совести и вероисповедания", correct: true },
            { id: 5, text: "Каждый вправе исповедовать любую религию или не исповедовать никакой", correct: true },
            { id: 6, text: "Земля используется как основа жизни народов", correct: false },
            { id: 7, text: "Во взаимоотношениях с федеральными органами все субъекты равноправны", correct: false }
        ]
    },
    {
        question: "РФ — демократическое государство",
        options: [
            { id: 1, text: "Носителем суверенитета и единственным источником власти является народ", correct: true },
            { id: 2, text: "Народ осуществляет свою власть непосредственно, а также через органы власти", correct: true },
            { id: 3, text: "Высшим непосредственным выражением власти народа являются референдум и выборы", correct: true },
            { id: 4, text: "Признание политического многообразия и многопартийности", correct: true },
            { id: 5, text: "Местное самоуправление в пределах своих полномочий самостоятельно", correct: true },
            { id: 6, text: "Отделение церкви от государства", correct: false },
            { id: 7, text: "Обеспечение поддержки инвалидов и пожилых граждан", correct: false }
        ]
    },
    {
        question: "РФ — правовое государство",
        options: [
            { id: 1, text: "Верховенство закона и Конституции", correct: true },
            { id: 2, text: "Человек, его права и свободы являются высшей ценностью", correct: true },
            { id: 3, text: "Обязанность государства признавать, соблюдать и защищать права человека", correct: true },
            { id: 4, text: "Все равны перед законом и судом", correct: true },
            { id: 5, text: "Осуществление прав и свобод не должно нарушать права других лиц", correct: true },
            { id: 6, text: "Наличие единой денежной единицы", correct: false },
            { id: 7, text: "Установление государственных пенсий", correct: false }
        ]
    },
    {
        question: "РФ — федеративное государство",
        options: [
            { id: 1, text: "Состоит из республик, краев, областей, городов федерального значения", correct: true },
            { id: 2, text: "Равноправие субъектов РФ", correct: true },
            { id: 3, text: "Разграничение предметов ведения между РФ и субъектами", correct: true },
            { id: 4, text: "Государственная целостность", correct: true },
            { id: 5, text: "Единство системы государственной власти", correct: true },
            { id: 6, text: "Никакая религия не может быть государственной", correct: false },
            { id: 7, text: "Охрана труда и здоровья людей", correct: false }
        ]
    },
    {
        question: "РФ — республиканская форма правления",
        options: [
            { id: 1, text: "Глава государства (Президент) избирается сроком на 6 лет", correct: true },
            { id: 2, text: "Государственная Дума избирается сроком на 5 лет", correct: true },
            { id: 3, text: "Высшие органы власти являются выборными и сменяемыми", correct: true },
            { id: 4, text: "Главы субъектов Федерации избираются", correct: true },
            { id: 5, text: "Осуществление правосудия только судом", correct: false },
            { id: 6, text: "Признание идеологического многообразия", correct: false }
        ]
    },
    {
        question: "РФ — суверенное государство",
        options: [
            { id: 1, text: "Суверенитет РФ распространяется на всю её территорию", correct: true },
            { id: 2, text: "Конституция РФ и законы имеют верховенство на всей территории", correct: true },
            { id: 3, text: "РФ обеспечивает целостность и неприкосновенность своей территории", correct: true },
            { id: 4, text: "Запрет на отчуждение части территории РФ", correct: true },
            { id: 5, text: "Охрана труда и здоровья", correct: false },
            { id: 6, text: "Гарантия свободы совести", correct: false }
        ]
    },
    {
        question: "Единство экономического пространства",
        options: [
            { id: 1, text: "Свободное перемещение товаров, услуг и финансовых средств", correct: true },
            { id: 2, text: "Поддержка конкуренции", correct: true },
            { id: 3, text: "Свобода экономической деятельности", correct: true },
            { id: 4, text: "Признание и защита равным образом частной, государственной, муниципальной собственности", correct: true },
            { id: 5, text: "Запрет на установление таможенных границ внутри страны", correct: true },
            { id: 6, text: "Разделение властей на три ветви", correct: false },
            { id: 7, text: "Светский характер государства", correct: false }
        ]
    },
    {
        question: "Идеологическое многообразие",
        options: [
            { id: 1, text: "Никакая идеология не может устанавливаться в качестве государственной", correct: true },
            { id: 2, text: "Признание политического многообразия и многопартийности", correct: true },
            { id: 3, text: "Общественные объединения равны перед законом", correct: true },
            { id: 4, text: "Свобода мысли и слова", correct: true },
            { id: 5, text: "Запрет цензуры", correct: true },
            { id: 6, text: "Обеспечение государственной поддержки семьи", correct: false },
            { id: 7, text: "Единство экономического пространства", correct: false }
        ]
    },
    {
        question: "Гарантия презумпции невиновности",
        options: [
            { id: 1, text: "Каждый обвиняемый считается невиновным, пока его вина не будет доказана", correct: true },
            { id: 2, text: "Обвиняемый не обязан доказывать свою невиновность", correct: true },
            { id: 3, text: "Неустранимые сомнения в виновности толкуются в пользу обвиняемого", correct: true },
            { id: 4, text: "Никто не обязан свидетельствовать против самого себя", correct: true },
            { id: 5, text: "Свобода передвижения", correct: false },
            { id: 6, text: "Право на охрану здоровья", correct: false }
        ]
    },
    {
        question: "Гарантия личных (гражданских) прав",
        options: [
            { id: 1, text: "Право на жизнь", correct: true },
            { id: 2, text: "Достоинство личности охраняется государством", correct: true },
            { id: 3, text: "Право на свободу и личную неприкосновенность", correct: true },
            { id: 4, text: "Неприкосновенность жилища", correct: true },
            { id: 5, text: "Тайна переписки и телефонных переговоров", correct: true },
            { id: 6, text: "Право избирать и быть избранным", correct: false },
            { id: 7, text: "Право на участие в управлении делами государства", correct: false }
        ]
    },
    {
        question: "Гарантия политических прав",
        options: [
            { id: 1, text: "Право избирать и быть избранным", correct: true },
            { id: 2, text: "Право на участие в управлении делами государства", correct: true },
            { id: 3, text: "Равный доступ к государственной службе", correct: true },
            { id: 4, text: "Право собираться мирно, без оружия (митинги)", correct: true },
            { id: 5, text: "Право на объединение (создание профсоюзов, партий)", correct: true },
            { id: 6, text: "Право на охрану здоровья", correct: false },
            { id: 7, text: "Право на благоприятную окружающую среду", correct: false }
        ]
    },
    {
        question: "Гарантия социально-экономических прав",
        options: [
            { id: 1, text: "Свобода предпринимательской деятельности", correct: true },
            { id: 2, text: "Право частной собственности", correct: true },
            { id: 3, text: "Свобода труда", correct: true },
            { id: 4, text: "Право на отдых", correct: true },
            { id: 5, text: "Право на социальное обеспечение по возрасту", correct: true },
            { id: 6, text: "Право на жилище", correct: true },
            { id: 7, text: "Право на жизнь", correct: false }
        ]
    },
    {
        question: "Гарантия культурных прав",
        options: [
            { id: 1, text: "Свобода литературного, художественного и научного творчества", correct: true },
            { id: 2, text: "Право на участие в культурной жизни", correct: true },
            { id: 3, text: "Право на пользование учреждениями культуры", correct: true },
            { id: 4, text: "Доступ к культурным ценностям", correct: true },
            { id: 5, text: "Охрана интеллектуальной собственности", correct: true },
            { id: 6, text: "Право на судебную защиту", correct: false },
            { id: 7, text: "Неприкосновенность частной жизни", correct: false }
        ]
    },
    {
        question: "Обязанности гражданина РФ",
        options: [
            { id: 1, text: "Соблюдать Конституцию и законы", correct: true },
            { id: 2, text: "Платить законно установленные налоги и сборы", correct: true },
            { id: 3, text: "Сохранять природу и окружающую среду", correct: true },
            { id: 4, text: "Защищать Отечество", correct: true },
            { id: 5, text: "Заботиться о сохранении исторического и культурного наследия", correct: true },
            { id: 6, text: "Заботиться о детях и нетрудоспособных родителях", correct: true },
            { id: 7, text: "Участвовать в выборах", correct: false },
            { id: 8, text: "Вступать в политические партии", correct: false }
        ]
    }
];

const game23 = { currentTaskIndex: 0, selectedIds: new Set() };

function initGame23() {
    safeAddListener('#game23Btn', 'click', () => {
        game23.currentTaskIndex = 0;
        // Перемешать порядок заданий при каждом открытии
        TASKS_23.sort(() => Math.random() - 0.5);
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
    // Перемешиваем варианты ответов
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
            const bodyWords = body.split(/\s+/);

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

    // Терминология убрана - используется словарь вместо выделения в тексте

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
            mapBtn.textContent = '🗺️ Открыть карту РФ';
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

function setMarkersMode(enabled) {
    state.markersMode = enabled;
    localStorage.setItem(LS.MARKERS, enabled ? '1' : '0');
    const btn = $('#markersBtn');
    if (btn) btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    renderArticles();
}

function initEvents() {
    safeAddListener('#themeToggle', 'click', toggleTheme);
    safeAddListener('#printBtn', 'click', () => window.print());
    safeAddListener('#markersBtn', 'click', () => setMarkersMode(!state.markersMode));
    safeAddListener('#favFilterBtn', 'click', setFavFilterMode);
    safeAddListener('#closeDialog', 'click', () => $('#articleDialog').close());
    
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

/* --- ЗАЩИЩЕННАЯ ЗАГРУЗКА --- */
async function loadChapters() {
    const container = $('#content');
    const cachedData = localStorage.getItem(LS.CACHE_CHAPTERS);
    
    // 1. Попытка показать кэш (для скорости)
    if (cachedData) {
        try {
            state.articles = JSON.parse(cachedData);
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
            try { localStorage.setItem(LS.CACHE_CHAPTERS, JSON.stringify(newArticles)); } catch (e) { }
            
            // Безопасный рендер
            try { renderArticles(); } catch(e) { console.error('Render error:', e); }
            try { buildTOC(); } catch(e) { console.error('TOC error:', e); }
            
            applyFontSettings();
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
    if (window.speechSynthesis) window.speechSynthesis.cancel(); // Force stop audio

    applyTheme(true);
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
    // initContextMenu(); // Функция не найдена в исходнике, закомментировал
    initPWAInstall();
    initServiceWorker();
    loadChapters();
}

document.addEventListener('DOMContentLoaded', boot);