import ruleset from "../data/blades.json" with { type: "json" };
import SaveAndLoad from './saveAndLoad.js';
import Character from './character.js';
import Modal from './modal.js';
import Banner from '../banner/banner.js';


class CharacterSheet {

    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.#init();
            this.SaveAndLoad = SaveAndLoad;
            this.Character = new Character();
        });
    }

    // ─── Initialisation ───────────────────────────────────────────────────────

    #init() {
        this.ruleset = ruleset;
        this.character = new Character();
        this.modal = new Modal('modalsContainer');

        this.#registerModals();
        this.#registerEvents();
        this.#saveAndLoadButtons();
        this.#startup();
    }

    #saveAndLoadButtons() {
        const nav = document.getElementById('site-nav');
        const container = document.createElement('div');
        container.className = 'save_buttons';
        container.innerHTML = `
          <button id="btnGerarCodigo" class="nav-button">Salvar ficha</button>
          <button id="btnRestaurar" class="nav-button">Restaurar ficha</button>
          <button id="btnLimpar" class="nav-button">Limpar ficha</button>
        `;
        nav.appendChild(container);

        document.getElementById('btnGerarCodigo')?.addEventListener('click', () => this.#openCodeModal());
        document.getElementById('btnRestaurar')?.addEventListener('click', () => this.#openRestoreModal());
        document.getElementById('btnLimpar')?.addEventListener('click', () => this.modal.open('clearModal'));
    }

    /** Ensures every input and XP circle has a stable ID for save/load. */
    #assignMissingIds() {
        document.querySelectorAll('input, select, textarea').forEach((input, i) => {
            if (!input.id) input.id = input.type === 'checkbox' ? `cb_auto_${i}` : `input_auto_${i}`;
        });
    }

    /** Runs once after the DOM is ready and all events are wired. */
    #startup() {
        this.stressBanners();
        this.traumaBanners();
        this.playbookBanners();
        this.actionContainerRender();
        this.playbookSelection();
        this.#assignMissingIds();
        this.load();
        this.#updateName();
        console.log('Ficha iniciada com sucesso.');
    }

    // ─── Event registration ───────────────────────────────────────────────────

    #registerEvents() {
        console.log("Eventos iniciados");
        document.getElementById('btnGerarCodigo')?.addEventListener('click', () => this.#openCodeModal());
        document.getElementById('btnRestaurar')?.addEventListener('click', () => this.#openRestoreModal());
        document.getElementById('btnLimpar')?.addEventListener('click', () => this.modal.open('clearModal'));
        document.getElementById('movement')?.addEventListener('change', (e) => {if (e.target.checked) this.modal.open('movementModal');});
        document.getElementById('playbookSelector')?.addEventListener('change', (e) => this.#onPlaybookChange(e));

        document.addEventListener('input', (e) => this.#handleUserInteraction(e));
        document.addEventListener('change', (e) => this.#handleUserInteraction(e));
    }

    #handleUserInteraction(e) {
        if (!e.target) return;
        if (e.target.id === 'restoreCodeInput' || e.target.id === 'codeModalText') return;
        this.updateCharacterFromDOM();
        this.save();
    }


    // ─── Modal setup ───────────────────────────────────────────────────────────
    #registerModals() {
        this.#createCodeModal();
        this.#createRestoreModal();
        this.#createClearModal();
        //this.#createMovementModal();
    }

    #createCodeModal() {
        const body = document.createElement('div');
        body.innerHTML = `
            <p>Copie este código e guarde-o. Use-o para restaurar sua ficha quando recarregar a página.</p>
            <textarea id="codeModalText" rows="6" readonly></textarea>
        `;
        this.modal.create({
            id: 'codeModal',
            title: 'Código da ficha',
            body,
            buttons: [
                { label: '📋 Copiar', onClick: () => this.#copyCode(), closeOnClick: false },
            ],
        });
    }

    #createRestoreModal() {
        const body = document.createElement('div');
        body.innerHTML = `
            <p>Cole o código da ficha abaixo e clique em <strong>Restaurar</strong>.</p>
            <textarea id="restoreCodeInput" rows="6" placeholder="Cole o código aqui..."></textarea>
            <p id="restoreError" style="display:none">Código inválido. Verifique e tente novamente.</p>
        `;
        this.modal.create({
            id: 'restoreModal',
            title: 'Restaurar ficha',
            body,
            closable: false,
            buttons: [
                { label: 'Restaurar', onClick: () => this.#restoreFromCode(), closeOnClick: false },
                { label: 'Cancelar', className: 'secondary' },
            ],
        });
    }

    #createClearModal() {
        const body = document.createElement('div');
        body.innerHTML = `<p>Tem certeza que deseja limpar a ficha? Esta ação não pode ser desfeita.</p>`;
        this.modal.create({
            id: 'clearModal',
            title: 'Limpar ficha',
            body,
            closable: false,
            buttons: [
                { label: 'Limpar', onClick: () => this.clearSheet() },
                { label: 'Cancelar', className: 'secondary' },
            ],
        });
    }

    #createMovementModal() {
        const body = document.createElement('div');
        body.innerHTML = `
            <p>Selecione os movimentos para o seu personagem.</p>
            <select id="movementClassSelect">
                <option value="">Selecione a classe</option>
            </select>
            <section id="movementModalContainer" class="movement-available"></section>
        `;
        this.modal.create({
            id: 'movementModal',
            title: 'Movimentos',
            body,
            closable: false,
            buttons: [
                { label: 'Confirmar' },
                { label: 'Cancelar', className: 'secondary', onClick: () => { document.getElementById('movement').checked = false; } },
            ],
        });
    }

    #openCodeModal() {
        this.updateCharacterFromDOM();
        this.save();
        document.getElementById('codeModalText').value = SaveAndLoad.encodeState(Character.toState(this.character));
        this.modal.open('codeModal');
    }

    #copyCode() {
        const textarea = document.getElementById('codeModalText');
        textarea.select();
        navigator.clipboard?.writeText(textarea.value);
    }

    #openRestoreModal() {
        document.getElementById('restoreCodeInput').value = '';
        document.getElementById('restoreError').style.display = 'none';
        this.modal.open('restoreModal');
    }

    #restoreFromCode() {
        const code = document.getElementById('restoreCodeInput').value.trim();
        const errorEl = document.getElementById('restoreError');
        try {
            this.clearInputs();
            this.character = Character.fromState(SaveAndLoad.decodeState(code));
            this.populateDOM(this.character);
            this.save();
            errorEl.style.display = 'none';
            this.modal.close('restoreModal');
        } catch (e) {
            errorEl.style.display = 'block';
        }
    }

    // ─── Name Handling ─────────────────────────────────────────────────────────

    #updateName(){
        const inputNome = document.getElementById('input-nome');
        if (inputNome) {
            inputNome.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = val ? val : 'Blades in the Dark - Ficha de personagem';
                }
            });
        }
    }

    #onPlaybookChange(e) {
        console.log(e.target.value);
        this.character.playbook = e.target.value;
        
        this.loadplaybookMoves(this.character.playbook);
        this.loadplaybookContacts(this.character.playbook);
        this.loadItens(this.character.playbook);

        this.updateCharacterFromDOM();
        this.save();
    }


    // ─── Persistence ─────────────────────────────────────────────────────────

    save() { SaveAndLoad.autoSave(Character, this.character); }

    load() {
        const saved = SaveAndLoad.autoLoad(Character);
        if (saved) {
            this.character = saved;
            this.populateDOM(this.character);
        }
    }

    updateCharacterFromDOM() {
        this.character.nome = document.getElementById('input-nome')?.value || '';
        this.character.bando = document.getElementById('input-bando')?.value || '';
        this.character.alcunha = document.getElementById('input-alcunha')?.value || '';
        this.character.aparencia = document.getElementById('input-aparencia')?.value || '';
        this.character.raizes = document.getElementById('input-background')?.value || '';
        this.character.historia = document.getElementById('input-historia')?.value || '';
        this.character.vicios = document.getElementById('input-vicios')?.value || '';
        this.character.playbook = document.getElementById('playbookSelector')?.value || '';

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.character.nome ? this.character.nome : 'Blades in the Dark - Ficha de personagem';
        }

        const inputsState = {};
        document.querySelectorAll('input, select, textarea').forEach((el) => {
            if (!el.id) return;
            if (el.id === 'restoreCodeInput' || el.id === 'codeModalText') return;
            if (el.type === 'checkbox' || el.type === 'radio') {
                inputsState[el.id] = el.checked;
            } else {
                inputsState[el.id] = el.value;
            }
        });
        this.character.inputs = inputsState;
    }

    // ─── DOM population ───────────────────────────────────────────────────────

    /**
     * Writes all Character fields back to their corresponding DOM elements.
     * Call this after loading or restoring a character.
     */
    populateDOM(character) {
        if (!character) return;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        setVal('input-nome', character.nome);
        setVal('input-bando', character.bando);
        setVal('input-alcunha', character.alcunha);
        setVal('input-aparencia', character.aparencia);
        setVal('input-background', character.raizes);
        setVal('input-historia', character.historia);
        setVal('input-vicios', character.vicios);

        if (character.playbook !== undefined && character.playbook !== null && character.playbook !== '') {
            setVal('playbookSelector', character.playbook);

            this.loadplaybookMoves(character.playbook);
            this.loadplaybookContacts(character.playbook);
            this.loadItens(character.playbook);
        }

        if (character.inputs) {
            for (const [id, value] of Object.entries(character.inputs)) {
                const el = document.getElementById(id);
                if (!el) continue;
                if (el.type === 'checkbox' || el.type === 'radio') {
                    el.checked = Boolean(value);
                } else {
                    el.value = value ?? '';
                }
            }
        }

        if (this.quill && character.notas) {
            try { this.quill.setContents(JSON.parse(character.notas)); }
            catch { this.quill.setText(character.notas); }
        }

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = character.nome ? character.nome : 'Blades in the Dark - Ficha de personagem';
        }
    }

    // ─── Class / race selectors ───────────────────────────────────────────────


    // ─── Sheet lifecycle ──────────────────────────────────────────────────────
    clearInputs() {
        document.querySelectorAll('input, select, textarea').forEach((input) => {
            if (input.id === 'restoreCodeInput' || input.id === 'codeModalText') return;
            if (input.type === 'checkbox') input.checked = false;
            else if (input.tagName.toLowerCase() === 'select') { input.selectedIndex = 0; }
            else input.value = '';
        });
    }

    clearSheet() {
        SaveAndLoad.clearState();
        this.character = new Character(); // reset model first
        this.clearInputs();
        this.loadplaybookMoves(this.character.playbook);
        this.loadItens(this.character.playbook);
        this.loadplaybookContacts(this.character.playbook);
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Blades in the Dark - Ficha de personagem';
        }
    }


    // ─── Action container rendering ─────────────────────────────────────────────
    playbookSelection() {
        const playbookSelector = document.getElementById('playbookSelector');
        if (!playbookSelector) return;
        // Populate the playbook selector with options
        
        this.ruleset.playbooks.forEach((playbook) => {
            const option = document.createElement('option');
            option.value = playbook;
            option.textContent = playbook;
            playbookSelector.appendChild(option);
        });
    }

    loadplaybookMoves(playbook) {
        const movementContainer = document.getElementById('movementContainer');
        if (!movementContainer) return;
        movementContainer.innerHTML = '';
        const plabookmoves = this.ruleset.habilidades.filter( move => move.playbook === playbook || move.playbook === "Comum" );

        plabookmoves.forEach((move) => {
            const box = document.createElement('div');
            box.classList.add('movement-box');
            
            const movementHeader = document.createElement('div');
            movementHeader.classList.add('movement-header');


            for (let index = 1; index <= move.level; index++) {
                const input = document.createElement('input');
                input.type = 'checkbox';
                const inputId = move.level > 1 ? `move_${move.id}_${index}` : `move_${move.id}`;
                input.id = inputId;
                input.className = 'playbook';
                if (this.character.inputs && this.character.inputs[inputId]) {
                    input.checked = Boolean(this.character.inputs[inputId]);
                }
                movementHeader.appendChild(input);
            }

            const span = document.createElement('span');
            span.classList.add('movement-header-label');
            span.textContent = move.nome;

            const p = document.createElement('p');
            p.classList.add('move-description');
            p.textContent = move.descricao;

            movementHeader.appendChild(span);
            box.appendChild(movementHeader);
            box.appendChild(p);
            movementContainer.appendChild(box);
        });
    }

    loadplaybookContacts(playbook){
        if (!playbook) return;
        const contactsContainer = document.getElementById('amigosContainer');
        if (!contactsContainer) return;
        contactsContainer.innerHTML = '';
        
        const pb = this.ruleset.playbook.find(pb => pb.nome === playbook);

        const label = document.createElement('span');
        label.textContent = pb["contatos-label"];
        label.classList.add('contact-label');
        contactsContainer.appendChild(label);

        pb.contatos.forEach((amigo, index) => {
            const box = document.createElement('div');
            box.classList.add('contact-box');

            const radioGroup = document.createElement('div');
            radioGroup.classList.add('radio-group');


            const relationshipGroup = `contact-${index}`;

            const ally = document.createElement('input');
            ally.type = 'radio';
            ally.id = `contact-${index}-ally`;
            ally.name = relationshipGroup;
            ally.className = 'triangle-radio ally';
            ally.value = 'ally';
            ally.checked = Boolean(this.character.inputs?.[ally.id]);

            const rival = document.createElement('input');
            rival.type = 'radio';
            rival.id = `contact-${index}-rival`;
            rival.name = relationshipGroup;
            rival.className = 'triangle-radio rival';
            rival.value = 'rival';
            rival.checked = Boolean(this.character.inputs?.[rival.id]);

            const name = document.createElement('div');
            name.classList.add('contact-name');
            name.textContent = amigo;


            radioGroup.appendChild(ally);
            radioGroup.appendChild(rival);
            box.appendChild(radioGroup);
            box.appendChild(name);
            contactsContainer.appendChild(box);
        });
    }

    loadItens(playbook) {
        if (!playbook) return;
        const commonItens = this.ruleset.itens.filter(item => item.playbook === "Comum");
        const playbookItens = this.ruleset.itens.filter(item => item.playbook === playbook);

        const itensContainer = document.getElementById('itensContainer');
        if (!itensContainer) return;

        itensContainer.appendChild(this.renderItensBlock(playbookItens, 'Itens do ' + playbook));
        itensContainer.appendChild(this.renderItensBlock(commonItens, 'Itens Comuns'));
    }

    renderItensBlock(itens, labelText){
        const itemgroup = document.createElement('div');
        itemgroup.classList.add('itens-group');

        const labelBox = document.createElement('div');
        labelBox.classList.add('label-box');
        itemgroup.appendChild(labelBox);

        const label = document.createElement('span');
        label.textContent = labelText;
        // label.classList.add('contact-label');
        labelBox.appendChild(label);

        const container = document.createElement('div');
        container.classList.add('itens-container');
        itemgroup.appendChild(container);

        itens.forEach(item => {

            const itemBox = document.createElement('div');
            itemBox.classList.add('item-box');

            const itemName = document.createElement('div');
            itemName.classList.add('item-name');
            itemName.textContent = item.nome;

            const itemLoadBox = document.createElement('div');
            itemLoadBox.classList.add('item-load-box');

            for (let index = 1; index <= item.carga; index++) {
                const input = document.createElement('input');
                input.type = 'checkbox';
                const inputId = item.carga > 1 ? `item_${item.id}_${index}` : `item_${item.id}`;
                input.id = inputId;
                input.className = 'playbook';
                if (this.character.inputs && this.character.inputs[inputId]) {
                    input.checked = Boolean(this.character.inputs[inputId]);
                }
                itemLoadBox.appendChild(input);
            }

            itemBox.appendChild(itemLoadBox);
            itemBox.appendChild(itemName);
            container.appendChild(itemBox);
        });


        return itemgroup;
    }

    actionContainerRender() {
        const actionContainer = document.getElementById('abilities-actions');
        if (!actionContainer) return;
        actionContainer.innerHTML = '';
        for (const key in this.character.atributoAcao) {
            const atributo = this.character.atributoAcao[key];
            actionContainer.appendChild(this.#renderActionContainer(key, atributo));
        }
    }

    // ─── Banner rendering ───────────────────────────────────────────────────────

    stressBanners(){
        return Banner.renderGroup('stressBannerContainer', 'stress', 'stress-banner', 7);
    }

    traumaBanners(){
        return Banner.renderGroup('traumaBannerContainer', 'trauma', 'trauma-banner', 3);
    }
    
    playbookBanners(){
        return Banner.renderGroup('playbookContainer', 'playbook', 'playbook-banner', 8);
    }

    // ─── Ability banners must run 3 times Wittys - Guts - Conviction
    abilityBanners(abilityContainer, abilityId){
        return Banner.renderGroup(abilityContainer, abilityId, 'ability-banner', 5);
    }

    #renderActionContainer(key,atributo) {
        const container = document.createElement('div');
        container.id = `${key}_container`;
        container.className = 'section-ability';

        const stressContainer = document.createElement('div');
        stressContainer.id = `${key}_abilityContainer`;
        stressContainer.className = 'ability-container';

        const abilitybannerContainer = document.createElement('div');
        abilitybannerContainer.id = `${key}_abilitybannerContainer`;
        abilitybannerContainer.className = 'bannerHeaderContainer';

        const abilityBannerLabel = document.createElement('span');
        abilityBannerLabel.className = 'header-label';
        abilityBannerLabel.textContent = `${key}`;

        const bannerContainer = document.createElement('div');
        bannerContainer.id = `${key}_bannerContainer`;
        bannerContainer.className = 'bannerContainer';


        abilitybannerContainer.appendChild(abilityBannerLabel);
        abilitybannerContainer.appendChild(bannerContainer);


        this.abilityBanners(bannerContainer, key);

        const actionContainer = document.createElement('div');
        actionContainer.id = `${key}_actionContainer`;
        actionContainer.className = 'actionContainer';
    
        const actionList = this.#renderActions(atributo);

        actionContainer.appendChild(actionList);
        stressContainer.appendChild(abilitybannerContainer);
        stressContainer.appendChild(actionContainer);
        container.appendChild(stressContainer);

        return container;
    }

    #renderActions(actions) {
        const actionList = document.createElement('div');
        actionList.className = 'actionList';

        for(let action of actions) { 
            const actionContainer = document.createElement('div');
            actionContainer.className = 'actionContainer';
            actionContainer.id = `action_${action}`;

            const actionLabel = document.createElement('span');
            actionLabel.className = 'action-label';
            actionLabel.textContent = action;
            actionContainer.appendChild(actionLabel);

            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-container';
            actionContainer.appendChild(checkboxContainer);

            for (let i = 0; i < 4; i++) {
                const check = document.createElement('input');
                check.type = 'checkbox';
                check.className = 'action-checkbox';
                check.id = `${action}_action_${i+1}`;
                checkboxContainer.appendChild(check);
            }

            actionList.appendChild(actionContainer);
        }
        return actionList;
    }
}

export default CharacterSheet;
