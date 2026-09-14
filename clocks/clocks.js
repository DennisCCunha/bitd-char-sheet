const MIN = 3;
const INC = 2;


let d = function(c, ...children) {
    let e = $(`<div class="${c}">`);
    for (let child of children) {
        child.appendTo(e);
    }
    return e;
}
let input = function(c, attributes) {
    let e = $(`<input class="${c}">`);
    for (let k in attributes) {
        e.attr(k, attributes[k]);
    }
    return e;
}

d.row = function({name='', clocks=[], minimized=false}={name: '', clocks: [], minimized: false}) {
    let e = d('row', 
        d('handle row-handle'), 
        d('inner', 
            input('name', {placeholder: 'Row'}).val(name), 
            d('clocks', 
                ...clocks.map(c => d.clock(c)), 
                d.spawner(), 
            ), 
        ), 
    );
    if (minimized) {
        e.attr('minimized', '');
    }
    let s = Sortable.create(e.find('.clocks').get(0), {
        handle: '.clock-handle',
        animation: 150, 
        ghostClass: 'dragged-item', 
        onStart: event => $('.rows').attr('dragging', ''), 
        onEnd: event => {
            $('.row').each((i, r) => {
                let e = $(r);
                e.find('.spawner').insertAfter(e.find('.clock').last());
            });
            $('.rows').removeAttr('dragging');
        }, 
    });
    s.option('group', {
        name: 'clocks', 
        pull: true, 
        put: ['clocks'], 
    });
    e.find('.row-handle').on('click', event => {
        if (event.shiftKey) {
            e.is('[minimized]') ? e.removeAttr('minimized') : e.attr('minimized', '');
        }
    });
    e.find('.row-handle').on('dblclick', event => {
        s.destroy();
        e.remove();
    });
    e.find('.button.bad').on('click', event => add_clock(false, e));
    e.find('.button.good').on('click', event => add_clock(true, e));
    return e;
}
d.spawner = function() {
    return d('spawner', 
        d('button bad', 
            d('icon'), 
        ), 
        d('bar', 
            d('paint', 
                d('strokes', 
                    d('stroke s1'), 
                    d('stroke s2'), 
                ), 
            ), 
        ), 
        d('button good', 
            d('icon'), 
        ), 
    );
}
d.clock = function({description='', good=false, max=4, progress=undefined}={description: '', good: false, max: 4, progress: undefined}) {
    let e = d('clock', 
        d('banner', 
            d('handle clock-handle'), 
            input('description', {placeholder: 'Clock'}).val(description), 
        ), 
        d('widget', 
            d('core'), 
            d('disc'), 
        ), 
    ).attr(good ? 'good' : 'bad', '')
    d.clock.populate(e, max, progress);
    e.on('click', event => click_clock(e, event));
    e.find('.widget').on('wheel', event => scale_clock(e, event));
    e.find('.clock-handle').on('click', event => toggle_clock(e, event));
    e.find('.clock-handle').on('dblclick', event => remove(e, event));
    return e;
}
d.clock.populate = function(e, n, progress) {
    progress = progress == undefined ? Math.min(e.find('.slice[filled]').length, n) : progress;
    let core = e.find('.core');
    core.empty();
    for (let i = 0; i < n; i++) {
        let slice = d('slice').attr('i', i).appendTo(core);
        slice.get(0).style.setProperty('--i', i);
        slice.mouseenter(() => update_clock(e, i, true));
        slice.mouseleave(() => update_clock(e, i, false));
        if (i < progress) {
            slice.attr('filled', '');
        }
    }
    for (let i = 0; i < n; i++) {
        let bar = d('bar', d('paint')).attr('i', i).appendTo(core);
        bar.get(0).style.setProperty('--i', i);
    }
    e.attr('n', n);
    e.get(0).style.setProperty('--n', n);
    return e;
}

