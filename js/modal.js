/** Controls creation, opening and closing of all modals on the page. */
export default class Modal {
    constructor(containerId = 'modalsContainer') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            document.body.appendChild(this.container);
        }
        this.modals = new Map();
    }

    /**
     * Creates a modal and registers it for later open/close calls.
     * @param {Object} options
     * @param {string} options.id - Unique id for the modal overlay.
     * @param {string} [options.title] - Optional heading text.
     * @param {HTMLElement} options.body - Element containing the modal's content and its own interactions.
     * @param {Array<{label: string, className?: string, onClick?: Function, closeOnClick?: boolean}>} [options.buttons] - Extra action buttons.
     * @param {boolean} [options.closable=true] - Whether a default "Fechar" button is added.
     */
    create({ id, title, body, buttons = [], closable = true }) {
        this.remove(id);

        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'dw-overlay';
        overlay.style.display = 'none';

        const box = document.createElement('div');
        box.className = 'dw-modal';

        if (title) {
            const heading = document.createElement('h3');
            heading.textContent = title;
            box.appendChild(heading);
        }

        if (body instanceof HTMLElement) {
            box.appendChild(body);
        }

        const actions = document.createElement('div');
        actions.className = 'dw-modal-actions';

        buttons.forEach(({ label, className = '', onClick, closeOnClick = true }) => {
            const button = document.createElement('button');
            button.textContent = label;
            if (className) button.className = className;
            button.addEventListener('click', (event) => {
                if (typeof onClick === 'function') onClick(event, this);
                if (closeOnClick) this.close(id);
            });
            actions.appendChild(button);
        });

        if (closable) {
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Fechar';
            closeButton.className = 'secondary';
            closeButton.addEventListener('click', () => this.close(id));
            actions.appendChild(closeButton);
        }

        box.appendChild(actions);
        overlay.appendChild(box);
        this.container.appendChild(overlay);
        this.modals.set(id, overlay);
        return overlay;
    }

    open(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (modal) modal.style.display = 'flex';
    }

    close(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }

    remove(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (modal) modal.remove();
        this.modals.delete(id);
    }
}