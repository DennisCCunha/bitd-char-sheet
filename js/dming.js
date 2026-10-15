import { mountClocks } from '../clocks/clocks.js';

const STORAGE_KEY = 'bitd_dming_session';
const fields = ['heist-name', 'objective', 'location', 'alert', 'risk', 'effect-note', 'factions', 'notes'];

export default class DmingSheet {
    constructor() {
        this.state = this.#load();
        this.#bindFields();
        this.#bindMatrix();
        this.#bindClear();
        this.clocks = mountClocks(document.getElementById('dming-clocks'), 'bitd_dming_clocks');
    }

    #load() {
        try {
            const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
            return saved && typeof saved === 'object' ? saved : {};
        } catch (error) {
            console.warn('Não foi possível carregar a sessão do narrador.', error);
            return {};
        }
    }

    #bindFields() {
        fields.forEach(field => {
            const element = document.getElementById(`dming-${field}`);
            if (!element) return;
            element.value = this.state[field] || '';
            element.addEventListener('input', () => {
                this.state[field] = element.value;
                this.#save();
            });
        });
    }

    #bindMatrix() {
        const selection = document.getElementById('matrix-selection');
        const positions = ['Controlada', 'Arriscada', 'Desesperada'];
        const effects = ['Extremo', 'Grande', 'Standard', 'Limitado', 'Sem efeito'];
        const savedMatrix = this.state.matrix || {position: 'Arriscada', effect: 'Standard'};
        const saved = positions.includes(savedMatrix.position) && effects.includes(savedMatrix.effect)
            ? savedMatrix
            : {position: 'Arriscada', effect: 'Standard'};
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            const isSelected = cell.dataset.position === saved.position && cell.dataset.effect === saved.effect;
            cell.classList.toggle('selected', isSelected);
            cell.addEventListener('click', () => {
                document.querySelectorAll('.matrix-cell').forEach(item => item.classList.remove('selected'));
                cell.classList.add('selected');
                selection.textContent = `${cell.dataset.position} · ${cell.dataset.effect}`;
                this.state.matrix = {position: cell.dataset.position, effect: cell.dataset.effect};
                this.#save();
            });
        });
        selection.textContent = `${saved.position} · ${saved.effect}`;
    }

    #bindClear() {
        document.getElementById('dming-clear').addEventListener('click', () => {
            if (!window.confirm('Limpar os dados desta sessão e todos os relógios?')) return;
            window.localStorage.removeItem(STORAGE_KEY);
            window.localStorage.removeItem('bitd_dming_clocks');
            window.location.reload();
        });
    }

    #save() {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        const status = document.getElementById('dming-save-status');
        status.textContent = 'Salvo localmente';
    }
}
