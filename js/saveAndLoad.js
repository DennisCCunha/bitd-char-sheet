import Character from './character.js';

export default class SaveAndLoad {

    static encodeState(state) {
        const key = 'DungeonWorld2024';
        const bytes = new TextEncoder().encode(JSON.stringify(state));
        const keyBytes = new TextEncoder().encode(key);
        const xored = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            xored[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        }
        let binary = '';
        for (let i = 0; i < xored.length; i++) binary += String.fromCharCode(xored[i]);
        return btoa(binary);
    }

    static decodeState(code) {
        const key = 'DungeonWorld2024';
        const keyBytes = new TextEncoder().encode(key);
        const binary = atob(code);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const xored = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) xored[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        return JSON.parse(new TextDecoder().decode(xored));
    }

    /** Serialises the Character model and persists it to localStorage. */
    static autoSave(character) {
        try {
            localStorage.setItem('dw_sheet_code', SaveAndLoad.encodeState(Character.toState(character)));
        } catch (e) { console.error('Falha ao salvar ficha:', e); }
    }

    /** Loads from localStorage and returns a hydrated Character, or null if nothing is saved. */
    static autoLoad() {
        const saved = localStorage.getItem('dw_sheet_code');
        if (!saved) return null;
        try {
            return Character.fromState(SaveAndLoad.decodeState(saved));
        } catch (e) {
            console.warn('Falha ao restaurar ficha:', e);
            return null;
        }
    }

    static clearState() {
        try {
            localStorage.removeItem('dw_sheet_code');
        } catch (e) { /* silent */ }

        // Limpar sessionStorage
        try {
            sessionStorage.removeItem('dw_sheet_code');
        } catch (e) { /* silent */ }
    }

}