/* PrepMate: training.js */
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
    safeAddListener('#resetHighscoreBtn', 'click', () => {
        localStorage.removeItem(LS.HIGHSCORE);
        const hs = $('#highScore');
        if (hs) hs.textContent = 0;
        showToast('Рекорд сброшен');
    });
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
            { id: 4, text: "Гарантия свободы совести и вероисповедания", correct: false },
            { id: 5, text: "Каждый вправе исповедовать любую религию или не исповедовать никакой", correct: false },
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
            { id: 1, text: "Состоит из республик, краёв, областей, городов федерального значения, автономной области и автономных округов", correct: true },
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
            { id: 3, text: "Полномочия Президента и Государственной Думы ограничены установленным Конституцией сроком", correct: true },
            { id: 4, text: "Президент и Государственная Дума формируются на выборах", correct: true },
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
            { id: 4, text: "Запрет на отчуждение части территории РФ, кроме делимитации, демаркации и редемаркации государственной границы", correct: true },
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
            { id: 4, text: "Никто не обязан свидетельствовать против самого себя", correct: false },
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
            { id: 6, text: "Родители обязаны заботиться о детях, а трудоспособные совершеннолетние дети — о нетрудоспособных родителях", correct: true },
            { id: 7, text: "Участвовать в выборах", correct: false },
            { id: 8, text: "Вступать в политические партии", correct: false }
        ]
    },
    {
        question: "Полномочия Президента РФ",
        options: [
            { id: 1, text: "Введение военного положения", correct: true },
            { id: 2, text: "Осуществление помилования", correct: true },
            { id: 3, text: "Назначение выборов Государственной Думы", correct: true },
            { id: 4, text: "Руководство внешней политикой", correct: true },
            { id: 5, text: "Роспуск Государственной Думы в предусмотренных случаях", correct: true },
            { id: 6, text: "Объявление амнистии", correct: false },
            { id: 7, text: "Отрешение Президента от должности", correct: false }
        ]
    },
    {
        question: "Полномочия Совета Федерации",
        options: [
            { id: 1, text: "Утверждение изменения границ между субъектами РФ", correct: true },
            { id: 2, text: "Назначение судей Конституционного Суда", correct: true },
            { id: 3, text: "Проведение консультаций по кандидатуре Генерального прокурора РФ", correct: true },
            { id: 4, text: "Отрешение Президента от должности", correct: true },
            { id: 5, text: "Утверждение указа о введении чрезвычайного положения", correct: true },
            { id: 6, text: "Объявление амнистии", correct: false },
            { id: 7, text: "Назначение Председателя Центрального банка", correct: false }
        ]
    },
    {
        question: "Полномочия Государственной Думы",
        options: [
            { id: 1, text: "Принятие федеральных законов", correct: true },
            { id: 2, text: "Объявление амнистии", correct: true },
            { id: 3, text: "Назначение Председателя Центрального банка", correct: true },
            { id: 4, text: "Выдвижение обвинения против Президента (импичмент)", correct: true },
            { id: 5, text: "Назначение Уполномоченного по правам человека", correct: true },
            { id: 6, text: "Введение военного положения", correct: false },
            { id: 7, text: "Назначение Генерального прокурора", correct: false }
        ]
    },
    {
        question: "Полномочия Правительства РФ",
        options: [
            { id: 1, text: "Разработка и представление федерального бюджета", correct: true },
            { id: 2, text: "Обеспечение единой финансовой политики", correct: true },
            { id: 3, text: "Управление федеральной собственностью", correct: true },
            { id: 4, text: "Осуществление мер по обеспечению обороны страны", correct: true },
            { id: 5, text: "Руководство деятельностью федеральных органов исполнительной власти, кроме органов, деятельностью которых руководит Президент", correct: true },
            { id: 6, text: "Введение чрезвычайного положения", correct: false },
            { id: 7, text: "Назначение выборов Президента", correct: false }
        ]
    },
    {
        question: "Предметы исключительного ведения Российской Федерации (ст. 71)",
        options: [
            { id: 1, text: "Принятие и изменение Конституции РФ", correct: true },
            { id: 2, text: "Федеральный бюджет, федеральные налоги и сборы", correct: true },
            { id: 3, text: "Внешняя политика и международные договоры", correct: true },
            { id: 4, text: "Оборона и безопасность", correct: true },
            { id: 5, text: "Уголовное и гражданское законодательство", correct: true },
            { id: 6, text: "Природопользование и охрана окружающей среды", correct: false },
            { id: 7, text: "Координация здравоохранения", correct: false }
        ]
    },
    {
        question: "Предметы совместного ведения РФ и субъектов (ст. 72)",
        options: [
            { id: 1, text: "Природопользование и охрана окружающей среды", correct: true },
            { id: 2, text: "Общие вопросы образования, воспитания и науки", correct: true },
            { id: 3, text: "Административное, трудовое, семейное, жилищное законодательство", correct: true },
            { id: 4, text: "Защита прав национальных меньшинств", correct: true },
            { id: 5, text: "Координация вопросов здравоохранения", correct: true },
            { id: 6, text: "Уголовное законодательство", correct: false },
            { id: 7, text: "Денежная эмиссия", correct: false }
        ]
    },
    {
        question: "Конституционные принципы правосудия в РФ",
        options: [
            { id: 1, text: "Осуществление правосудия только судом", correct: true },
            { id: 2, text: "Независимость судей", correct: true },
            { id: 3, text: "Состязательность и равноправие сторон", correct: true },
            { id: 4, text: "Презумпция невиновности", correct: true },
            { id: 5, text: "Гласность судопроизводства", correct: true },
            { id: 6, text: "Обязательное участие прокурора в любом процессе", correct: false },
            { id: 7, text: "Назначение наказания без судебного решения", correct: false }
        ]
    },
    {
        question: "Личные (гражданские) права и свободы человека",
        options: [
            { id: 1, text: "Право на жизнь", correct: true },
            { id: 2, text: "Право на неприкосновенность частной жизни", correct: true },
            { id: 3, text: "Свобода передвижения и выбора места жительства", correct: true },
            { id: 4, text: "Право на тайну переписки и телефонных переговоров", correct: true },
            { id: 5, text: "Неприкосновенность жилища", correct: true },
            { id: 6, text: "Право избирать и быть избранным", correct: false },
            { id: 7, text: "Право на труд и отдых", correct: false }
        ]
    },
    {
        question: "Характеристики Конституции РФ как Основного закона",
        options: [
            { id: 1, text: "Обладает высшей юридической силой", correct: true },
            { id: 2, text: "Имеет прямое действие на всей территории РФ", correct: true },
            { id: 3, text: "Законы не должны противоречить Конституции", correct: true },
            { id: 4, text: "Органы власти обязаны соблюдать Конституцию", correct: true },
            { id: 5, text: "Для пересмотра положений глав 1, 2 и 9 предусмотрен особый конституционный порядок", correct: true },
            { id: 6, text: "Может быть изменена простым большинством голосов в ГД", correct: false },
            { id: 7, text: "Вступает в силу только после одобрения Президентом", correct: false }
        ]
    },
    {
        question: "Принципы федеративного устройства РФ (ст. 5)",
        options: [
            { id: 1, text: "Государственная целостность", correct: true },
            { id: 2, text: "Единство системы государственной власти", correct: true },
            { id: 3, text: "Равноправие субъектов РФ", correct: true },
            { id: 4, text: "Разграничение предметов ведения между РФ и субъектами", correct: true },
            { id: 5, text: "Самоопределение народов в РФ", correct: true },
            { id: 6, text: "Право субъектов на выход из состава РФ", correct: false },
            { id: 7, text: "Установление субъектами собственной валюты", correct: false }
        ]
    },
    {
        question: "Народный суверенитет и формы его осуществления (ст. 3)",
        options: [
            { id: 1, text: "Народ является единственным источником власти", correct: true },
            { id: 2, text: "Народ осуществляет власть непосредственно через референдум и выборы", correct: true },
            { id: 3, text: "Народ осуществляет власть через органы государственной власти", correct: true },
            { id: 4, text: "Народ осуществляет власть через органы местного самоуправления", correct: true },
            { id: 5, text: "Захват власти или присвоение властных полномочий преследуется по закону", correct: true },
            { id: 6, text: "Правительство является источником власти", correct: false },
            { id: 7, text: "Власть Президента не зависит от воли народа", correct: false }
        ]
    },
    {
        question: "Принципы правового государства",
        options: [
            { id: 1, text: "Верховенство Конституции и закона", correct: true },
            { id: 2, text: "Права и свободы человека — высшая ценность", correct: true },
            { id: 3, text: "Разделение властей на законодательную, исполнительную и судебную", correct: true },
            { id: 4, text: "Государство обязано признавать, соблюдать и защищать права и свободы человека", correct: true },
            { id: 5, text: "Гарантии судебной защиты прав граждан", correct: true },
            { id: 6, text: "Государство не связано правом", correct: false },
            { id: 7, text: "Исполнительная власть выше судебной", correct: false }
        ]
    },
    {
        question: "Гарантии неприкосновенности личности (ст. 22—25)",
        options: [
            { id: 1, text: "Арест только по судебному решению", correct: true },
            { id: 2, text: "Задержание без решения суда — не более 48 часов", correct: true },
            { id: 3, text: "Запрет проникать в жилище против воли проживающих, кроме установленных законом случаев или на основании судебного решения", correct: true },
            { id: 4, text: "Тайна переписки, телефонных переговоров", correct: true },
            { id: 5, text: "Защита персональных данных", correct: true },
            { id: 6, text: "Заключение под стражу по решению прокурора", correct: false },
            { id: 7, text: "Обыск без ограничений", correct: false }
        ]
    },
    {
        question: "Права в сфере правосудия и юридической защиты",
        options: [
            { id: 1, text: "Право на судебную защиту", correct: true },
            { id: 2, text: "Право на квалифицированную юридическую помощь (адвокат)", correct: true },
            { id: 3, text: "Презумпция невиновности", correct: true },
            { id: 4, text: "Право на рассмотрение дела судом присяжных (в предусмотренных случаях)", correct: true },
            { id: 5, text: "Запрет использования доказательств, полученных с нарушением закона", correct: true },
            { id: 6, text: "Право требовать изменить состав суда по желанию обвиняемого", correct: false },
            { id: 7, text: "Обязанность обвиняемого доказывать свою невиновность", correct: false }
        ]
    },
    {
        question: "Виды субъектов РФ (ст. 5, 65)",
        options: [
            { id: 1, text: "Республики", correct: true },
            { id: 2, text: "Края", correct: true },
            { id: 3, text: "Области", correct: true },
            { id: 4, text: "Города федерального значения", correct: true },
            { id: 5, text: "Автономная область и автономные округа", correct: true },
            { id: 6, text: "Федеральные районы", correct: false },
            { id: 7, text: "Губернии", correct: false }
        ]
    },

    // --- Задача 2: +9 новых заданий ---
    {
        question: "Права, которые не могут быть ограничены даже в условиях чрезвычайного положения (ст. 56)",
        options: [
            { id: 1, text: "Право на жизнь", correct: true },
            { id: 2, text: "Достоинство личности", correct: true },
            { id: 3, text: "Право не подвергаться пыткам", correct: true },
            { id: 4, text: "Право на неприкосновенность частной жизни", correct: true },
            { id: 5, text: "Свобода совести и вероисповедания", correct: true },
            { id: 6, text: "Право на забастовку", correct: false },
            { id: 7, text: "Свобода передвижения", correct: false }
        ]
    },
    {
        question: "Основания для роспуска Государственной Думы Президентом (ст. 111, 117)",
        options: [
            { id: 1, text: "После трёхкратного отклонения кандидатур Председателя Правительства Президент вправе распустить Государственную Думу", correct: true },
            { id: 2, text: "Повторное выражение недоверия Правительству в течение трёх месяцев", correct: true },
            { id: 3, text: "Отказ Государственной Думы в доверии Правительству после постановки вопроса Председателем Правительства", correct: true },
            { id: 4, text: "Нарушение Думой Конституции по решению Конституционного Суда", correct: false },
            { id: 5, text: "Требование Совета Федерации", correct: false }
        ]
    },
    {
        question: "Случаи, когда Государственная Дума не может быть распущена (ст. 109)",
        options: [
            { id: 1, text: "В течение года после её избрания — по основаниям статьи 117 Конституции", correct: true },
            { id: 2, text: "С момента выдвижения обвинения против Президента до принятия решения Советом Федерации", correct: true },
            { id: 3, text: "В период действия военного положения на всей территории РФ", correct: true },
            { id: 4, text: "В период действия чрезвычайного положения на всей территории РФ", correct: true },
            { id: 5, text: "В течение шести месяцев до окончания срока полномочий Президента", correct: true },
            { id: 6, text: "Если Дума приняла бюджет", correct: false },
            { id: 7, text: "Во время сессии", correct: false }
        ]
    },
    {
        question: "Требования к кандидату в Президенты РФ (ст. 81)",
        options: [
            { id: 1, text: "Гражданин РФ", correct: true },
            { id: 2, text: "Не моложе 35 лет", correct: true },
            { id: 3, text: "Постоянно проживает в РФ не менее 25 лет", correct: true },
            { id: 4, text: "Не имеет и ранее не имел иностранного гражданства или вида на жительство, кроме предусмотренного Конституцией исключения для жителей принятой в РФ территории", correct: true },
            { id: 5, text: "После избрания Президенту запрещено иметь счета и ценности в иностранных банках", correct: false },
            { id: 6, text: "Имеет высшее юридическое образование", correct: false },
            { id: 7, text: "Не моложе 40 лет", correct: false }
        ]
    },
    {
        question: "Основания прекращения полномочий Президента РФ досрочно (ст. 92, 93)",
        options: [
            { id: 1, text: "Отставка по собственному желанию", correct: true },
            { id: 2, text: "Стойкая неспособность по состоянию здоровья осуществлять полномочия", correct: true },
            { id: 3, text: "Отрешение от должности Советом Федерации", correct: true },
            { id: 4, text: "Истечение срока полномочий", correct: false },
            { id: 5, text: "Вотум недоверия Государственной Думы", correct: false }
        ]
    },
    {
        question: "Принципы гражданства Российской Федерации (ст. 6)",
        options: [
            { id: 1, text: "Гражданство является единым", correct: true },
            { id: 2, text: "Гражданство является равным независимо от оснований приобретения", correct: true },
            { id: 3, text: "Гражданин не может быть лишён гражданства", correct: true },
            { id: 4, text: "Гражданин не может быть выслан за пределы РФ", correct: true },
            { id: 5, text: "Гражданин не может быть выдан иностранному государству", correct: true },
            { id: 6, text: "Двойное гражданство запрещено во всех случаях", correct: false },
            { id: 7, text: "Гражданство субъекта РФ не совпадает с гражданством РФ", correct: false }
        ]
    },
    {
        question: "Полномочия Конституционного Суда РФ (ст. 125)",
        options: [
            { id: 1, text: "Проверка конституционности федеральных законов", correct: true },
            { id: 2, text: "Разрешение споров о компетенции между федеральными органами власти", correct: true },
            { id: 3, text: "Толкование Конституции РФ", correct: true },
            { id: 4, text: "Проверка конституционности применённого в конкретном деле закона по жалобе гражданина после исчерпания внутригосударственных средств судебной защиты", correct: true },
            { id: 5, text: "Дача заключения о соблюдении порядка выдвижения обвинения против Президента", correct: true },
            { id: 6, text: "Рассмотрение уголовных дел по первой инстанции", correct: false },
            { id: 7, text: "Назначение Генерального прокурора", correct: false }
        ]
    },
    {
        question: "Конституционные гарантии права на труд (ст. 37)",
        options: [
            { id: 1, text: "Труд свободен, каждый вправе свободно выбирать род деятельности", correct: true },
            { id: 2, text: "Принудительный труд запрещён", correct: true },
            { id: 3, text: "Право на безопасные условия труда", correct: true },
            { id: 4, text: "Право на вознаграждение за труд без дискриминации не ниже МРОТ", correct: true },
            { id: 5, text: "Право на защиту от безработицы", correct: true },
            { id: 6, text: "Государство гарантирует каждому место работы", correct: false },
            { id: 7, text: "Работодатель обязан принимать на работу всех желающих", correct: false }
        ]
    },
    {
        question: "Конституционные принципы судебной системы (ст. 118—123)",
        options: [
            { id: 1, text: "Правосудие осуществляется только судом", correct: true },
            { id: 2, text: "Судьи независимы и подчиняются только Конституции и закону", correct: true },
            { id: 3, text: "Судьи несменяемы", correct: true },
            { id: 4, text: "Судьи неприкосновенны", correct: true },
            { id: 5, text: "Разбирательство дел открытое, кроме предусмотренных федеральным законом случаев", correct: true },
            { id: 6, text: "Судья может быть одновременно прокурором", correct: false },
            { id: 7, text: "Президент вправе давать указания судьям по конкретным делам", correct: false }
        ]
    }
];

