export default class Utils {
// Canonicalização: remove acentos e normaliza para lower-case
    static canonical(text) {
        return (text || '')
            .toString()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .trim()
            .toLowerCase();
    }

    static capitalize(s) {
    if (!s) return s;
        return s[0].toUpperCase() + s.slice(1).toLowerCase();
    }

    static searchFilter(obj, search) {
        search = Utils.canonical(search);
        return Utils.walk(obj, search);
    }

    static walk(obj, search) {
        if (typeof obj === 'string') {
            return Utils.canonical(obj).includes(search);
        } else if (Array.isArray(obj)) {
            return obj.some(item => Utils.walk(item, search));
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some(value => Utils.walk(value, search));
        }
        return false;
    }

    static combobox(comboId, optionsList, selectedOptions = [], placeholder = "Select options...") {
        const comboBoxWrapper = document.createElement('div');
        comboBoxWrapper.classList.add('combobox-wrapper');

        const comboBox = document.createElement('div');
        comboBox.classList.add('combobox');
        comboBox.id = comboId;

        const pillList = document.createElement('div');
        pillList.classList.add('pill-list');
        pillList.id = `${comboId}_pillList`;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = `${comboId}_searchInput`;
        searchInput.placeholder = placeholder;
        searchInput.autocomplete = 'off';

        pillList.appendChild(searchInput);
        comboBox.appendChild(pillList);

        const dropdownArrow = document.createElement('span');
        dropdownArrow.classList.add('arrow');
        dropdownArrow.id = `${comboId}_dropdownArrow`;
        dropdownArrow.textContent = '▼';
        comboBox.appendChild(dropdownArrow);

        comboBoxWrapper.appendChild(comboBox);

        const dropdownMenu = document.createElement('ul');
        dropdownMenu.classList.add('dropdown-menu');
        dropdownMenu.id = `${comboId}_dropdownMenu`;
        comboBoxWrapper.appendChild(dropdownMenu);

        return comboBoxWrapper;
    }
}