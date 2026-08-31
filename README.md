# Portafolio

Sitio estático de casos de análisis de datos. **Sin build, sin dependencias, sin
framework**: son archivos HTML, una hoja de estilo y tres scripts. Cualquier
servidor que sirva archivos lo sirve — hoy GitHub Pages, mañana un VPS con nginx,
sin tocar una línea.

```
index.html                    portada
proyectos/
  avilatec-tablero.html       caso 1 · Tableau
  avilatec-pronostico.html    caso 2 · R + fable
assets/
  css/estilo.css              todo el sistema visual
  js/config.js                <- EL UNICO ARCHIVO QUE HAY QUE EDITAR
  js/sitio.js                 tema claro/oscuro y datos de la cabecera
  js/embeds.js                monta las demos en vivo
  img/                        capturas, generadas con capturas.py
capturas.py                   regenera las imagenes desde los proyectos reales
```

## Verlo en local

```bash
python3 -m http.server 8080
```

Y abrir <http://localhost:8080>. No hace falta nada más.

## Poner las demos en vivo

Las dos páginas de caso muestran una captura con el aviso «demo en vivo
pendiente». En cuanto haya URL en `assets/js/config.js`, esa captura se
reemplaza sola por la demo real. Si un servicio se cae, basta con vaciar la URL
y vuelve la captura.

### 1 · El tablero, en Tableau Public — **ya publicado**

Está en línea en
`https://public.tableau.com/views/AvilaTec-TableroComercial/<vista>`,
con las cuatro pestañas publicadas como vistas independientes.

Dos cosas que se aprendieron publicándolo, y que hay que repetir si algún día se
republica:

**El Tableau Desktop «Free Edition» no publica.** Tiene el menú
`Servidor` entero deshabilitado — Tableau Public incluido — y no avisa por qué;
el log lo dice (`free edition license detected, enabling free edition mode`).
Para publicar hace falta **Tableau Desktop Public Edition**, que es un producto
distinto y también gratuito. Ojo al abrir el `.twbx`: el doble clic lo toma la
edición que esté registrada como predeterminada, así que hay que forzar
*Abrir con*.

**Se publicó sin «mostrar hojas como pestañas»**, así que Tableau no dibuja
barra de navegación y cada dashboard queda como una URL suelta. En vez de
republicar, la barra la pone el sitio: `assets/js/config.js` lista las cuatro
vistas con su nombre visible y su ruta, y `embeds.js` construye las pestañas y
cambia la vista al hacer clic. Sale mejor así — las etiquetas llevan acentos y
el estilo es el del sitio.

La ruta de cada vista es el nombre de la pestaña **sin espacios y sin
acentos**, tal como Tableau la escribe en la URL: `Cobranza y exposición` se
convierte en `Cobranzayexposicin`. Si se renombra una pestaña, hay que
actualizar su `ruta` en `config.js`.

> **Todo lo que se publica en Tableau Public es público.** Aquí no importa
> porque los datos de AvilaTec son sintéticos, pero conviene tenerlo presente
> antes de subir el workbook de un cliente.

El dashboard mide 1500×900 px fijos. `embeds.js` lo incrusta a tamaño natural y
lo escala con `transform`, así que se ve completo en cualquier ancho de pantalla
sin barras de scroll.

### 2 · El pronóstico, en shinyapps.io

El plan gratuito da 5 aplicaciones y 25 horas activas al mes. Suficiente para un
portafolio; si se agotan, la app duerme y la página vuelve a mostrar la captura.

```r
install.packages("rsconnect")
rsconnect::setAccountInfo(name = "...", token = "...", secret = "...")  # panel de shinyapps.io
rsconnect::deployApp("../avilatec/pronostico", appName = "pronostico")
```

La app **no reentrena nada**: lee los CSV de `pronostico/salidas/`, que pesan
poco. Hay que asegurarse de que esa carpeta y `www/` viajen en el deploy.

Copiar la URL que devuelve el deploy —`https://CUENTA.shinyapps.io/pronostico/`—
en `assets/js/config.js`, en `shiny.url`.

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "Portafolio: primeros dos casos"
git branch -M main
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin main
```

Después, en GitHub: **Settings › Pages › Source: Deploy from a branch**, rama
`main`, carpeta `/ (root)`. En un par de minutos queda en
`https://USUARIO.github.io/REPO/`.

El archivo `.nojekyll` está ahí para que GitHub sirva los archivos tal cual, sin
pasarlos por Jekyll.

**Si el repo va a contener también las carpetas `avilatec/` y `tecnored-caso/`,
el sitio tiene que quedar en la raíz de su propio repo o Pages servirá la
estructura completa.** Lo más limpio es un repositorio solo para `portafolio/`.
Y ojo con subir `avilatec.sqlite` (518 MB) o el `.hyper` (100 MB): GitHub rechaza
archivos de más de 100 MB y Pages tiene un tope de 1 GB por sitio. Conviene un
`.gitignore` que los excluya.

## Migrar a un servidor propio

No hay nada que migrar, en el sentido habitual: se copia la carpeta y ya.

```bash
rsync -av --delete ./ usuario@servidor:/var/www/portafolio/
```

Con nginx basta un `server` que apunte a esa raíz:

```nginx
server {
    listen 80;
    server_name ejemplo.com;
    root /var/www/portafolio;
    index index.html;
}
```

Las tres cosas a revisar el día de la mudanza:

1. **Rutas relativas.** Todos los enlaces del sitio ya lo son, así que funciona
   igual en la raíz del dominio que en un subdirectorio.
2. **HTTPS.** Los embeds de Tableau Public y shinyapps.io son `https`. Si el
   sitio se sirve por `http`, el navegador bloquea el contenido mixto y las
   demos no cargan. Certificado con `certbot` y listo.
3. **Recursos externos.** El sitio solo pide fuentes a Google Fonts y, si hay
   demos configuradas, la API de Tableau Public. Si el servidor debe funcionar
   sin salida a internet, hay que descargar las dos fuentes a `assets/` y
   cambiar el `<link>` de cada página.

## Regenerar las capturas

```bash
python3 capturas.py tableau    # las cuatro pestañas del tablero
python3 capturas.py shiny      # la app del pronóstico (levantarla antes)
```

El tablero **no se captura de pantalla**: se usa `Dashboard › Exportar imagen…`,
que renderiza el dashboard completo a tamaño real, sin la interfaz de Tableau
alrededor y sin el recorte que impone el ancho de la ventana. Las pestañas se
cambian desde el menú `Ventana`, que las lista por nombre, así que no hacen falta
coordenadas de clic. Requiere permiso de **Accesibilidad** para la terminal.

Para la app de Shiny hay que tenerla corriendo (`avilatec/pronostico/ejecutar.sh`)
y el script la fotografía en Safari por id de ventana.

## Cambiar el nombre del sitio

Está en `assets/js/config.js`, en `sitio.nombre` y `sitio.lema`: la cabecera y el
pie de las tres páginas lo leen de ahí. Lo que hay que editar a mano en cada
archivo es el `<title>` y las etiquetas `og:` — son tres archivos.

## Agregar un caso nuevo

1. Copiar `proyectos/avilatec-pronostico.html` como plantilla.
2. Añadir una tarjeta en la rejilla `.proyectos` de `index.html`.
3. Generar la miniatura en `assets/img/`.

Las clases están en español y descritas en `assets/css/estilo.css`: `.tarjeta`,
`.cifras`, `.destacado`, `.nota`, `.galeria`, `.incrustacion`.
