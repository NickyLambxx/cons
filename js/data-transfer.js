/* PrepMate: data-transfer.js */
const TRANSFER_STATUS_CODES = { learning: 'l', review: 'r', mastered: 'm' };
const TRANSFER_STATUS_VALUES = { l: 'learning', r: 'review', m: 'mastered' };
const TRANSFER_RESULT_NAMES = ['task13', 'task23', 'mixed', 'findError'];
const FULL_BACKUP_KEYS = [LS.THEME, LS.FAVORITES, LS.FAV_FOLDERS, LS.ARTICLE_FOLDERS, LS.NOTES, LS.FONT, LS.FONT_TYPE, LS.HIGHSCORE, LS.SEARCH, LS.SEARCH_SCOPE, LS.PROGRESS, LS.ARTICLE_STATUS, LS.TRAINING_SESSIONS, LS.TRAINING_RESULTS, LS.MOBILE_PINNED];

function compactArticleId(id) {
    const match = String(id || '').match(/^art(\d+(?:[.-]\d+)?)$/);
    return match ? match[1] : String(id || '');
}

function expandArticleId(id) {
    return String(id).startsWith('art') ? String(id) : `art${id}`;
}

function encodeTransferData() {
    const read = Object.keys(state.progress).filter(id => state.progress[id]).map(compactArticleId);
    const favorites = [...state.favorites].map(compactArticleId);
    const statuses = { l: [], r: [], m: [] };
    Object.entries(state.articleStatuses).forEach(([id, status]) => {
        const code = TRANSFER_STATUS_CODES[status];
        if (code) statuses[code].push(compactArticleId(id));
    });
    const highscore = Number.parseInt(localStorage.getItem(LS.HIGHSCORE) || '0', 10) || 0;
    const results = loadTrainingResults();
    const scores = TRANSFER_RESULT_NAMES.map(name => `${Math.max(0, Number(results[name]?.best) || 0)}.${Math.max(0, Number(results[name]?.attempts) || 0)}.${Math.max(0, Number(results[name]?.bestTotal) || 0)}`).join(',');
    return `1~r:${read.join(',')}~l:${statuses.l.join(',')}~w:${statuses.r.join(',')}~m:${statuses.m.join(',')}~f:${favorites.join(',')}~h:${highscore}~t:${scores}`;
}

function decodeTransferData(encoded) {
    const [version, ...parts] = encoded.split('~');
    if (version !== '1') throw new Error('Неподдерживаемый формат переноса');
    const values = Object.fromEntries(parts.map(part => {
        const separator = part.indexOf(':');
        return [part.slice(0, separator), part.slice(separator + 1)];
    }));
    const list = key => (values[key] || '').split(',').filter(id => /^\d+(?:[.-]\d+)?$/.test(id));
    const statuses = [
        ...list('l').map(id => [id, 'l']),
        ...list('w').map(id => [id, 'r']),
        ...list('m').map(id => [id, 'm'])
    ];
    const scores = (values.t || '').split(',').map(pair => pair.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/)).map(match => match ? { best: Number(match[1]), attempts: Number(match[2]), bestTotal: Number(match[3] || 0) } : null);
    return { v: 1, r: list('r'), s: statuses, f: list('f'), h: Math.max(0, Number.parseInt(values.h || '0', 10) || 0), t: scores };
}

function getTransferUrl() {
    return `${location.origin}${location.pathname}?transfer=${encodeTransferData()}`;
}

async function renderProgressQr() {
    const canvas = $('#progressTransferQr');
    const status = $('#progressTransferStatus');
    const linkField = $('#progressTransferLink');
    if (!canvas || !status || !linkField) return;
    const url = getTransferUrl();
    linkField.value = url;
    status.textContent = 'Создаём QR-код…';
    try {
        if (!window.PrepMateQRCode?.toCanvas) throw new Error('Генератор QR-кода не загрузился');
        await window.PrepMateQRCode.toCanvas(canvas, url, {
            width: 420,
            margin: 2,
            errorCorrectionLevel: 'L',
            color: { dark: '#111827', light: '#ffffff' }
        });
        status.textContent = 'Отсканируйте QR обычной камерой второго устройства.';
    } catch (error) {
        status.textContent = 'QR-код не создался. Скопируйте ссылку ниже.';
        console.warn('Ошибка создания QR:', error);
    }
}

