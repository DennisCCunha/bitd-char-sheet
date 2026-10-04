import ruleset from '../data/blades.json' with { type: 'json' };
import SaveAndLoad from './saveAndLoad.js';
import Modal from './modal.js';
import { mountClocks } from '../clocks/clocks.js';
import QuillEditor from './quillEditor.js';

const STORAGE_KEY = 'bitd_heist_sheet';

class Heist {
  constructor() {
    this.nome = '';
    this.tipo = '';
    this.alvo = '';
    this.detalhe = '';
    this.situacao = '';
    this.faccoes = [];
    this.moedas = 0;
    this.moral = 0;
    this.atencao = 0;
    this.notas = '';
  }

  static fromState(state) {
    const heist = new Heist();
    if (!state) return heist;
    Object.assign(heist, state);
    heist.faccoes = Array.isArray(heist.faccoes) ? heist.faccoes : [];
    return heist;
  }
}

class HeistSheet {
  constructor() {
    this.heist = new Heist();
    this.ruleset = ruleset;
    this.modal = new Modal('modalsContainer');
    this.clocks = mountClocks(document.getElementById('heist-clocks-container'));
    this.#renderTypes();
    this.#renderFactionOptions();
    this.#registerModals();
    this.#registerEvents();
    this.#registerStaticControls();
    this.#load();
    this.#render();
    QuillEditor.enhanceTextarea('heist-notes');
  }

  #registerModals() {
    const saveBody = document.createElement('div');
    saveBody.innerHTML = '<p>Copie este código para guardar ou compartilhar o golpe.</p><textarea id="heistCodeText" rows="6" readonly></textarea>';
    this.modal.create({
      id: 'heistCodeModal',
      title: 'Código do golpe',
      body: saveBody,
      buttons: [{ label: 'Copiar', onClick: () => navigator.clipboard?.writeText(document.getElementById('heistCodeText').value), closeOnClick: false }],
    });

    const restoreBody = document.createElement('div');
    restoreBody.innerHTML = '<p>Cole abaixo o código do golpe.</p><textarea id="heistRestoreCode" rows="6"></textarea><p id="heistRestoreError" hidden>Código inválido.</p>';
    this.modal.create({
      id: 'heistRestoreModal',
      title: 'Restaurar golpe',
      body: restoreBody,
      closable: false,
      buttons: [
        { label: 'Restaurar', onClick: () => this.#restoreFromCode(), closeOnClick: false },
        { label: 'Cancelar', className: 'secondary' },
      ],
    });

    const clearBody = document.createElement('div');
    clearBody.innerHTML = '<p>Tem certeza que deseja limpar os dados e relógios deste golpe?</p>';
    this.modal.create({
      id: 'heistClearModal',
      title: 'Limpar golpe',
      body: clearBody,
      closable: false,
      buttons: [
        { label: 'Limpar', onClick: () => this.#clear() },
        { label: 'Cancelar', className: 'secondary' },
      ],
    });
  }

  #registerStaticControls() {
    const nav = document.getElementById('site-nav');
    if (nav) {
      const actions = document.createElement('div');
      actions.className = 'save_buttons';
      actions.innerHTML = '<button id="heistSaveButton">Salvar golpe</button><button id="heistRestoreButton">Restaurar golpe</button><button id="heistClearButton">Limpar golpe</button>';
      nav.appendChild(actions);
      document.getElementById('heistSaveButton').addEventListener('click', () => this.#openCodeModal());
      document.getElementById('heistRestoreButton').addEventListener('click', () => this.modal.open('heistRestoreModal'));
      document.getElementById('heistClearButton').addEventListener('click', () => this.modal.open('heistClearModal'));
    }

    document.getElementById('heist-add-faction')?.addEventListener('click', () => {
      this.heist.faccoes.push({ nome: '', relacao: 'Neutra', notas: '' });
      this.#renderFactions();
      this.#save();
      document.querySelector('#heist-faction-interaction input')?.focus();
    });

    document.getElementById('heist-faction-interaction')?.addEventListener('input', (event) => this.#updateFaction(event));
    document.getElementById('heist-faction-interaction')?.addEventListener('change', (event) => this.#updateFaction(event));
    document.getElementById('heist-faction-interaction')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-faction]');
      if (!button) return;
      this.heist.faccoes.splice(Number(button.dataset.removeFaction), 1);
      this.#renderFactions();
      this.#save();
    });

    document.getElementById('heist-type')?.addEventListener('change', () => this.#updateTypeDescription());
    document.addEventListener('input', (event) => this.#handleFieldChange(event));
    document.addEventListener('change', (event) => this.#handleFieldChange(event));
  }

  #renderTypes() {
    const select = document.getElementById('heist-type');
    this.ruleset.heist.tipo.forEach(({ nome }) => select.add(new Option(nome, nome)));
  }

  #renderFactionOptions() {
    const list = document.getElementById('heist-faction-options');
    (this.ruleset.mundo['faccções'] || []).forEach(({ nome }) => {
      const option = document.createElement('option');
      option.value = nome;
      list.appendChild(option);
    });
  }

  #registerEvents() {
    this.#updateTypeDescription();
  }

