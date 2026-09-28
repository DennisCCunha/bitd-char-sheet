import ruleset from "../data/blades.json" with { type: "json" };
import SaveAndLoad from './saveAndLoad.js';
import Modal from './modal.js';

const STORAGE_KEY = 'bitd_crew_sheet';

class Crew {
  constructor() {
    this.nome = '';
    this.tipo = '';
    this.reputacao = '';
    this.covil = '';
    this.moral = 0;
    this.territorio = 0;
    this.controle = 'forte';
    this.territorios = [];
    this.categoria = 0;
    this.posses = 0;
    this.moedas = 0;
    this.cofre = 0;
    this.atencao = 0;
    this.procurado = 0;
    this.habilidadesEspeciais = [];
    this.melhorias = [];
    this.contatos = [];
    this.parceiros = [];
    this.areasCaca = '';
    this.notas = '';
  }

  static fromState(state) {
    const crew = new Crew();
    if (!state) return crew;
    Object.assign(crew, state);
    crew.habilidadesEspeciais = Array.isArray(crew.habilidadesEspeciais) ? crew.habilidadesEspeciais : [];
    crew.melhorias = Array.isArray(crew.melhorias) ? crew.melhorias : [];
    crew.contatos = Array.isArray(crew.contatos) ? crew.contatos : [];
    crew.parceiros = Array.isArray(crew.parceiros) ? crew.parceiros : [];
    crew.territorios = Array.isArray(crew.territorios) ? crew.territorios : [];
    return crew;
  }

  getCrewRuleset() {
    return ruleset.crew;
  }
}

class CrewSheet {
  constructor() {
    this.crew = new Crew();
    this.ruleset = ruleset.crew;
    this.modal = new Modal('modalsContainer');
    this.#registerModals();
    this.#registerEvents();
    this.#renderStaticControls();
    this.#startup();
  }

