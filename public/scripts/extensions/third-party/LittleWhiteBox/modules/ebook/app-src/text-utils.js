export function escapeHtml(value = '') {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

export function safeJsonParse(text, fallback = {}) {
    try {
        return JSON.parse(text || '{}');
    } catch {
        return fallback;
    }
}

export function safeJsonStringify(value) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value || '');
    }
}

export function trimInlineText(value = '', limit = 800) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
}