const game23 = { currentTaskIndex: 0, selectedIds: new Set(), initialized: false };

function initGame23() {
    safeAddListener('#game23Btn', 'click', () => {
        // Инициализировать только при первом открытии
        if (!game23.initialized) {
            TASKS_23.sort(() => Math.random() - 0.5);
            game23.initialized = true;
        }
        renderTask23();
        $('#game23Dialog').showModal();
    });
    safeAddListener('#closeGame23', 'click', () => $('#game23Dialog').close());

    safeAddListener('#resetGame23', 'click', () => {
        game23.currentTaskIndex = 0;
        game23.selectedIds = new Set();
        TASKS_23.sort(() => Math.random() - 0.5);
        renderTask23();
        $('#task23Feedback').textContent = '';
    });

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
        const div = document.createElement('button');
        div.type = 'button';
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
        fb.textContent = "Верно: выбраны три подходящих положения Конституции.";
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
    index: 0,
    deck: 'all'
};

function getFlashcardDeck(deck = 'all') {
    const patterns = {
        rights: /прав|свобод|гражданств|семь|брак|труд|собственност|достоинств|неприкосновенн|цензур|убежищ|социальн/i,
        government: /президент|правительств|государственн.{0,8}дума|совет федерац|федеральн.{0,8}собран|орган.{0,8}власт|депутат|сенатор/i,
        federation: /федерац|субъект|республик|край|област|автоном|муниципал|местн.{0,8}самоуправ/i,
        justice: /закон|правосуд|суд|преступ|наказан|ответственност|адвокат|прокуратур|конституционн.{0,8}суд/i,
        foundations: /демократ|государств|суверен|конституц|идеолог|политическ|светск|социальн|правов/i
    };
    if (deck === 'all') return [...FLASHCARD_TERMS];
    const terms = FLASHCARD_TERMS.filter(term => patterns[deck]?.test(term));
    return terms.length ? terms : [...FLASHCARD_TERMS];
}

