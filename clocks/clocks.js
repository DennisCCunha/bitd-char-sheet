import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/modular/sortable.complete.esm.js';
const MIN = 3;
const INC = 2;

// O modulo monta a interface com DOM nativo e Sortable e salva linhas e clocks no
// localStorage. A funcao exportada permite montar o gerenciador em um container.

// Cria um elemento div com as classes informadas e anexa os filhos recebidos.
const createElement = function(classes, ...children) {
    const element = document.createElement('div');
    element.className = classes;
    for (const child of children) {
        element.append(child);
    }
    return element;
};

// Cria um input e aplica seus atributos HTML, como placeholder e tipo.
const createInput = function(classes, attributes) {
    const element = document.createElement('input');
    element.className = classes;
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
};

const createText = function(classes, text) {
    const element = createElement(classes);
    element.textContent = text;
    return element;
};

const createHelpText = function(emphasis, description) {
    const emphasizedText = document.createElement('b');
    emphasizedText.textContent = emphasis;
    return createElement('text', emphasizedText, document.createTextNode(description));
};

const createClockControls = function(row, root) {
    const options = [
        {size: 4, good: false},
        {size: 4, good: true},
        {size: 6, good: false},
        {size: 6, good: true},
        {size: 8, good: false},
        {size: 8, good: true},
    ];
    const controls = createElement('clock-controls');

    for (const option of options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `clock-add ${option.good ? 'good' : 'bad'}`;
        button.textContent = `${option.size} passos`;
        button.setAttribute('aria-label', `Adicionar relógio ${option.good ? 'bom' : 'ruim'} de ${option.size} passos`);
        button.addEventListener('click', () => addClock({
            good: option.good,
            max: option.size,
            row,
            root,
        }));
        controls.append(button);
    }

    return controls;
};

// Monta uma linha com nome, clocks e controles; Sortable permite reordenar
// clocks e linhas, enquanto os gestos no puxador recolhem ou removem a linha.
const createRow = function({name = '', clocks = [], minimized = false} = {}, root) {
    const row = createElement('row',
        createElement('handle row-handle'),
        createElement('inner',
            createElement('row-header',
                Object.assign(createInput('name', {placeholder: 'Row'}), {value: name}),
            ),
            createElement('clocks',
                ...clocks.map(createClock),
                createSpawner(),
            ),
        ),
    );
    row.querySelector('.row-header').append(createClockControls(row, root));
    if (minimized) {
        row.setAttribute('minimized', '');
    }
    const sortable = Sortable.create(row.querySelector('.clocks'), {
        handle: '.clock-handle',
        animation: 150,
        ghostClass: 'dragged-item',
        onStart: () => root.querySelector('.rows').setAttribute('dragging', ''),
        onEnd: () => {
            root.querySelectorAll('.row').forEach(currentRow => {
                const clocks = currentRow.querySelectorAll('.clock');
                const lastClock = clocks[clocks.length - 1];
                if (lastClock) {
                    lastClock.after(currentRow.querySelector('.spawner'));
                }
            });
            root.querySelector('.rows').removeAttribute('dragging');
        },
    });
    sortable.option('group', {
        name: 'clocks',
        pull: true,
        put: ['clocks'],
    });
    row.querySelector('.row-handle').addEventListener('click', event => {
        if (event.shiftKey) {
            row.toggleAttribute('minimized');
        }
    });
    row.querySelector('.row-handle').addEventListener('dblclick', () => {
        sortable.destroy();
        row.remove();
    });
    row.querySelector('.button.bad').addEventListener('click', () => addClock({row, root}));
    row.querySelector('.button.good').addEventListener('click', () => addClock({good: true, row, root}));
    return row;
};

// Cria o controle visual inserido após cada clock para adicionar outro clock.
const createSpawner = function() {
    return createElement('spawner',
        createElement('button bad',
            createElement('icon'),
        ),
        createElement('bar',
            createElement('paint',
                createElement('strokes',
                    createElement('stroke s1'),
                    createElement('stroke s2'),
                ),
            ),
        ),
        createElement('button good',
            createElement('icon'),
        ),
    );
};