  #startup() {
    this.#load();
    this.#renderCrew();
    console.log('Bando iniciado com sucesso.');
  }

  #registerEvents() {
    document.addEventListener('input', (event) => {
      if (event.target.matches('input, textarea, select')) {
        this.populateCrewFromDOM();
        this.#save();
      }
    });

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-crew-field]')) {
        this.populateCrewFromDOM();
        this.#save();
        return;
      }
      if (event.target.matches('[data-selection]')) {
        this.#toggleSelection(event.target.dataset.selection, event.target.value, event.target.checked);
        if (event.target.dataset.selection.startsWith('contato:')) this.#renderContacts();
        this.#save();
      }
    });

    document.getElementById('crew-playbook-selector')?.addEventListener('change', (event) => {
      this.crew.tipo = event.target.value;
      this.#renderPlaybookSections();
      this.#save();
    });
  }

  #registerModals() {
    const codeBody = document.createElement('div');
    codeBody.innerHTML = '<p>Copie este código para guardar o estado do bando.</p><textarea id="crewCodeModalText" rows="6" readonly></textarea>';
    this.modal.create({
      id: 'crewCodeModal',
      title: 'Código do bando',
      body: codeBody,
      buttons: [{ label: 'Copiar', onClick: () => navigator.clipboard?.writeText(document.getElementById('crewCodeModalText').value), closeOnClick: false }],
    });

    const restoreBody = document.createElement('div');
    restoreBody.innerHTML = '<p>Cole o código do bando abaixo.</p><textarea id="crewRestoreCodeInput" rows="6"></textarea><p id="crewRestoreError" hidden>Código inválido.</p>';
    this.modal.create({
      id: 'crewRestoreModal',
      title: 'Restaurar bando',
      body: restoreBody,
      closable: false,
      buttons: [
        { label: 'Restaurar', onClick: () => this.#restoreFromCode(), closeOnClick: false },
        { label: 'Cancelar', className: 'secondary' },
      ],
    });

    const clearBody = document.createElement('div');
    clearBody.innerHTML = '<p>Tem certeza que deseja limpar o bando?</p>';
    this.modal.create({
      id: 'crewClearModal',
      title: 'Limpar bando',
      body: clearBody,
      closable: false,
      buttons: [
        { label: 'Limpar', onClick: () => this.#clear() },
        { label: 'Cancelar', className: 'secondary' },
      ],
    });
  }

  #renderStaticControls() {
    const nav = document.getElementById('site-nav');
    if (nav) {
      const actions = document.createElement('div');
      actions.className = 'save_buttons';
      actions.innerHTML = '<button id="crewSaveButton">Salvar bando</button><button id="crewRestoreButton">Restaurar bando</button><button id="crewClearButton">Limpar bando</button>';
      nav.appendChild(actions);
      document.getElementById('crewSaveButton').addEventListener('click', () => this.#openCodeModal());
      document.getElementById('crewRestoreButton').addEventListener('click', () => this.modal.open('crewRestoreModal'));
      document.getElementById('crewClearButton').addEventListener('click', () => this.modal.open('crewClearModal'));
    }

    const selector = document.getElementById('crew-playbook-selector');
    this.ruleset.tipos.forEach((tipo) => {
      const option = document.createElement('option');
      option.value = tipo;
      option.textContent = tipo;
      selector?.appendChild(option);
    });

    const reputationSelector = document.getElementById('input-crew-reputation');
    this.ruleset.reputacoes.forEach((reputacao) => {
      const option = document.createElement('option');
      option.value = reputacao;
      option.textContent = reputacao;
      reputationSelector?.appendChild(option);
    });
  }

  #renderCrew() {
    const fields = {
      'input-crew-nome': this.crew.nome,
      'input-crew-reputation': this.crew.reputacao,
      'input-crew-den': this.crew.covil,
      'input-crew-hunting-grounds': this.crew.areasCaca,
      'input-crew-notes': this.crew.notas,
    };
    Object.entries(fields).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
    const selector = document.getElementById('crew-playbook-selector');
    if (selector) selector.value = this.crew.tipo;
    this.#renderMetaSections();
    this.#renderPlaybookSections();
    this.#updateTitle();
  }

  #renderMetaSections() {
    ['crew-morale-territory-container', 'crew-heat-container', 'crew-control-category-container', 'crew-coin-vault-container']
      .forEach((id) => document.getElementById(id)?.replaceChildren());
    this.#renderTracker('crew-morale-territory-container', 'Moral', 'moral', 6);
    this.#renderTracker('crew-morale-territory-container', 'Território', 'territorio', 6);
    this.#renderTracker('crew-heat-container', 'Atenção', 'atencao', 9);
    this.#renderTracker('crew-heat-container', 'Procurado', 'procurado', 4);
    this.#renderTracker('crew-control-category-container', 'Controle', 'controle', 0, ['fraco', 'forte']);
    this.#renderTracker('crew-control-category-container', 'Categoria', 'categoria', 4);
    this.#renderTracker('crew-coin-vault-container', 'Moedas', 'moedas', 4);
    this.#renderTracker('crew-coin-vault-container', 'Cofre', 'cofre', 12);
    this.#renderTracker('crew-coin-vault-container', 'Posses', 'posses', 14);
  }

  #renderTracker(containerId, label, field, max, options = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const group = document.createElement('div');
    group.className = 'crew-tracker';
    const title = document.createElement('strong');
    title.textContent = label;
    group.appendChild(title);
    if (options) {
      const select = document.createElement('select');
      select.dataset.crewField = field;
      options.forEach((option) => select.add(new Option(option, option)));
      select.value = this.crew[field];
      group.appendChild(select);
    } else {
      const banners = document.createElement('div');
      banners.className = 'bannerContainer crew-tracker-banners';
      for (let index = 1; index <= max; index += 1) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `crew-${field}-${index}`;
        input.checked = index <= Number(this.crew[field]);
        input.dataset.crewField = field;
        input.addEventListener('change', () => {
          this.crew[field] = input.checked ? index : index - 1;
          this.#renderMetaSections();
          this.#save();
        });
        const labelEl = document.createElement('label');
        labelEl.htmlFor = input.id;
        labelEl.className = 'crew-tracker-box';
        labelEl.appendChild(input);
        banners.appendChild(labelEl);
      }
      group.appendChild(banners);
    }
    container.appendChild(group);
  }

  #renderPlaybookSections() {
    const type = this.crew.tipo;
    const isCrewType = (itemType) => this.#normalizeType(itemType) === this.#normalizeType(type);
    const isCommonType = (itemType) => ['comum', 'comun'].includes(this.#normalizeType(itemType));
    const abilities = this.ruleset.habilidades.filter((item) => isCrewType(item.tipo) || isCommonType(item.tipo));
    const upgrades = this.ruleset.upgrades.filter((item) => isCrewType(item.tipo) || isCommonType(item.tipo));
    const territories = this.ruleset.territorios.filter((item) => isCrewType(item.tipo));
    this.#renderSelectionList('crew-movement-container', 'Habilidades especiais', abilities, 'habilidadesEspeciais');
    this.#renderSelectionList('crew-upgrades-container', 'Melhorias', upgrades, 'melhorias');
    this.#renderSelectionList('crew-territories-container', 'Territórios', territories, 'territorios');
    this.#renderContacts();
  }

  #normalizeType(value = '') {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/s$/, '');
  }

  #renderSelectionList(containerId, title, items, field) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = title;
    container.appendChild(heading);

    items.forEach((item) => {
      const habilityBox = document.createElement('div');
      habilityBox.className = 'crew-selection-wrapper';

      const habilityHeader = document.createElement('div');
      habilityHeader.className = 'crew-selection-header';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = item.id;
      input.dataset.selection = field;
      input.checked = this.crew[field].includes(item.id);
  
      const span = document.createElement('span');
      span.className = 'crew-selection';
      span.append(input, document.createTextNode(item.nome));

      const effect = document.createElement('span');
      effect.className = 'crew-selection-description';
      effect.textContent = item.efeito || '';
      
      habilityHeader.appendChild(input);
      habilityHeader.appendChild(span);

      habilityBox.appendChild(habilityHeader);
      habilityBox.appendChild(effect);
      
      if (item.descricao) {
        let description = document.createElement('span');
        description.className = 'crew-selection-description';
        description.textContent = item.descricao;
        habilityBox.appendChild(description);
      }

      container.appendChild(habilityBox);
    });
  }

  #renderContacts() {
    const container = document.getElementById('crew-amigos-container');
    if (!container) return;
    container.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'Contatos';
    container.appendChild(heading);
    this.ruleset.contatos.filter((contact) => this.#normalizeType(contact.tipo) === this.#normalizeType(this.crew.tipo)).forEach((contact, index) => {
      const row = document.createElement('div');
      row.className = 'crew-contact';
      const name = document.createElement('span');
      name.textContent = contact.nome;
      const state = this.crew.contatos.find((saved) => saved.id === `${this.crew.tipo}-${index}`) || {};
      row.appendChild(name);
     
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `crew-contact-${this.crew.tipo}-${index}-amigo`;
        input.value = `${this.crew.tipo}-${index}`;
        input.dataset.selection = `contato:amigo`;
        input.checked = Boolean(state['amigo']);
        const relationLabel = document.createElement('label');
        relationLabel.htmlFor = input.id;
        relationLabel.textContent = 'Amigo';
        row.append(input, relationLabel);
  
      container.appendChild(row);
    });
  }

  #toggleSelection(field, value, checked) {
    if (field.startsWith('contato:')) {
      const [, relation] = field.split(':');
      const id = value;
      let contact = this.crew.contatos.find((item) => item.id === id);
      if (!contact) {
        contact = { id, amigo: false, rival: false };
        this.crew.contatos.push(contact);
      }
      contact[relation] = checked;
      if (checked) contact[relation === 'amigo' ? 'rival' : 'amigo'] = false;
      if (!contact.amigo && !contact.rival) this.crew.contatos = this.crew.contatos.filter((item) => item !== contact);
      return;
    }
    const list = this.crew[field];
    const id = Number(value);
    this.crew[field] = checked ? [...new Set([...list, id])] : list.filter((item) => item !== id);
  }

  populateCrewFromDOM() {
    this.crew.nome = document.getElementById('input-crew-nome')?.value || '';
    this.crew.reputacao = document.getElementById('input-crew-reputation')?.value || '';
    this.crew.covil = document.getElementById('input-crew-den')?.value || '';
    this.crew.notas = document.getElementById('input-crew-notes')?.value || '';
    this.crew.areasCaca = document.getElementById('input-crew-hunting-grounds')?.value || '';
    const controle = document.querySelector('[data-crew-field="controle"]');
    if (controle) this.crew.controle = controle.value;
    this.#updateTitle();
  }

  #updateTitle() {
    document.title = this.crew.nome ? `${this.crew.nome} - Ficha de Bando` : 'Blades in the Dark - Ficha de Bando';
  }

  #save() {
    try {
      SaveAndLoad.save(STORAGE_KEY, this.crew);
    } catch (error) {
      console.error('Falha ao salvar bando:', error);
    }
  }

  #load() {
    try {
      this.crew = Crew.fromState(SaveAndLoad.load(STORAGE_KEY));
    } catch (error) {
      console.warn('Falha ao restaurar bando:', error);
    }
  }

  #openCodeModal() {
    document.getElementById('crewCodeModalText').value = SaveAndLoad.encodeState(this.crew);
    this.modal.open('crewCodeModal');
  }

  #restoreFromCode() {
    try {
      const code = document.getElementById('crewRestoreCodeInput').value.trim();
      this.crew = Crew.fromState(SaveAndLoad.decodeState(code));
      this.#renderCrew();
      this.#save();
      this.modal.close('crewRestoreModal');
    } catch (error) {
      document.getElementById('crewRestoreError').hidden = false;
    }
  }

  #clear() {
    SaveAndLoad.remove(STORAGE_KEY);
    this.crew = new Crew();
    this.#renderCrew();
    this.modal.close('crewClearModal');
  }
}

export { Crew, CrewSheet };

new CrewSheet();