function resetFlashcardDeck() {
    flashcards.deck = $('#flashcardDeck')?.value || 'all';
    flashcards.terms = getFlashcardDeck(flashcards.deck).sort(() => Math.random() - 0.5);
    flashcards.index = 0;
    $('#flashcard')?.classList.remove('flipped');
    renderFlashcard();
}

function initFlashcards() {
    safeAddListener('#flashcardsBtn', 'click', () => {
        // Инициализировать только если пусто (первое открытие)
        if (flashcards.terms.length === 0) {
            resetFlashcardDeck();
        }
        renderFlashcard();
        $('#flashcardsDialog').showModal();
    });

    safeAddListener('#closeFlashcards', 'click', () => $('#flashcardsDialog').close());

    safeAddListener('#resetFlashcards', 'click', () => {
        resetFlashcardDeck();
    });
    safeAddListener('#flashcardDeck', 'change', resetFlashcardDeck);

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

/* --- СМЕШАННАЯ ТРЕНИРОВКА --- */
const mixedTraining = { questions: [], index: 0, score: 0, answered: false };
const POWER_LABELS = { president: 'Президент РФ', sf: 'Совет Федерации', gd: 'Государственная Дума', gov: 'Правительство РФ', ks: 'Конституционный Суд РФ' };

function shuffle(values) { return [...values].sort(() => Math.random() - 0.5); }

function createMixedQuestions() {
    const terms = shuffle(FLASHCARD_TERMS).slice(0, 4).map(term => ({
        type: 'Термины',
        question: `Какое определение соответствует термину «${term}»?`,
        answers: shuffle([DICTIONARY[term], ...shuffle(FLASHCARD_TERMS.filter(item => item !== term)).slice(0, 3).map(item => DICTIONARY[item])]),
        correct: DICTIONARY[term]
    }));
    const powers = shuffle(POWERS).slice(0, 3).map(item => ({
        type: 'ЕГЭ №13', question: item.text, answers: shuffle(Object.values(POWER_LABELS)), correct: POWER_LABELS[item.target]
    }));
    const constitution = shuffle(TASKS_23).slice(0, 3).map(task => {
        const correct = shuffle(task.options.filter(option => option.correct))[0];
        const wrong = shuffle(task.options.filter(option => !option.correct)).slice(0, 3);
        return { type: 'ЕГЭ №23', question: `Какое положение подтверждает характеристику «${task.question}»?`, answers: shuffle([correct, ...wrong]).map(option => option.text), correct: correct.text };
    });
    return shuffle([...terms, ...powers, ...constitution]);
}

function renderMixedQuestion() {
    const item = mixedTraining.questions[mixedTraining.index];
    const answers = $('#mixedAnswers');
    mixedTraining.answered = false;
    $('#mixedNext').hidden = true;
    $('#mixedFeedback').textContent = '';
    $('#mixedType').textContent = item.type;
    $('#mixedCounter').textContent = `${mixedTraining.index + 1} / ${mixedTraining.questions.length}`;
    $('#mixedQuestion').textContent = item.question;
    answers.innerHTML = '';
    item.answers.forEach(answer => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mixed-answer';
        button.textContent = answer;
        button.addEventListener('click', () => checkMixedAnswer(button, answer));
        answers.append(button);
    });
}

