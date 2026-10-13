/* Публичные демонстрационные и открытые варианты ФИПИ; не авторские псевдозадания. */
const FIPI_2027 = 'https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ob_11_2027.zip';
const FIPI_2026_DEMO = 'https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2026/ob_11_2026.zip';
const FIPI_2026_OPEN = 'https://doc.fipi.ru/ege/otkrytyy-bank-zadaniy-ege/otkrytyye-varianty-kim-ege/2026/Ob_1_ege2026.zip';
const FIPI_2025 = 'https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2025/ob_11_2025.zip';

const OFFICIAL_TASKS_13 = [
    { id: '2026-demo', source: FIPI_2026_DEMO, label: 'Демоверсия ЕГЭ-2026',
      choices: ['Совет Федерации', 'Правительство РФ', 'Конституционный Суд РФ'],
      prompts: ['Осуществление мер по поддержке институтов гражданского общества', 'Утверждение изменения границ между субъектами Российской Федерации', 'Разрешение споров о компетенции между высшими государственными органами субъектов Российской Федерации', 'Назначение выборов Президента Российской Федерации', 'Обеспечение функционирования системы социальной защиты инвалидов'], answer: '21312' },
    { id: '2026-open', source: FIPI_2026_OPEN, label: 'Открытый вариант ЕГЭ-2026',
      choices: ['Государственная Дума', 'Правительство РФ', 'Президент РФ'],
      prompts: ['Управление федеральной собственностью', 'Осуществление мер по поддержке добровольческой (волонтёрской) деятельности', 'Принятие федеральных законов', 'Осуществление мер по обеспечению обороны страны', 'Подписание международных договоров Российской Федерации'], answer: '22123' },
    { id: '2027-demo', source: FIPI_2027, label: 'Проект демоверсии ЕГЭ-2027',
      choices: ['Совет Федерации', 'Государственная Дума', 'Конституционный Суд РФ'],
      prompts: ['Назначение на должность Председателя Центрального банка Российской Федерации', 'Утверждение изменения границ между субъектами Российской Федерации', 'Утверждение по представлению Президента Российской Федерации кандидатуры Председателя Правительства Российской Федерации', 'Разрешение споров о компетенции между федеральными органами государственной власти', 'Назначение выборов Президента Российской Федерации'], answer: '21231' }
];

const OFFICIAL_TASKS_23 = [
    { id: '2026-demo', source: FIPI_2026_DEMO, label: 'Демоверсия ЕГЭ-2026',
      question: 'Объясните по Конституции РФ: приоритет прав и свобод человека; федерализм; социальную направленность политики государства.',
      points: ['Человек, его права и свободы являются высшей ценностью, а их признание, соблюдение и защита — обязанность государства.', 'РФ состоит из субъектов; разграничение предметов ведения и полномочий между федеральными органами и органами субъектов закреплено Конституцией.', 'Политика РФ направлена на создание условий для достойной жизни и свободного развития человека, в том числе через социальную поддержку.'] },
    { id: '2026-open', source: FIPI_2026_OPEN, label: 'Открытый вариант ЕГЭ-2026',
      question: 'Приведите три объяснения того, как Конституция РФ закрепляет условия реализации права каждого на труд.',
      points: ['Труд свободен: каждый вправе распоряжаться способностями к труду и выбирать род деятельности и профессию.', 'Принудительный труд запрещён, поэтому человек не может быть принуждён к работе вне установленных законом случаев.', 'Каждый имеет право на труд в условиях, отвечающих требованиям безопасности и гигиены, и на вознаграждение без дискриминации.'] },
    { id: '2025-demo', source: FIPI_2025, label: 'Демоверсия ЕГЭ-2025',
      question: 'Объясните по Конституции РФ три характеристики государства: республика; демократия; многообразие форм собственности.',
      points: ['Президент как глава государства избирается гражданами на установленный срок, а не наследует свою должность.', 'Носителем суверенитета и единственным источником власти в РФ является её многонациональный народ.', 'Частная, государственная, муниципальная и иные формы собственности в РФ признаются и защищаются равным образом.'] },
    { id: '2027-demo', source: FIPI_2027, label: 'Проект демоверсии ЕГЭ-2027',
      question: 'Объясните по Конституции РФ три характеристики государства: суверенное; с многообразием форм собственности; гарантирующее поддержку в сложных жизненных ситуациях.',
      points: ['Суверенитет РФ распространяется на всю её территорию; Конституция и федеральные законы имеют верховенство на всей территории страны.', 'В РФ признаются и защищаются равным образом частная, государственная, муниципальная и иные формы собственности.', 'Каждому гарантируется право на получение квалифицированной юридической помощи, что помогает защитить права в сложной ситуации.'] }
];