  #handleFieldChange(event) {
    if (!event.target.matches('[data-heist-field]')) return;
    this.#readFields();
    this.#updateTitle();
    this.#save();
  }

  #readFields() {
    this.heist.nome = document.getElementById('heist-name').value;
    this.heist.tipo = document.getElementById('heist-type').value;
    this.heist.alvo = document.getElementById('heist-target').value;
    this.heist.detalhe = document.getElementById('heist-detail').value;
    this.heist.situacao = document.getElementById('heist-situation').value;
    this.heist.moedas = Number(document.getElementById('heist-moedas').value) || 0;
    this.heist.moral = Number(document.getElementById('heist-moral').value) || 0;
    this.heist.atencao = Number(document.getElementById('heist-atencao').value) || 0;
    this.heist.notas = document.getElementById('heist-notes').value;
  }

  #render() {
    const fields = {
      'heist-name': this.heist.nome,
      'heist-type': this.heist.tipo,
      'heist-target': this.heist.alvo,
      'heist-detail': this.heist.detalhe,
      'heist-situation': this.heist.situacao,
      'heist-moedas': this.heist.moedas,
      'heist-moral': this.heist.moral,
      'heist-atencao': this.heist.atencao,
      'heist-notes': this.heist.notas,
    };
    Object.entries(fields).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) field.value = value ?? '';
    });
    this.#renderFactions();
    this.#updateTypeDescription();
    this.#updateTitle();
  }

  #renderFactions() {
    const container = document.getElementById('heist-faction-interaction');
    container.replaceChildren();
    if (this.heist.faccoes.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'heist-empty-state';
      empty.textContent = 'Nenhuma facção adicionada.';
      container.appendChild(empty);
      return;
    }

    this.heist.faccoes.forEach((faction, index) => {
      const row = document.createElement('div');
      row.className = 'heist-faction-row';

      const name = document.createElement('input');
      name.type = 'text';
      name.placeholder = 'Nome da facção';
      name.setAttribute('list', 'heist-faction-options');
      name.value = faction.nome || '';
      name.dataset.factionIndex = index;
      name.dataset.factionField = 'nome';
      name.setAttribute('aria-label', `Facção ${index + 1}`);

      const relation = document.createElement('select');
      relation.setAttribute('aria-label', `Relação com facção ${index + 1}`);
      relation.dataset.factionIndex = index;
      relation.dataset.factionField = 'relacao';
      ['Aliada', 'Neutra', 'Hostil'].forEach((value) => relation.add(new Option(value, value)));
      relation.value = faction.relacao || 'Neutra';

      const notes = document.createElement('input');
      notes.type = 'text';
      notes.placeholder = 'Reação ou consequência';
      notes.value = faction.notas || '';
      notes.dataset.factionIndex = index;
      notes.dataset.factionField = 'notas';
      notes.setAttribute('aria-label', `Anotações da facção ${index + 1}`);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'x';
      remove.dataset.removeFaction = index;
      remove.setAttribute('aria-label', `Remover facção ${index + 1}`);

      row.append(name, relation, notes, remove);
      container.appendChild(row);
    });
  }

  #updateFaction(event) {
    const field = event.target.closest('[data-faction-field]');
    if (!field) return;
    const faction = this.heist.faccoes[Number(field.dataset.factionIndex)];
    if (!faction) return;
    faction[field.dataset.factionField] = field.value;
    this.#save();
  }

  #updateTypeDescription() {
    const type = this.ruleset.heist.tipo.find(({ nome }) => nome === document.getElementById('heist-type').value);
    document.getElementById('heist-type-description').textContent = type?.descricao || '';
  }

  #updateTitle() {
    document.title = this.heist.nome ? `${this.heist.nome} - Golpe` : 'Blades in the Dark - Golpe';
  }

  #save() {
    try {
      this.#readFields();
      this.heist.clocks = this.clocks.getState();
      SaveAndLoad.save(STORAGE_KEY, this.heist);
    } catch (error) {
      console.error('Falha ao salvar golpe:', error);
    }
  }

  #load() {
    try {
      const state = SaveAndLoad.load(STORAGE_KEY);
      this.heist = Heist.fromState(state);
      if (Array.isArray(state?.clocks)) this.clocks.setState(state.clocks);
    } catch (error) {
      console.warn('Falha ao restaurar golpe:', error);
    }
  }

  #openCodeModal() {
    this.#save();
    document.getElementById('heistCodeText').value = SaveAndLoad.encodeState(this.heist);
    this.modal.open('heistCodeModal');
  }

  #restoreFromCode() {
    try {
      const code = document.getElementById('heistRestoreCode').value.trim();
      const state = SaveAndLoad.decodeState(code);
      this.heist = Heist.fromState(state);
      this.clocks.setState(Array.isArray(state.clocks) ? state.clocks : []);
      this.#render();
      this.#save();
      this.modal.close('heistRestoreModal');
    } catch (error) {
      document.getElementById('heistRestoreError').hidden = false;
    }
  }

  #clear() {
    SaveAndLoad.remove(STORAGE_KEY);
    this.heist = new Heist();
    this.clocks.clear();
    this.#render();
    this.modal.close('heistClearModal');
  }
}


export default {HeistSheet, Heist};