function checkMixedAnswer(button, answer) {
    if (mixedTraining.answered) return;
    mixedTraining.answered = true;
    const item = mixedTraining.questions[mixedTraining.index];
    const correct = answer === item.correct;
    if (correct) mixedTraining.score++;
    button.classList.add(correct ? 'correct' : 'wrong');
    $$('#mixedAnswers .mixed-answer').forEach(option => {
        option.disabled = true;
        if (option.textContent === item.correct) option.classList.add('correct');
    });
    const feedback = $('#mixedFeedback');
    feedback.textContent = correct ? 'Верно!' : `Правильный ответ: ${item.correct}`;
    feedback.style.color = correct ? '#22c55e' : '#ef4444';
    const next = $('#mixedNext');
    next.hidden = false;
    next.textContent = mixedTraining.index === mixedTraining.questions.length - 1 ? 'Показать результат' : 'Следующий вопрос';
}

function initMixedTraining() {
    safeAddListener('#mixedTrainingBtn', 'click', () => {
        mixedTraining.questions = createMixedQuestions();
        mixedTraining.index = 0;
        mixedTraining.score = 0;
        renderMixedQuestion();
        $('#mixedTrainingDialog').showModal();
    });
    safeAddListener('#closeMixedTraining', 'click', () => $('#mixedTrainingDialog').close());
    safeAddListener('#mixedNext', 'click', () => {
        if (mixedTraining.index === -1) {
            mixedTraining.questions = createMixedQuestions();
            mixedTraining.index = 0;
            mixedTraining.score = 0;
            renderMixedQuestion();
            return;
        }
        if (mixedTraining.index < mixedTraining.questions.length - 1) {
            mixedTraining.index++;
            renderMixedQuestion();
            return;
        }
        $('#mixedType').textContent = 'Результат';
        $('#mixedCounter').textContent = '';
        $('#mixedQuestion').textContent = `${mixedTraining.score} из ${mixedTraining.questions.length}`;
        $('#mixedAnswers').innerHTML = '';
        $('#mixedFeedback').textContent = mixedTraining.score >= 8 ? 'Отличный результат!' : 'Повторите ошибки и попробуйте ещё раз.';
        $('#mixedNext').textContent = 'Начать заново';
        mixedTraining.index = -1;
    });
}
