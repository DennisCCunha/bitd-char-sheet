function loadLayout() {
  let nav = document.querySelector("#site-nav");
  let footer = document.querySelector("#site-footer");
  let body = document.querySelector("body");
  
  const navItems =  `
      <img src="./assets/blades-logo-red.png" class="logo" alt="Logo">

      <div class="nav-items">
        <a class="nav-item nav-button" href="./index.html">Personagem</a>
        <a class="nav-item nav-button" href="./crew.html">Bando</a>
        <a class="nav-item nav-button" href="./heist.html">Golpe</a>
      </div>
    `;

  const footerContent = `
      <p>
        Desenvolvido por
        <a href="https://github.com/DennisCCunha" target="_blank">
          <strong>Brocolis.ninja</strong>
        </a>
      </p>
      <p>
        Blades in the Dark™ is a trademark of <strong>One Seven Design</strong>.
        The Forged in the Dark Logo is copyrighted by <strong>One Seven Design</strong>.
        This website is not affiliated with or endorsed by <strong>One Seven Design</strong>.
        This website is for informational purposes only built using content provided by the SRD (System Reference Document).
      </p>
    `;

  if (!nav) {
    nav = document.createElement("nav");
    nav.id = "site-nav";
    nav.classList.add("floating-nav");
    body.insertBefore(nav, body.firstChild);
  }
 
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "site-footer";
    body.appendChild(footer);
  }

  if (!nav.innerHTML) {
    nav.innerHTML = navItems;
  }

  if (footer) {
    footer.classList.add("rodape");
    footer.innerHTML = footerContent;
  }
}

function devIcon() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const favicon = document.querySelector("link[rel='icon']");
        if (favicon) {
            favicon.setAttribute("href", "./assets/dev-favicon.png");
            console.log("Dev icon set for localhost.");
        }
    }
}


function initLayout() {
    loadLayout();
    devIcon();
}


export default { initLayout };