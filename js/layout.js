const nav = document.querySelector("#site-nav");
const footer = document.querySelector("#site-footer");

if (nav) {
  nav.classList.add("floating-nav");
  nav.innerHTML = `
    <img src="./assets/blades-logo-red.png" class="logo" alt="Logo">

    <div class="nav-items">
      <a class="nav-item button" href="./index.html">Personagem</a>
      <a class="nav-item" href="./crew.html">Bando</a>
      <a class="nav-item" href="./heist.html">Golpe</a>
    </div>
  `;
}

if (footer) {
  footer.classList.add("rodape");
  footer.innerHTML = `
    <p>
      Desenvolvido por
      <a href="https://github.com/DennisCCunha" target="_blank">
        <strong>Brocolis.ninja</strong>
      </a>
    </p>
    <p>
      Blades in the Dark™ is a trademark of One Seven Design.
      The Forged in the Dark Logo is © One Seven Design.
    </p>
  `;
}