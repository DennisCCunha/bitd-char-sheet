

/**
 * SaveAndLoad is a utility class for encoding, decoding, saving, and loading
 * character state to and from localStorage. It provides methods for handling
 * both singular character data and general key-value storage.
 */
export default class SaveAndLoad {
    static KEY = 'DungeonWorld2024';
    static CHARACTER_KEY = 'dw_sheet_code';

    static encodeState(value, key = SaveAndLoad.KEY) {
        const bytes = new TextEncoder().encode(JSON.stringify(value));
        const keyBytes = new TextEncoder().encode(key);
        const xored = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            xored[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        }
        let binary = '';
        for (let i = 0; i < xored.length; i++) binary += String.fromCharCode(xored[i]);
        return btoa(binary);
    }

    static encodeState(state) {
        const key = SaveAndLoad.KEY;
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

    static decodeState(code, key = SaveAndLoad.KEY) {
        const keyBytes = new TextEncoder().encode(key);
        const binary = atob(code);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const xored = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) xored[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        return JSON.parse(new TextDecoder().decode(xored));
    }

    static save(itemKey, value, storage = localStorage) {
        storage.setItem(itemKey, SaveAndLoad.encodeState(value));
    }

    static load(itemKey, storage = localStorage) {
        const saved = storage.getItem(itemKey);
        return saved === null ? null : SaveAndLoad.decodeState(saved);
    }

    static remove(itemKey, storage = localStorage) {
        storage.removeItem(itemKey);
    }

    static clear(itemKeys, storage = localStorage) {
        itemKeys.forEach((itemKey) => SaveAndLoad.remove(itemKey, storage));
    }

    /** Serialises the Character model and persists it to localStorage. */
    static autoSave(Model, character, itemKey = SaveAndLoad.CHARACTER_KEY) {
        try {
            SaveAndLoad.save(itemKey, Model.toState(character));
        } catch (e) { console.error('Falha ao salvar ficha:', e); }
    }

    /** Loads from localStorage and returns a hydrated instance of the Model, or null if nothing is saved. */
    static autoLoad(Model, itemKey = SaveAndLoad.CHARACTER_KEY) {
        try {
            const state = SaveAndLoad.load(itemKey);
            return state === null ? null : Model.fromState(state);
        } catch (e) {
            console.warn('Falha ao restaurar ficha:', e);
            return null;
        }
    }

    static clearState(itemKey = SaveAndLoad.CHARACTER_KEY) {
        try {
            SaveAndLoad.remove(itemKey);
        } catch (e) { /* silent */ }

        try {
            SaveAndLoad.remove(itemKey, sessionStorage);
        } catch (e) { /* silent */ }
    }

    static allLocalStorage() {
        return Object.fromEntries(Object.entries(localStorage));
    }
}