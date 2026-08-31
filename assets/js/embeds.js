/* ============================================================
   Incrustaciones en vivo.

   El HTML trae la captura de respaldo escrita a mano, asi que la
   pagina sirve sin JavaScript y sin servicios externos. Si en
   config.js hay URL, este script la reemplaza por la demo real.

   Los dashboards de Tableau tienen tamano fijo (1500x900), asi
   que se incrustan a tamano natural y se escalan con transform:
   se ve completo en cualquier ancho, sin barras de scroll.
   ============================================================ */
(function () {
  var cfg = window.CONFIG || {};

  function marco(nodo) { return nodo.querySelector(".marco"); }

  function escalar(caja, ancho, alto) {
    var marco = caja.parentElement;
    var disponible = marco.clientWidth;
    /* Ancho cero = todavia no hay layout (pestana oculta, panel colapsado,
       vista previa de impresion). Sin esto se escribiria scale(0) y encima
       quedaria memorizado como el ancho vigente. Se reintenta por frame en
       vez de confiar solo en el ResizeObserver, que no siempre avisa cuando
       el contenedor pasa de cero a su tamano real; el tope evita quedarse
       girando si el elemento nunca llega a ser visible. */
    if (!disponible) {
      var n = (marco._intentos || 0) + 1;
      marco._intentos = n;
      if (n < 120 && window.requestAnimationFrame) {
        requestAnimationFrame(function () { escalar(caja, ancho, alto); });
      }
      return;
    }
    marco._intentos = 0;
    /* El ResizeObserver vigila el mismo marco cuya altura se ajusta aqui, asi
       que sin este guardia cada ajuste se dispara a si mismo. Solo el ancho
       importa: si no cambio, no hay nada que recalcular. */
    if (marco.dataset.ancho === String(disponible)) return;
    marco.dataset.ancho = disponible;
    var k = Math.min(1, disponible / ancho);
    caja.style.transform = "scale(" + k + ")";
    caja.style.transformOrigin = "top left";
    marco.style.height = Math.round(alto * k) + "px";
  }

  /* ---------- Tableau Public ---------- */
  function apiTableau() {
    if (document.querySelector("script[data-tableau-api]")) return;
    var s = document.createElement("script");
    s.type = "module";
    s.src = "https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js";
    s.setAttribute("data-tableau-api", "");
    document.head.appendChild(s);
  }

  function montarTableau(nodo) {
    var t = cfg.tableau || {};
    var vistas = t.vistas || [];
    if (!t.base || !vistas.length) return;

    var m = marco(nodo);
    m.innerHTML = "";
    m.style.overflow = "hidden";

    /* El dashboard mide 1500x900 fijos: se incrusta a tamano natural y se
       escala, para que se vea completo a cualquier ancho sin scroll. */
    var caja = document.createElement("div");
    caja.style.width = t.ancho + "px";
    caja.style.height = t.alto + "px";
    caja.style.position = "relative";
    m.appendChild(caja);

    var ajustar = function () { escalar(caja, t.ancho, t.alto); };
    ajustar();
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(m);
    window.addEventListener("resize", ajustar);

    /* Cada dashboard se monta UNA vez y despues solo se muestra u oculta.
       Recrear el <tableau-viz> en cada clic costaba ~7 s de recarga; asi el
       primer clic sobre una pestana la carga y los siguientes son
       instantaneos. Se montan bajo demanda, no las cuatro de golpe, para no
       castigar la carga inicial de la pagina. */
    var montadas = [];

    function espera(on) {
      var e = m.querySelector(".cargando");
      if (on && !e) {
        e = document.createElement("div");
        e.className = "cargando";
        e.innerHTML = '<span class="girador"></span>Cargando desde Tableau Public…';
        m.appendChild(e);
      } else if (!on && e) {
        e.remove();
      }
    }

    function mostrar(i) {
      montadas.forEach(function (el, j) {
        if (el) el.style.display = (j === i) ? "block" : "none";
      });
      if (montadas[i]) { espera(false); return; }

      var cont = document.createElement("div");
      cont.style.width = "100%";
      cont.style.height = "100%";
      cont.style.opacity = "0";
      cont.style.transition = "opacity .4s";

      var viz = document.createElement("tableau-viz");
      viz.setAttribute("src", t.base + "/" + vistas[i].ruta);
      viz.setAttribute("width", t.ancho);
      viz.setAttribute("height", t.alto);
      viz.setAttribute("toolbar", "bottom");
      viz.setAttribute("hide-tabs", "true");
      viz.setAttribute("device", "desktop");
      cont.appendChild(viz);
      caja.appendChild(cont);
      montadas[i] = cont;

      espera(true);
      /* Tableau Public tarda varios segundos y un marco vacio parece un error.
         El indicador se retira cuando la vista avisa que ya es interactiva, o
         a los 25 s por si el evento no llega. */
      var listo = function () {
        if (montadas.indexOf(cont) === -1) return;
        espera(false);
        cont.style.opacity = "1";
      };
      viz.addEventListener("firstinteractive", listo);
      setTimeout(listo, 25000);
    }

    /* El workbook esta publicado sin barra de pestanas de Tableau, asi que
       la navegacion entre los cuatro dashboards la pone el sitio. */
    if (vistas.length > 1) {
      var barra = document.createElement("div");
      barra.className = "pestanas";
      barra.setAttribute("role", "tablist");
      vistas.forEach(function (v, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = v.nombre;
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", i === 0 ? "true" : "false");
        b.addEventListener("click", function () {
          barra.querySelectorAll ("button").forEach(function (o) {
            o.setAttribute("aria-selected", "false");
          });
          b.setAttribute("aria-selected", "true");
          mostrar(i);
        });
        barra.appendChild(b);
      });
      m.parentNode.insertBefore(barra, m);
    }

    mostrar(0);
    apiTableau();
    nodo.classList.add("en-vivo");
  }

  /* ---------- shinyapps.io ---------- */
  function montarShiny(nodo) {
    var s = cfg.shiny || {};
    if (!s.url) return;

    var m = marco(nodo);
    var f = document.createElement("iframe");
    f.src = s.url;
    f.title = "Explorador del pronostico (Shiny)";
    f.loading = "lazy";
    f.style.height = (s.alto || 860) + "px";
    f.setAttribute("allow", "fullscreen");
    m.innerHTML = "";
    m.appendChild(f);
    nodo.classList.add("en-vivo");
  }

  document.querySelectorAll("[data-demo]").forEach(function (nodo) {
    if (nodo.dataset.demo === "tableau") montarTableau(nodo);
    if (nodo.dataset.demo === "shiny") montarShiny(nodo);
  });
})();
