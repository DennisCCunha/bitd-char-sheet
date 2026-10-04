import layout from './layout.js';

// Single entrypoint: module scripts are deferred, so DOM is already parsed.
// Load layout first, then the page-specific module based on pathname.
layout.initLayout();

let mainScript = null;
const path = window.location.pathname;

if (path.endsWith('/') || path.endsWith('/index.html')) {
    const { default: CharacterSheet } = await import('./characterSheet.js');
    mainScript = new CharacterSheet();
} else if (path.endsWith('/crew.html')) {
    const { default: { CrewSheet } } = await import('./crew.js');
    mainScript = new CrewSheet();
} else if (path.endsWith('/heist.html')) {
    const { default: { HeistSheet } } = await import('./heist.js');
    mainScript = new HeistSheet();
} else {
    console.warn('No page module for path:', path);
}

export default mainScript; 

