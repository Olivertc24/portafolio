/* ============================================================
   CONFIGURACION DEL SITIO
   Este es el unico archivo que hay que editar para poner las
   demos en vivo. Mientras una URL este vacia, la pagina muestra
   la captura de respaldo con un aviso.
   ============================================================ */

window.CONFIG = {

  /* Identidad. Cambiar aqui cambia cabecera, pie y <title> por JS;
     los <title> de cada pagina se editan en su propio HTML. */
  sitio: {
    nombre: "Oliver Triveño",
    lema: "Análisis de datos",
    correo: "olivertc43@gmail.com",
    repo: "https://github.com/Olivertc24/portafolio"
  },

  /* --------------------------------------------------------
     TABLEAU PUBLIC
     Publicar desde Tableau Desktop: Servidor > Tableau Public >
     Guardar en Tableau Public. Copiar aqui la URL de la vista,
     la que se ve en la barra al abrir el tablero publicado:
       https://public.tableau.com/views/LIBRO/NOMBREDELAVISTA
     Sin ?:embed=y ni nada detras: eso lo agrega el sitio.
     -------------------------------------------------------- */
  tableau: {
    /* La URL de la vista publicada, sin parametros: el sitio pone los suyos.
       Se ve en el navegador al publicar, con la forma
       https://public.tableau.com/views/LIBRO/VISTA                        */
    base: "https://public.tableau.com/views/AvilaTec-TableroComercial",

    /* El workbook se publico SIN "mostrar hojas como pestanas", asi que
       Tableau no dibuja barra de navegacion: cada dashboard es una URL
       suelta. La barra la pone el sitio, con estos nombres y rutas. La ruta
       es el nombre de la pestana sin espacios y sin acentos, tal como la
       escribe Tableau en la URL.                                          */
    vistas: [
      { nombre: "Tablero Comercial",     ruta: "TableroComercial" },
      { nombre: "Mezcla y margen",       ruta: "Mezclaymargen" },
      { nombre: "Cobranza y exposición", ruta: "Cobranzayexposicin" },
      { nombre: "Devoluciones",          ruta: "Devoluciones" }
    ],

    ancho: 1500,          // tamano real del dashboard, en px
    alto: 900
  },

  /* --------------------------------------------------------
     SHINYAPPS.IO
     Desde R:  rsconnect::deployApp("avilatec/pronostico")
     Copiar aqui la URL que devuelve el deploy:
       https://CUENTA.shinyapps.io/pronostico/
     -------------------------------------------------------- */
  shiny: {
    url: "",
    alto: 860
  }
};