const officialExamState = { task13: 0, task23: 0, correct13: 0, checked13: false, shown23: false };

function revealTrainerFeedback(selector) {
    const element = $(selector);
    if (element) requestAnimationFrame(() => element.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
}

function renderOfficial13() {
    const task = OFFICIAL_TASKS_13[officialExamState.task13];
    const previous = getTrainingSession('task13');
    const savedAnswers = previous?.index === officialExamState.task13 && Array.isArray(previous.answers) ? previous.answers : [];
    officialExamState.checked13 = false;
    $('#questionText').textContent = `${task.label}. Установите соответствие: к каждой позиции А–Д подберите цифру органа.`;
    $('#official13Choices').innerHTML = task.choices.map((choice, index) => `<p><strong>${index + 1}</strong> — ${escapeHTML(choice)}</p>`).join('');
    const rows = $('#official13Rows');
    rows.innerHTML = '';
    task.prompts.forEach((prompt, index) => {
        const row = document.createElement('label');
        row.className = 'official13-row';
        const span = document.createElement('span');
        span.textContent = `${'АБВГД'[index]}) ${prompt}`;
        const select = document.createElement('select');
        select.setAttribute('aria-label', `Ответ для позиции ${'АБВГД'[index]}`);
        select.innerHTML = '<option value="">—</option>' + task.choices.map((_, number) => `<option value="${number + 1}">${number + 1}</option>`).join('');
        select.value = savedAnswers[index] || '';
        select.addEventListener('change', () => saveTrainingSession('task13', { index: officialExamState.task13, correct: officialExamState.correct13, answers: $$('#official13Rows select').map(item => item.value) }));
        row.append(span, select);
        rows.append(row);
    });
    $('#gameFeedback').innerHTML = `<a href="${task.source}" target="_blank" rel="noopener">Источник: ${task.label}, ФИПИ</a>`;
    $('#checkGameAnswerBtn').hidden = false;
    $('#nextGameQuestionBtn').hidden = true;
    saveTrainingSession('task13', { index: officialExamState.task13, correct: officialExamState.correct13, answers: savedAnswers });
}

function checkOfficial13() {
    if (officialExamState.checked13) return;
    const selects = $$('#official13Rows select');
    if (selects.some(select => !select.value)) { showToast('Заполните все пять позиций'); return; }
    const task = OFFICIAL_TASKS_13[officialExamState.task13];
    const given = selects.map(select => select.value).join('');
    const mistakes = [...given].filter((digit, index) => digit !== task.answer[index]).length;
    const points = mistakes === 0 ? 2 : mistakes === 1 ? 1 : 0;
    if (mistakes === 0) officialExamState.correct13++;
    recordTrainingResult('task13', points, 2);
    selects.forEach((select, index) => { select.disabled = true; select.classList.add(given[index] === task.answer[index] ? 'correct' : 'wrong'); });
    $('#gameFeedback').innerHTML = `<strong>${points} из 2 баллов. Верный ответ: ${task.answer}.</strong> <a href="${task.source}" target="_blank" rel="noopener">Источник ФИПИ</a>`;
    $('#currentScore').textContent = officialExamState.correct13;
    $('#checkGameAnswerBtn').hidden = true;
    $('#nextGameQuestionBtn').hidden = false;
    officialExamState.checked13 = true;
    clearTrainingSession('task13');
    revealTrainerFeedback('#gameFeedback');
}

function renderOfficial23() {
    const task = OFFICIAL_TASKS_23[officialExamState.task23];
    const previous = getTrainingSession('task23');
    const savedAnswers = previous?.index === officialExamState.task23 && Array.isArray(previous.answers) ? previous.answers : [];
    officialExamState.shown23 = false;
    $('#task23Question').textContent = task.question;
    $('#task23Options').innerHTML = [1, 2, 3].map(number => `<label class="official23-answer">Объяснение ${number}<textarea rows="3" aria-label="Объяснение ${number}" placeholder="Запишите развёрнутый ответ своими словами"></textarea></label>`).join('');
    $$('#task23Options textarea').forEach((textarea, index) => {
        textarea.value = savedAnswers[index] || '';
        textarea.addEventListener('input', debounce(() => saveTrainingSession('task23', { index: officialExamState.task23, answers: $$('#task23Options textarea').map(item => item.value) }), 250));
    });
    $('#task23Feedback').innerHTML = `<a href="${task.source}" target="_blank" rel="noopener">Источник: ${task.label}, ФИПИ</a>`;
    $('#checkTask23Btn').hidden = false;
    $('#nextTask23Btn').style.display = 'none';
    saveTrainingSession('task23', { index: officialExamState.task23, answers: savedAnswers });
}

function showOfficial23Model() {
    if (officialExamState.shown23) return;
    const task = OFFICIAL_TASKS_23[officialExamState.task23];
    $('#task23Feedback').innerHTML = `<strong>Ориентиры ответа (возможны другие верные формулировки):</strong><ol>${task.points.map(point => `<li>${escapeHTML(point)}</li>`).join('')}</ol><label>Сколько своих объяснений вы считаете верными? <select id="official23SelfScore" aria-label="Самооценка задания 23"><option value="">Выберите</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label><p><a href="${task.source}" target="_blank" rel="noopener">Открыть исходный вариант ФИПИ</a></p>`;
    let scored = false;
    $('#official23SelfScore').addEventListener('change', event => {
        if (event.target.value !== '' && !scored) {
            recordTrainingResult('task23', Number(event.target.value), 3);
            scored = true;
            event.target.disabled = true;
        }
    });
    $('#checkTask23Btn').hidden = true;
    $('#nextTask23Btn').style.display = 'inline-block';
    officialExamState.shown23 = true;
    clearTrainingSession('task23');
    revealTrainerFeedback('#task23Feedback');
}

function initOfficialExam() {
    safeAddListener('#gameBtn', 'click', () => {
        const session = getTrainingSession('task13');
        officialExamState.task13 = Number.isInteger(session?.index) && OFFICIAL_TASKS_13[session.index] ? session.index : 0;
        officialExamState.correct13 = Number(session?.correct) || 0;
        $('#currentScore').textContent = officialExamState.correct13;
        $('#highScore').textContent = loadTrainingResults().task13?.best || 0;
        $('#gameStartScreen').hidden = Boolean(session);
        $('#gamePlayScreen').hidden = !session;
        if (session) renderOfficial13();
        $('#gameDialog').showModal();
    });
    safeAddListener('#closeGame', 'click', () => $('#gameDialog').close());
    safeAddListener('#startGameBtn', 'click', () => { $('#gameStartScreen').hidden = true; $('#gamePlayScreen').hidden = false; renderOfficial13(); });
    safeAddListener('#checkGameAnswerBtn', 'click', checkOfficial13);
    safeAddListener('#nextGameQuestionBtn', 'click', () => { officialExamState.task13 = (officialExamState.task13 + 1) % OFFICIAL_TASKS_13.length; renderOfficial13(); });
    safeAddListener('#resetPowerGameSession', 'click', () => { clearTrainingSession('task13'); officialExamState.task13 = 0; officialExamState.correct13 = 0; $('#currentScore').textContent = 0; renderOfficial13(); });
    safeAddListener('#resetHighscoreBtn', 'click', () => $('#resetHighscoreDialog')?.showModal());
    safeAddListener('#cancelResetHighscore', 'click', () => $('#resetHighscoreDialog')?.close());
    safeAddListener('#confirmResetHighscore', 'click', () => { const results = loadTrainingResults(); delete results.task13; localStorage.setItem(LS.TRAINING_RESULTS, JSON.stringify(results)); $('#highScore').textContent = 0; $('#resetHighscoreDialog')?.close(); });
    safeAddListener('#game23Btn', 'click', () => { const session = getTrainingSession('task23'); officialExamState.task23 = Number.isInteger(session?.index) && OFFICIAL_TASKS_23[session.index] ? session.index : 0; renderOfficial23(); $('#game23Dialog').showModal(); });
    safeAddListener('#closeGame23', 'click', () => $('#game23Dialog').close());
    safeAddListener('#resetGame23', 'click', () => { clearTrainingSession('task23'); officialExamState.task23 = 0; renderOfficial23(); });
    safeAddListener('#checkTask23Btn', 'click', showOfficial23Model);
    safeAddListener('#nextTask23Btn', 'click', () => { officialExamState.task23 = (officialExamState.task23 + 1) % OFFICIAL_TASKS_23.length; renderOfficial23(); });
}
