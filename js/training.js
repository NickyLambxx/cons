/* PrepMate: training.js */
function setNumberedButtonContent(button, text, index) {
    button.textContent = '';
    const number = document.createElement('span');
    number.className = 'answer-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1);
    button.append(number, document.createTextNode(text));
}

let trainingKeyboardInitialized = false;
function initTrainingKeyboardShortcuts() {
    if (trainingKeyboardInitialized) return;
    trainingKeyboardInitialized = true;
    document.addEventListener('keydown', event => {
        if (!/^[1-5]$/.test(event.key) || event.ctrlKey || event.altKey || event.metaKey) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
        const index = Number(event.key) - 1;
        const openDialog = [['#mixedTrainingDialog', '.mixed-answer'], ['#findErrorDialog', '.mixed-answer']]
            .find(([selector]) => $(selector)?.open);
        if (!openDialog) return;
        const button = $$(openDialog[1], $(openDialog[0]))[index];
        if (button && !button.disabled && !button.hidden) { event.preventDefault(); button.click(); }
    });
}

/* --- FLASHCARDS --- */
const flashcards = {
    terms: [],
    index: 0,
    deck: 'all'
};
const flashcardSwipe = { startX: 0, startY: 0, tracking: false, suppressClick: false, moving: false };

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

function updateFlashcardScrollIndicator() {
    const card = $('#flashcard');
    const back = $('.flashcard .back');
    const indicator = $('#flashcardScrollIndicator');
    const thumb = indicator?.querySelector('span');
    if (!card || !back || !indicator || !thumb) return;

    const overflow = back.scrollHeight > back.clientHeight + 2;
    indicator.hidden = !card.classList.contains('flipped') || !overflow;
    if (indicator.hidden) return;

    const thumbHeight = Math.max(22, Math.round(back.clientHeight / back.scrollHeight * 100));
    const progress = back.scrollTop / Math.max(1, back.scrollHeight - back.clientHeight);
    thumb.style.height = `${thumbHeight}%`;
    thumb.style.top = `${progress * (100 - thumbHeight)}%`;
}

function resetFlashcardScroll() {
    const back = $('.flashcard .back');
    if (back) back.scrollTop = 0;
    requestAnimationFrame(updateFlashcardScrollIndicator);
}

function moveFlashcard(direction) {
    if (flashcardSwipe.moving) return;
    const nextIndex = flashcards.index + direction;
    if (nextIndex < 0 || nextIndex >= flashcards.terms.length) return;
    const card = $('#flashcard');
    if (!card) return;
    flashcardSwipe.moving = true;
    card.classList.remove('flipped');
    card.classList.add(direction > 0 ? 'swipe-next' : 'swipe-prev');
    setTimeout(() => {
        card.classList.remove('swipe-next', 'swipe-prev');
        flashcards.index = nextIndex;
        renderFlashcard();
        flashcardSwipe.moving = false;
    }, 220);
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
    $('.flashcard .back')?.addEventListener('scroll', updateFlashcardScrollIndicator, { passive: true });

    safeAddListener('#fcNext', 'click', () => moveFlashcard(1));
    safeAddListener('#fcPrev', 'click', () => moveFlashcard(-1));

    const card = $('#flashcard');
    card?.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        flashcardSwipe.startX = event.clientX;
        flashcardSwipe.startY = event.clientY;
        flashcardSwipe.tracking = true;
    });
    card?.addEventListener('pointerup', event => {
        if (!flashcardSwipe.tracking) return;
        flashcardSwipe.tracking = false;
        const deltaX = event.clientX - flashcardSwipe.startX;
        const deltaY = event.clientY - flashcardSwipe.startY;
        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
        flashcardSwipe.suppressClick = true;
        moveFlashcard(deltaX < 0 ? 1 : -1);
    });
    card?.addEventListener('pointercancel', () => { flashcardSwipe.tracking = false; });

    safeAddListener('#flashcard', 'click', () => {
        if (flashcardSwipe.suppressClick) {
            flashcardSwipe.suppressClick = false;
            return;
        }
        const card = $('#flashcard');
        card.classList.toggle('flipped');
        card.setAttribute('aria-pressed', String(card.classList.contains('flipped')));
        if (card.classList.contains('flipped')) resetFlashcardScroll();
        else updateFlashcardScrollIndicator();
    });
    safeAddListener('#flashcard', 'keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.currentTarget.click();
    });
}

function renderFlashcard() {
    if (flashcards.terms.length === 0) return;
    const term = flashcards.terms[flashcards.index];
    $('#flashcard')?.setAttribute('aria-pressed', 'false');
    
    $('#fcTerm').textContent = term.charAt(0).toUpperCase() + term.slice(1);
    $('#fcDef').textContent = DICTIONARY[term];
    $('#fcCounter').textContent = `${flashcards.index + 1} / ${flashcards.terms.length}`;

    $('#fcPrev').disabled = flashcards.index === 0;
    $('#fcNext').disabled = flashcards.index === flashcards.terms.length - 1;
    resetFlashcardScroll();
}

/* --- СМЕШАННАЯ ТРЕНИРОВКА --- */
const mixedTraining = { questions: [], index: 0, score: 0, answered: false, transitioning: false };
const POWER_LABELS = { president: 'Президент РФ', sf: 'Совет Федерации', gd: 'Государственная Дума', gov: 'Правительство РФ', ks: 'Конституционный Суд РФ' };

function shuffle(values) { return [...values].sort(() => Math.random() - 0.5); }

