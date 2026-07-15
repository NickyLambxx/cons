/* PrepMate: data-transfer.js */
const TRANSFER_STATUS_CODES = { learning: 'l', review: 'r', mastered: 'm' };
const TRANSFER_STATUS_VALUES = { l: 'learning', r: 'review', m: 'mastered' };

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
    return `1~r:${read.join(',')}~l:${statuses.l.join(',')}~w:${statuses.r.join(',')}~m:${statuses.m.join(',')}~f:${favorites.join(',')}~h:${highscore}`;
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
    return { v: 1, r: list('r'), s: statuses, f: list('f'), h: Math.max(0, Number.parseInt(values.h || '0', 10) || 0) };
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
}

function initProgressTransfer() {
    const openTransfer = () => {
        const dialog = $('#progressTransferDialog');
        if (!dialog) return;
        dialog.showModal();
        renderProgressQr();
    };
    safeAddListener('#progressTransferBtn', 'click', openTransfer);
    safeAddListener('#mobileProgressTransfer', 'click', () => {
        const sheet = $('#mobileToolsSheet');
        if (sheet) sheet.hidden = true;
        openTransfer();
    });
    safeAddListener('#closeProgressTransfer', 'click', () => $('#progressTransferDialog')?.close());
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
        $('#transferImportSummary').textContent = `Найдено: прочитано ${readCount}, статусов ${payload.s.length}, избранных ${favoriteCount}, рекорд №13 — ${payload.h || 0}. Данные будут объединены с текущими.`;
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