let add_row = function() {
    return d.row().appendTo($('.rows'));
}
let add_clock = function(good=false, row=undefined) {
    row = row ? row : $('.row').last();
    if (row.length == 0) {
        row = add_row();
    }
    let e = d.clock({good: good}).appendTo(row.find('.clocks'));
    row.find('.spawner').insertAfter(e);
    return e;
}
let click_clock = function(clock, event) {
    let target = $(event.target);
    if (!target.is('.slice')) {
        return;
    }
    let i = parseInt(target.attr('i'));
    let filling = clock.find(`.slice[i="${i}"]`).attr('filled') == undefined;
    clock.find('.slice').each((j, e) => {
        if (j > i || (j == i && !filling)) {
            $(e).removeAttr('filled');
        } else {
            $(e).attr('filled', '');
        }
    });
    update_clock(clock, i, true);
}
let update_clock = function(clock, i, inside) {
    if (inside) {
        let filling = clock.find(`.slice[i="${i}"]`).attr('filled') == undefined;
        clock.find('.slice').each((j, e) => {
            let slice = $(e);
            let filled = slice.attr('filled') != undefined;
            let change = filling ? 
                j < i && !filled : 
                j > i && filled;
            if (change) {
                slice.attr('will-change', '');
            } else {
                slice.removeAttr('will-change');
            }
        });
    } else {
        clock.find('.slice').removeAttr('will-change');
    }
}
let scale_clock = function(clock, event) {
    if (!event.shiftKey) {
        return;
    }
    event.preventDefault();
    // event.stopPropagation();
    let size = parseInt(clock.attr('n'));
    let modifier = event.originalEvent.deltaY > 0 ? -INC : INC;
    if (size == MIN && modifier > 0) {
        modifier = 1; // Special sauce to allow MIN=3 but INC=2
    }
    let n = Math.max(MIN, size + modifier);
    if (n != size) {
        d.clock.populate(clock, n);
    }
}
let toggle_clock = function(clock, event) {
    if (!event.shiftKey) {
        return;
    }
    if (clock.attr('good') == undefined) {
        clock.removeAttr('bad');
        clock.attr('good', '');
    } else {
        clock.removeAttr('good');
        clock.attr('bad', '');
    }
}
let remove = function(e, event) {
    if (event.shiftKey) {
        return;
    }
    e.remove();
}
let help = function() {
    let e = $('.help-info');
    if (e.length) {
        e.remove();
    } else {
        e = d('help-info', 
            d('text').html('<b>Click</b> a clock\'s segments to fill or clear them.'), 
            d('text').html('<b>Shift+scrollwheel</b> while over a clock to resize it.'), 
            d('text').html('<b>Drag</b> any clock or row via its grey bar.'), 
            d('text').html('<b>Double click</b> a grey bar to remove that clock or row.'), 
            d('text').html('<b>Shift+click</b> a grey bar to toggle that clock\'s color.'), 
            d('text').html('<b>Shift+click</b> a grey bar to hide or unhide that row.'), 
        ).appendTo($('.main'));
        e.get(0).style.setProperty('--w', `${e.width()}px`);
        e.one('click', event => e.remove());
    }
}


let load = function() {
    let rows = $('.rows');
    let data = JSON.parse(window.localStorage.getItem('data'));
    for (let row of data) {
        d.row(row).appendTo(rows);
    }
}
let save = function() {
    let data = $('.row')
        .map((i, r) => ({
            name: $(r).find('.name').val().trim(), 
            clocks: $(r).find('.clock')
                .map((j, c) => ({
                    description: $(c).find('.description').val().trim(), 
                    good: $(c).attr('good') != undefined, 
                    max: parseInt($(c).attr('n')), 
                    progress: $(c).find('[filled]').length, 
                }))
                .get(), 
            minimized: $(r).is('[minimized]'), 
        }))
        .get();
    window.localStorage.setItem('data', JSON.stringify(data));
}


let initialize = function() {
    let main = d('main', 
        d('menu', 
            d('button new-row', 
                d('text').text('Row'), 
            ), 
            d('button bad-clock', 
                d('text').text('Clock (bad)'), 
            ), 
            d('button good-clock', 
                d('text').text('Clock (good)'), 
            ), 
            d('button help', 
                d('text').text('?'), 
            ), 
        ), 
        d('rows'), 
    ).appendTo($('body'));

    main.find('.new-row').on('click', e => add_row());
    main.find('.bad-clock').on('click', e => add_clock());
    main.find('.good-clock').on('click', e => add_clock(true));
    main.find('.help').on('click', e => help());

    Sortable.create($('.rows').get(0), {
        handle: '.row-handle',
        animation: 150, 
        ghostClass: 'dragged-item', 
    });

    window.addEventListener('beforeunload', save);
    load();
}
initialize();



// Exports.
let script = {};
export {script};
