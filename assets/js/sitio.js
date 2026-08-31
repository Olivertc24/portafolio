/* Tema claro/oscuro. Por defecto sigue al sistema; el boton fija
   una preferencia que se recuerda en este navegador. */
(function () {
  var raiz = document.documentElement;
  try {
    var guardado = localStorage.getItem("tema");
    if (guardado) raiz.setAttribute("data-tema", guardado);
  } catch (e) { /* modo privado: se queda con el del sistema */ }

  document.addEventListener("click", function (ev) {
    var boton = ev.target.closest(".tema");
    if (!boton) return;
    var oscuroAhora = raiz.getAttribute("data-tema")
      ? raiz.getAttribute("data-tema") === "oscuro"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var nuevo = oscuroAhora ? "claro" : "oscuro";
    raiz.setAttribute("data-tema", nuevo);
    boton.setAttribute("aria-label", nuevo === "oscuro" ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    try { localStorage.setItem("tema", nuevo); } catch (e) {}
  });

  /* Nombre del sitio y correo desde config.js */
  var c = window.CONFIG || {};
  if (c.sitio) {
    document.querySelectorAll("[data-sitio-nombre]").forEach(function (n) { n.textContent = c.sitio.nombre; });
    document.querySelectorAll("[data-sitio-lema]").forEach(function (n) { n.textContent = c.sitio.lema; });
    document.querySelectorAll("[data-sitio-correo]").forEach(function (n) {
      n.textContent = c.sitio.correo; n.href = "mailto:" + c.sitio.correo;
    });
    document.querySelectorAll("[data-sitio-repo]").forEach(function (n) {
      if (c.sitio.repo) { n.href = c.sitio.repo; } else { n.hidden = true; }
    });
  }

  document.querySelectorAll("[data-anio]").forEach(function (n) {
    n.textContent = new Date().getFullYear();
  });
})();
