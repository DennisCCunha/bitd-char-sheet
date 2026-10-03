import CharacterSheet from './characterSheet.js';
import layout from './layout.js';   


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");
    layout.initLayout();

    const sheet = new CharacterSheet();
}); 

