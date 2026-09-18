export default class Banner {
    static renderBanner(id, className) {
        const banner = document.createElement('label');
        banner.id = id;
        banner.htmlFor = `cb_${id}`;

        let label = document.createElement('label');
        label.className = 'banner ' + className;
        label.htmlFor = `cb_${id}`;

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `cb_${id}`;
        label.appendChild(checkbox);

        let borderWrapper = document.createElement('div');
        borderWrapper.className = 'border-wrapper';

        let checkmark = document.createElement('span');
        checkmark.className = 'checkmark';

        borderWrapper.appendChild(checkmark);
        label.appendChild(borderWrapper);
        banner.appendChild(label);

        return banner;
    }

    /** Renders `count` banners into `container` (element or id), named `${bannerId}_${n}`. */
    static renderGroup(container, bannerId, className, count) {
        const containerEl = typeof container === 'string' ? document.getElementById(container) : container;
        if (!containerEl) return;
        for (let index = 0; index <= count; index++) {
            containerEl.appendChild(this.renderBanner(`${bannerId}_${index + 1}`, className));
        }
        return containerEl;
    }
}