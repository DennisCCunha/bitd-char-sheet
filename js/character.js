export default class Character {
    
    constructor() {
        this.nome        = '';
        this.alcunha     = '';
        this.playbook    = '';
        this.stress      = 0;
        this.trauma      = 0;
        this.playbookXP  = 0;
        this.espertezaXP  = 0;
        this.destrezaXP   = 0;
        this.conviccaoXP  = 0;
        this.bando       = '';
        this.aparencia   = '';
        this.vicios      = '';
        this.raizes      = '';
        this.historia    = '';
        this.notas       = '';

        this.inputs = {};

        this.amigos = [];

        this.amigo = {
            nome: '',
            descricao: '',
            status: true,
        };

        // Acoes vão de 0 até 4
        this.acoes = {
            Adulterar: 0,
            Brigar: 0,
            Caçar: 0,
            Comandar: 0,
            Convencer: 0,
            Detonar: 0,
            Esgueirar: 0,
            Estudar: 0,
            Sintonizar: 0,
            Socializar: 0,
            Sondar: 0,
            Sutileza: 0
        };

        this.atributoAcao = {
            "convicção": ["comandar", "convencer", "sintonizar","socializar"],
            "destreza"  : ["brigar", "detonar", "esgueirar", "sutileza"],
            "esperteza" : ["adulterar", "caçar", "estudar", "sondar"]
        };

        this.bonds = [];
    }

    // ─── Serialisation ────────────────────────────────────────────────────────
    // Keys in fromState/toState intentionally match the DOM element IDs so that
    // Character is the single bridge between the UI and persistent storage.

    static fromState(state) {
        const c = new Character();
        if (!state) return c;
        Object.assign(c, state);
        if (typeof state.inputs === 'string') {
            try { c.inputs = JSON.parse(state.inputs); } catch { c.inputs = {}; }
        }
        if (typeof state.amigos === 'string') {
            try { c.amigos = JSON.parse(state.amigos); } catch { c.amigos = []; }
        }
        if (typeof state.acoes === 'string') {
            try { c.acoes = JSON.parse(state.acoes); } catch { c.acoes = {}; }
        }
        if (typeof state.bonds === 'string') {
            try { c.bonds = JSON.parse(state.bonds); } catch { c.bonds = []; }
        }
        return c;
    }

    static toState(c) {
        const state = {
            nome: c.nome,
            alcunha: c.alcunha,
            playbook: c.playbook,
            stress: c.stress,
            trauma: c.trauma,
            playbookXP: c.playbookXP,
            espertezaXP: c.espertezaXP,
            destrezaXP: c.destrezaXP,
            conviccaoXP: c.conviccaoXP,
            bando: c.bando,
            aparencia: c.aparencia,
            vicios: c.vicios,
            raizes: c.raizes,
            historia: c.historia,
            notas: c.notas,
            inputs: JSON.stringify(c.inputs || {}),
            amigos: JSON.stringify(c.amigos || []),
            acoes: JSON.stringify(c.acoes || {}),
            bonds: JSON.stringify(c.bonds || [])
        };

        return state;
    }

    static fromJSON(json) {
        const c = new Character();
        Object.assign(c, json);
        return c;
    }

    static toJSON(char) {
        return JSON.stringify(char);
    }

    static getPlaybooks() {
         
    }

}
