class CharacterSheetALT {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.#init();
        });   
    }

    #init() {
        this.character = new Character();

        this.#loadInteractiveElements();
        this.#registerEventListeners();
        this.#renderAtributos();

        SaveAndLoad.autoLoad();
    }

    #loadInteractiveElements() {
        
    }

    #registerEventListeners() {
    }

    #renderAtributos(containerId = 'atributosContainer') {

        const container = document.getElementById(containerId);
        
        for (const atribKey in ATTR_MAP) {
            const atrib = ATTR_MAP[atribKey];

            const card = document.createElement('div');
            card.id = `stat-card-${atrib.key}`;
            card.className = 'stat-card';

            // Header 
            const header = document.createElement('div');
            header.className = 'stat-card-header';

            const title = document.createElement('div');
            title.className = 'stat-card-title';
            title.textContent = `${atrib.label}`;
            header.appendChild(title);

            const valueInput = document.createElement('input');
            valueInput.className = 'stat-card-value';
            valueInput.type = 'text';
            valueInput.id = `${atrib.val}`;
            valueInput.value = '';
            valueInput.placeholder = '0';
            header.appendChild(valueInput);

            card.appendChild(header);

            // Footer - Black filled part
            const footer = document.createElement('div');
            footer.className = 'stat-card-footer';

            const modifier = document.createElement('div');
            modifier.className = 'stat-card-modifier';
            modifier.textContent = `${atrib.debilidadeLabel} -1`;
            footer.appendChild(modifier);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${atrib.deb}`;
            checkbox.className = 'stat-card-checkbox';
            footer.appendChild(checkbox);

            const badge = document.createElement('div');
            badge.className = 'stat-card-badge';
            badge.textContent = `${atrib.abreviatura}`;
            badge.id = `${atrib.mod}`;
           
            const modInput = document.createElement('input');
            modInput.type = 'text';
            modInput.id = `${atrib.mod}`;
            modInput.value = '';
            modInput.placeholder = '0';
            badge.appendChild(modInput);


            footer.appendChild(badge);
            card.appendChild(footer);

            container.appendChild(card);
        }
    }

}