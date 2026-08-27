export function loading(show) {
    document.getElementById('loading').style.display = (show ? 'flex' : 'none');
    if (show) {
        updateProgress(0, 1);
    }
}

export function updateProgress(current, total) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    const fill = document.getElementById('progress-bar-fill');
    const text = document.getElementById('progress-text');
    if (fill) fill.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
}