// Monta um clock e conecta interações: clique altera o progresso, Shift+scroll
// redimensiona e os gestos no puxador alternam a cor ou removem o clock.
const createClock = function({description = '', good = false, max = 4, progress} = {}) {
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-clock';
    deleteButton.setAttribute('aria-label', 'Excluir relógio');
    deleteButton.title = 'Excluir relógio';
    deleteButton.textContent = '×';

    const clock = createElement('clock',
        createElement('banner',
            createElement('handle clock-handle'),
            Object.assign(createInput('description', {placeholder: 'Clock'}), {value: description}),
            deleteButton,
        ),
        createElement('widget',
            createElement('core'),
        ),
    );
    clock.setAttribute(good ? 'good' : 'bad', '');
    populateClock(clock, max, progress);
    clock.addEventListener('click', event => clickClock(clock, event));
    clock.querySelector('.widget').addEventListener('wheel', event => scaleClock(clock, event));
    clock.querySelector('.clock-handle').addEventListener('click', event => toggleClock(clock, event));
    clock.querySelector('.clock-handle').addEventListener('dblclick', event => removeClock(clock, event));
    clock.querySelector('.delete-clock').addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        removeClock(clock, event, true);
    });
    return clock;
};

// Desenha as fatias e divisores. Se o progresso nao for informado, preserva
// a quantidade atual de fatias preenchidas, limitada ao novo tamanho.
const populateClock = function(clock, size, progress) {
    progress = progress == undefined ? Math.min(clock.querySelectorAll('.slice[filled]').length, size) : progress;
    const core = clock.querySelector('.core');
    core.replaceChildren();
    for (let i = 0; i < size; i++) {
        const slice = createElement('slice');
        slice.setAttribute('i', i);
        slice.style.setProperty('--i', i);
        slice.addEventListener('mouseenter', () => updateClockPreview(clock, i, true));
        slice.addEventListener('mouseleave', () => updateClockPreview(clock, i, false));
        if (i < progress) {
            slice.setAttribute('filled', '');
        }
        core.append(slice);
    }
    for (let i = 0; i < size; i++) {
        const bar = createElement('bar', createElement('paint'));
        bar.setAttribute('i', i);
        bar.style.setProperty('--i', i);
        core.append(bar);
    }
    clock.setAttribute('n', size);
    clock.style.setProperty('--n', size);
    return clock;
};

// Adiciona uma linha vazia ao painel.
const addRow = function(root) {
    const row = createRow({}, root);
    root.querySelector('.rows').append(row);
    return row;
};

// Cria um clock na linha indicada (ou na ultima linha) e reposiciona o controle
// de adicao. max define o numero inicial de fatias; o padrao continua sendo 4.
const addClock = function({good = false, row, max = 4, root} = {}) {
    root = root || row?.closest('.clocks-app');
    row = row || root.querySelector('.row:last-of-type');
    if (!row) {
        row = addRow(root);
    }
    const clock = createClock({good, max});
    row.querySelector('.clocks').append(clock);
    clock.after(row.querySelector('.spawner'));
    return clock;
};

// Preenche as fatias ate o ponto clicado ou limpa a partir dele, mantendo
// sempre o progresso como uma sequencia continua desde o inicio do clock.
const clickClock = function(clock, event) {
    const target = event.target;
    if (!target.matches('.slice')) {
        return;
    }
    const index = Number.parseInt(target.getAttribute('i'), 10);
    const filling = !target.hasAttribute('filled');
    clock.querySelectorAll('.slice').forEach((slice, sliceIndex) => {
        if (sliceIndex > index || (sliceIndex === index && !filling)) {
            slice.removeAttribute('filled');
        } else {
            slice.setAttribute('filled', '');
        }
    });
    updateClockPreview(clock, index, true);
};

// Exibe a pre-visualizacao do preenchimento ao passar o mouse sobre uma fatia.
const updateClockPreview = function(clock, i, inside) {
    if (inside) {
        const filling = !clock.querySelector(`.slice[i="${i}"]`).hasAttribute('filled');
        clock.querySelectorAll('.slice').forEach((slice, index) => {
            const filled = slice.hasAttribute('filled');
            const willChange = filling ? index < i && !filled : index > i && filled;
            if (willChange) {
                slice.setAttribute('will-change', '');
            } else {
                slice.removeAttribute('will-change');
            }
        });
    } else {
        clock.querySelectorAll('.slice').forEach(slice => slice.removeAttribute('will-change'));
    }
};

// Redimensiona o clock com Shift+scroll; o progresso existente e preservado.
const scaleClock = function(clock, event) {
    if (!event.shiftKey) {
        return;
    }
    event.preventDefault();
    let size = Number.parseInt(clock.getAttribute('n'), 10);
    let modifier = event.deltaY > 0 ? -INC : INC;
    if (size == MIN && modifier > 0) {
        modifier = 1; // Special sauce to allow MIN=3 but INC=2
    }
    let n = Math.max(MIN, size + modifier);
    if (n != size) {
        populateClock(clock, n);
    }
    };