function applyTransferredProgress(payload) {
    const currentProgress = (() => {
        try { return JSON.parse(localStorage.getItem(LS.PROGRESS) || '{}'); } catch (_) { return {}; }
    })();
    payload.r.forEach(id => { currentProgress[expandArticleId(id)] = 1; });

    const currentStatuses = (() => {
        try { return JSON.parse(localStorage.getItem(LS.ARTICLE_STATUS) || '{}'); } catch (_) { return {}; }
    })();
    payload.s.forEach(([id, code]) => {
        if (TRANSFER_STATUS_VALUES[code]) currentStatuses[expandArticleId(id)] = TRANSFER_STATUS_VALUES[code];
    });

    const currentFavorites = (() => {
        try { return new Set(JSON.parse(localStorage.getItem(LS.FAVORITES) || '[]')); } catch (_) { return new Set(); }
    })();
    payload.f.forEach(id => currentFavorites.add(expandArticleId(id)));

    localStorage.setItem(LS.PROGRESS, JSON.stringify(currentProgress));
    localStorage.setItem(LS.ARTICLE_STATUS, JSON.stringify(currentStatuses));
    localStorage.setItem(LS.FAVORITES, JSON.stringify([...currentFavorites]));
    const currentHighscore = Number.parseInt(localStorage.getItem(LS.HIGHSCORE) || '0', 10) || 0;
    localStorage.setItem(LS.HIGHSCORE, String(Math.max(currentHighscore, payload.h || 0)));
    const results = loadTrainingResults();
    TRANSFER_RESULT_NAMES.forEach((name, index) => {
        const incoming = payload.t?.[index];
        if (!incoming) return;
        const previous = results[name] || {};
        results[name] = { ...previous, best: Math.max(Number(previous.best) || 0, incoming.best), attempts: Math.max(Number(previous.attempts) || 0, incoming.attempts), bestTotal: Math.max(Number(previous.bestTotal) || 0, incoming.bestTotal) };
    });
    localStorage.setItem(LS.TRAINING_RESULTS, JSON.stringify(results));
}

