// Quill loader + textarea replacement helper.
// Loads Quill assets once from CDN, then swaps textareas for rich text editors.
// Keeps the original textarea (hidden) in sync so save/load flows keep working.

const QUILL_CSS = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
const QUILL_JS = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';

let quillPromise = null;

function loadQuill() {
    if (quillPromise) return quillPromise;

    quillPromise = new Promise((resolve, reject) => {
        if (window.Quill) return resolve(window.Quill);

        if (!document.querySelector(`link[href="${QUILL_CSS}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = QUILL_CSS;
            document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = QUILL_JS;
        script.onload = () => resolve(window.Quill);
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return quillPromise;
}

/**
 * Replaces a textarea with a Quill editor.
 * The textarea stays in the DOM (visually hidden) and is kept in sync both ways:
 * - Quill -> textarea on every edit (so DOM reads and input events keep working)
 * - textarea -> Quill when value is set programmatically (populateDOM)
 */
export async function enhanceTextarea(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea || textarea.dataset.quillEnhanced) return null;

    const Quill = await loadQuill();
    if (!Quill) return null;

    textarea.dataset.quillEnhanced = 'true';

    const container = document.createElement('div');
    container.className = 'quill-editor';
    container.id = `${textareaId}-quill`;
    textarea.insertAdjacentElement('afterend', container);
    textarea.style.display = 'none';

    const quill = new Quill(container, {
        theme: 'snow',
        placeholder: textarea.placeholder || '',
    });

    if (textarea.value) {
        quill.clipboard.dangerouslyPasteHTML(textarea.value);
    }

    quill.on('text-change', () => {
        const html = quill.getSemanticHTML();
        const isEmpty = quill.getText().trim().length === 0;
        textarea.value = isEmpty ? '' : html;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Sync programmatic sets: intercept value property assignment
    const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    Object.defineProperty(textarea, 'value', {
        get() { return descriptor.get.call(this); },
        set(v) {
            descriptor.set.call(this, v);
            const current = quill.getSemanticHTML();
            if (v !== current && !(v === '' && quill.getText().trim().length === 0)) {
                quill.setContents([]);
                if (v) quill.clipboard.dangerouslyPasteHTML(v);
            }
        },
        configurable: true,
    });

    return quill;
}

export default { enhanceTextarea };
