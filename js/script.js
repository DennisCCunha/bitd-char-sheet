import CharacterSheet from './characterSheet.js';

function devIcon() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const favicon = document.querySelector("link[rel='icon']");
        if (favicon) {
            favicon.setAttribute("href", "./assets/dev-favicon.png");
            console.log("Dev icon set for localhost.");
        }
    }
}

devIcon();
const sheet = new CharacterSheet();