function exportFullBackup() {
    const data = Object.fromEntries(FULL_BACKUP_KEYS.map(key => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null));
    const backup = { format: 'PrepMate-full-backup', version: 1, createdAt: new Date().toISOString(), data };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `prepmate-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function mergeBackupObject(key, incomingText) {
    const incoming = JSON.parse(incomingText);
    let existing;
    try { existing = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { existing = {}; }
    if (key === LS.FAVORITES || key === LS.FAV_FOLDERS || key === LS.SEARCH || key === LS.MOBILE_PINNED) {
        return JSON.stringify([...new Set([...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])])]);
    }
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error(`Повреждены данные: ${key}`);
    if (key === LS.PROGRESS) return JSON.stringify({ ...existing, ...incoming });
    if (key === LS.TRAINING_RESULTS) {
        const merged = { ...existing };
        Object.entries(incoming).forEach(([name, value]) => {
            const current = existing[name] || {};
            merged[name] = { ...current, ...value, best: Math.max(Number(current.best) || 0, Number(value.best) || 0), attempts: Math.max(Number(current.attempts) || 0, Number(value.attempts) || 0) };
        });
        return JSON.stringify(merged);
    }
    if (key === LS.TRAINING_SESSIONS) {
        const merged = { ...existing };
        Object.entries(incoming).forEach(([name, value]) => { if ((Number(value?.savedAt) || 0) > (Number(existing[name]?.savedAt) || 0)) merged[name] = value; });
        return JSON.stringify(merged);
    }
    return JSON.stringify({ ...existing, ...incoming });
}

async function importFullBackup(file) {
    if (!file || file.size > 5_000_000) throw new Error('Выберите JSON-файл резервной копии размером до 5 МБ');
    const backup = JSON.parse(await file.text());
    if (backup?.format !== 'PrepMate-full-backup' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') throw new Error('Это не резервная копия PrepMate');
    if (!window.confirm('Объединить данные из файла с данными на этом устройстве? Заметки с одинаковыми статьями будут заменены из файла.')) return false;
    const merged = {};
    FULL_BACKUP_KEYS.forEach(key => {
        const value = backup.data[key];
        if (typeof value !== 'string') return;
        merged[key] = [LS.FAVORITES, LS.FAV_FOLDERS, LS.ARTICLE_FOLDERS, LS.NOTES, LS.SEARCH, LS.PROGRESS, LS.ARTICLE_STATUS, LS.TRAINING_SESSIONS, LS.TRAINING_RESULTS, LS.MOBILE_PINNED].includes(key)
            ? mergeBackupObject(key, value) : value;
    });
    Object.entries(merged).forEach(([key, value]) => localStorage.setItem(key, value));
    location.reload();
    return true;
}

function initProgressTransfer() {
    const openTransfer = () => {
        const dialog = $('#progressTransferDialog');
        if (!dialog) return;
        dialog.showModal();
        const results = loadTrainingResults();
        const names = { task13: '№13', task23: '№23 (самооценка)', mixed: 'Микс', findError: 'Исправь утверждение' };
        const summary = $('#trainingResultsSummary');
        if (summary) {
            summary.replaceChildren();
            Object.entries(names).forEach(([key, label]) => {
                const row = document.createElement('div');
                row.textContent = `${label}: ${results[key]?.attempts || 0} попыток, лучший ${results[key]?.best || 0}/${results[key]?.bestTotal || '—'}`;
                summary.append(row);
            });
        }
        renderProgressQr();
    };
    safeAddListener('#progressTransferBtn', 'click', openTransfer);
    safeAddListener('#mobileProgressTransfer', 'click', () => {
        const sheet = $('#mobileToolsSheet');
        if (sheet) sheet.hidden = true;
        openTransfer();
    });
    safeAddListener('#closeProgressTransfer', 'click', () => $('#progressTransferDialog')?.close());
    safeAddListener('#exportFullBackup', 'click', exportFullBackup);
    safeAddListener('#importFullBackup', 'change', async event => {
        try { await importFullBackup(event.target.files?.[0]); }
        catch (error) { showToast(error.message || 'Не удалось импортировать файл'); }
        event.target.value = '';
    });
    safeAddListener('#copyProgressTransfer', 'click', async () => {
        const link = $('#progressTransferLink')?.value || getTransferUrl();
        try {
            await navigator.clipboard.writeText(link);
            showToast('Ссылка переноса скопирована');
        } catch (_) {
            const field = $('#progressTransferLink');
            field?.focus(); field?.select();
            showToast('Выделили ссылку — скопируйте её');
        }
    });

    const encoded = new URLSearchParams(location.search).get('transfer');
    if (!encoded) return;
    try {
        const payload = decodeTransferData(encoded);
        const readCount = payload.r.length;
        const favoriteCount = payload.f.length;
        $('#transferImportSummary').textContent = `Найдено: прочитано ${readCount}, статусов ${payload.s.length}, избранных ${favoriteCount}, результатов тренировок — ${payload.t?.filter(Boolean).length || 0}. Данные будут объединены с текущими.`;
        const dialog = $('#transferImportDialog');
        if (dialog) dialog.showModal();
        safeAddListener('#confirmTransferImport', 'click', () => {
            applyTransferredProgress(payload);
            history.replaceState(null, '', location.pathname + location.hash);
            $('#transferImportDialog')?.close();
            showToast('Прогресс перенесён');
            setTimeout(() => location.reload(), 600);
        });
        safeAddListener('#cancelTransferImport', 'click', () => {
            history.replaceState(null, '', location.pathname + location.hash);
            $('#transferImportDialog')?.close();
        });
    } catch (error) {
        history.replaceState(null, '', location.pathname + location.hash);
        showToast('Ссылка переноса повреждена');
        console.warn('Ошибка импорта прогресса:', error);
    }
}