// Alterna a cor do clock entre bom (azul) e ruim (laranja) com Shift+clique.
const toggleClock = function(clock, event) {
    if (!event.shiftKey) {
        return;
    }
    if (!clock.hasAttribute('good')) {
        clock.removeAttribute('bad');
        clock.setAttribute('good', '');
    } else {
        clock.removeAttribute('good');
        clock.setAttribute('bad', '');
    }
};

// Remove o clock associado ao puxador com duplo clique, exceto se Shift estiver
// pressionado, gesto reservado para alternar a cor.
const removeClock = function(clock, event, force = false) {
    if (!force && event.shiftKey) {
        return;
    }
    clock.remove();
};

// Abre ou fecha a ajuda contextual com os gestos disponiveis na interface.
const toggleHelp = function(root) {
    const existingHelp = root.querySelector('.help-info');
    if (existingHelp) {
        existingHelp.remove();
        return;
    }

    const help = createElement('help-info',
        createHelpText('Clique', ' nas fatias do relógio para preencher ou limpar.'),
        createHelpText('Shift + rolagem', ' sobre um relógio para redimensioná-lo.'),
        createHelpText('Arraste', ' o relógio ou a linha pela barra lateral.'),
        createHelpText('Clique em ×', ' para remover um relógio; duplo clique na barra remove uma linha.'),
        createHelpText('Shift + clique', ' na barra para alternar a cor do relógio.'),
        createHelpText('Shift + clique', ' na barra da linha para recolhê-la ou expandi-la.'),
        );
    root.append(help);
    help.style.setProperty('--w', `${help.getBoundingClientRect().width}px`);
    help.addEventListener('click', () => help.remove(), {once: true});
};

// Restaura do localStorage as linhas e clocks salvos, incluindo tamanho e
// progresso de cada clock.
const loadState = function(root, storageKey) {
    const rows = root.querySelector('.rows');
    const data = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    for (const rowData of data) {
        rows.append(createRow(rowData, root));
    }
};

// Serializa o estado atual do DOM em JSON para manter o estado entre visitas.
const saveState = function(root, storageKey) {
    const data = Array.from(root.querySelectorAll('.row'), row => ({
        name: row.querySelector('.name').value.trim(),
        clocks: Array.from(row.querySelectorAll('.clock'), clock => ({
            description: clock.querySelector('.description').value.trim(),
            good: clock.hasAttribute('good'),
            max: Number.parseInt(clock.getAttribute('n'), 10),
            progress: clock.querySelectorAll('[filled]').length,
        })),
        minimized: row.hasAttribute('minimized'),
    }));
    window.localStorage.setItem(storageKey, JSON.stringify(data));
};

// Cria o painel, conecta os botoes, habilita ordenacao e configura carga/salva.
const mountClocks = function(container, storageKey = 'bitd_heist_clocks') {
    const host = typeof container === 'string' ? document.querySelector(container) : container;
    if (!host) {
        throw new Error('O container dos clocks nao foi encontrado.');
    }
    const main = createElement('clocks-app',
        createElement('menu',
            createElement('button new-row',
                createText('text', 'Row'),
            ),
            createElement('button help',
                createText('text', '?'),
            ),
        ),
        createElement('rows'),
    );
    host.append(main);

    main.querySelector('.new-row').addEventListener('click', () => addRow(main));
    main.querySelector('.help').addEventListener('click', () => toggleHelp(main));

    Sortable.create(main.querySelector('.rows'), {
        handle: '.row-handle',
        animation: 150,
        ghostClass: 'dragged-item',
    });

    window.addEventListener('beforeunload', () => saveState(main, storageKey));
    loadState(main, storageKey);
    return {
        element: main,
        getState: () => {
            saveState(main, storageKey);
            return JSON.parse(window.localStorage.getItem(storageKey) || '[]');
        },
        setState: state => {
            main.querySelector('.rows').replaceChildren();
            window.localStorage.setItem(storageKey, JSON.stringify(Array.isArray(state) ? state : []));
            loadState(main, storageKey);
        },
        clear: () => {
            main.querySelector('.rows').replaceChildren();
            window.localStorage.removeItem(storageKey);
        },
    };
};

export {mountClocks};