function createMixedQuestions() {
    const terms = shuffle(FLASHCARD_TERMS).slice(0, 7).map(term => ({
        type: 'Термины',
        question: `Какое определение соответствует термину «${term}»?`,
        answers: shuffle([DICTIONARY[term], ...shuffle(FLASHCARD_TERMS.filter(item => item !== term)).slice(0, 3).map(item => DICTIONARY[item])]),
        correct: DICTIONARY[term]
    }));
    const corrections = shuffle(FIND_ERROR_TASKS).slice(0, 3).map(task => ({
        type: 'Проверка формулировок',
        question: `Как исправить утверждение: «${task.statement}»?`,
        answers: shuffle(task.options),
        correct: task.options[task.correct]
    }));
    return shuffle([...terms, ...corrections]);
}

function restoreMixedTrainingSession() {
    const session = getTrainingSession('mixed');
    const validQuestions = Array.isArray(session?.questions)
        && session.questions.length > 0
        && session.questions.every(item => item && typeof item.question === 'string' && Array.isArray(item.answers) && typeof item.correct === 'string');
    if (!validQuestions || !Number.isInteger(session.index) || !session.questions[session.index]) return false;
    mixedTraining.questions = session.questions;
    mixedTraining.index = session.index;
    mixedTraining.score = Number.isInteger(session.score) ? Math.max(0, session.score) : 0;
    mixedTraining.transitioning = false;
    return true;
}

function renderMixedQuestion() {
    const item = mixedTraining.questions[mixedTraining.index];
    const answers = $('#mixedAnswers');
    if (!item || !answers) return;
    mixedTraining.answered = false;
    const next = $('#mixedNext');
    next.hidden = true;
    next.disabled = false;
    $('#mixedFeedback').textContent = '';
    $('#mixedType').textContent = item.type;
    $('#mixedCounter').textContent = `${mixedTraining.index + 1} / ${mixedTraining.questions.length}`;
    $('#mixedQuestion').textContent = item.question;
    answers.innerHTML = '';
    item.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mixed-answer';
        button.dataset.answer = answer;
        setNumberedButtonContent(button, answer, index);
        button.addEventListener('click', () => checkMixedAnswer(button, answer));
        answers.append(button);
    });
    saveTrainingSession('mixed', {
        questions: mixedTraining.questions,
        index: mixedTraining.index,
        score: mixedTraining.score
    });
}

function checkMixedAnswer(button, answer) {
    if (mixedTraining.answered || mixedTraining.transitioning) return;
    mixedTraining.answered = true;
    const item = mixedTraining.questions[mixedTraining.index];
    const correct = answer === item.correct;
    if (correct) mixedTraining.score++;
    button.classList.add(correct ? 'correct' : 'wrong');
    $$('#mixedAnswers .mixed-answer').forEach(option => {
        option.disabled = true;
        if (option.dataset.answer === item.correct) option.classList.add('correct');
    });
    const feedback = $('#mixedFeedback');
    feedback.textContent = correct ? 'Верно!' : `Правильный ответ: ${item.correct}`;
    feedback.style.color = correct ? '#22c55e' : '#ef4444';
    const next = $('#mixedNext');
    next.disabled = false;
    next.hidden = false;
    next.textContent = mixedTraining.index === mixedTraining.questions.length - 1 ? 'Показать результат' : 'Следующий вопрос';
    if (typeof revealTrainerFeedback === 'function') revealTrainerFeedback('#mixedFeedback');
}

function initMixedTraining() {
    safeAddListener('#mixedTrainingBtn', 'click', () => {
        const resumed = restoreMixedTrainingSession();
        if (!resumed) {
            mixedTraining.questions = createMixedQuestions();
            mixedTraining.index = 0;
            mixedTraining.score = 0;
            mixedTraining.transitioning = false;
        }
        renderMixedQuestion();
        $('#mixedTrainingDialog').showModal();
        if (resumed) showToast('Смешанная тренировка продолжена');
    });
    safeAddListener('#closeMixedTraining', 'click', () => $('#mixedTrainingDialog').close());
    safeAddListener('#mixedNext', 'click', () => {
        const next = $('#mixedNext');
        if (mixedTraining.transitioning || next.hidden || next.disabled) return;
        mixedTraining.transitioning = true;
        next.disabled = true;
        if (mixedTraining.index === -1) {
            clearTrainingSession('mixed');
            mixedTraining.questions = createMixedQuestions();
            mixedTraining.index = 0;
            mixedTraining.score = 0;
            renderMixedQuestion();
            requestAnimationFrame(() => { mixedTraining.transitioning = false; });
            return;
        }
        if (mixedTraining.index < mixedTraining.questions.length - 1) {
            mixedTraining.index++;
            renderMixedQuestion();
            requestAnimationFrame(() => { mixedTraining.transitioning = false; });
            return;
        }
        $('#mixedType').textContent = 'Результат';
        $('#mixedCounter').textContent = '';
        $('#mixedQuestion').textContent = `${mixedTraining.score} из ${mixedTraining.questions.length}`;
        $('#mixedAnswers').innerHTML = '';
        $('#mixedFeedback').textContent = mixedTraining.score >= 8 ? 'Отличный результат!' : 'Повторите ошибки и попробуйте ещё раз.';
        next.textContent = 'Начать заново';
        next.hidden = false;
        mixedTraining.index = -1;
        recordTrainingResult('mixed', mixedTraining.score, mixedTraining.questions.length);
        clearTrainingSession('mixed');
        requestAnimationFrame(() => { mixedTraining.transitioning = false; next.disabled = false; });
    });
}
