#!/usr/bin/env python3
"""Genera las imagenes del portafolio a partir de los proyectos reales.

    python3 capturas.py tableau     # las cuatro pestanas del tablero
    python3 capturas.py shiny       # la app del pronostico (necesita Safari)

TABLEAU. No se captura la pantalla: se usa "Dashboard > Exportar imagen...",
que renderiza el dashboard completo a su tamano real (1500x900 @2x) sin la
interfaz de Tableau alrededor y sin el recorte que impone el ancho de la
ventana. Las pestanas se cambian por el menu "Ventana", que las lista por
nombre, asi que no hacen falta coordenadas de clic.

Requiere permiso de Accesibilidad para el proceso que ejecuta el script
(System Events maneja los menus y el dialogo de guardado).
"""
import subprocess, sys, time
from pathlib import Path
import Quartz
from PIL import Image

SITIO = Path(__file__).resolve().parent
IMG = SITIO / "assets" / "img"
TWBX = SITIO.parent / "avilatec" / "tableau" / "AvilaTec - Tablero Comercial.twbx"

# nombre de la pestana en el menu "Ventana"  ->  archivo de salida
PESTANAS = [
    ("Tablero Comercial",     "tableau-tablero-comercial.png"),
    ("Mezcla y margen",       "tableau-mezcla-margen.png"),
    ("Cobranza y exposición", "tableau-cobranza.png"),
    ("Devoluciones",          "tableau-devoluciones.png"),
]

ANCHO_MAX = 2000          # ancho final de las imagenes del sitio


def osa(guion):
    r = subprocess.run(["osascript", "-e", guion], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr.strip())
    return r.stdout.strip()


def ventanas_tableau():
    ws = Quartz.CGWindowListCopyWindowInfo(
        Quartz.kCGWindowListOptionAll | Quartz.kCGWindowListExcludeDesktopElements,
        Quartz.kCGNullWindowID)
    return [w for w in ws if "Tableau" in (w.get("kCGWindowOwnerName") or "")]


def ventana_lista():
    """La ventana del workbook, ya visible. kCGWindowIsOnscreen es la senal
    buena: la del dialogo de carga sigue en la lista aunque ya no se vea."""
    for w in ventanas_tableau():
        if ("AvilaTec" in (w.get("kCGWindowName") or "")
                and w.get("kCGWindowBounds", {}).get("Width", 0) > 900
                and w.get("kCGWindowIsOnscreen")):
            return w
    return None


def abrir_tableau():
    if ventana_lista():
        print("· Tableau ya tiene el workbook abierto")
        return
    print("· abriendo el workbook (el extracto son 100 MB, tarda unos minutos)")
    subprocess.run(["open", str(TWBX)])
    for i in range(300):
        time.sleep(1)
        for w in ventanas_tableau():
            if (w.get("kCGWindowName") or "").startswith("No se puede"):
                sys.exit("ERROR: Tableau no pudo cargar el workbook")
        if ventana_lista():
            time.sleep(10)          # que termine de consultar y dibujar
            print(f"· listo en {i}s")
            return
    sys.exit("ERROR: la ventana no aparecio en 300s")


def menu(barra, item):
    osa(f'tell application "System Events" to tell process "Tableau" '
        f'to click menu item "{item}" of menu 1 of menu bar item "{barra}" of menu bar 1')


def exportar(archivo):
    """Dashboard > Exportar imagen... y guarda en assets/img/<archivo>.

    El dialogo de guardado se maneja por teclado: cmd+shift+G acepta una ruta
    absoluta, y despues cmd+A reemplaza el nombre propuesto."""
    destino = IMG / archivo
    destino.unlink(missing_ok=True)
    menu("Dashboard", "Exportar imagen...")
    time.sleep(3)
    osa(f'''tell application "System Events" to tell process "Tableau"
        keystroke "g" using {{command down, shift down}}
        delay 1.2
        keystroke "{IMG}/"
        delay 1.2
        key code 36
        delay 1.5
        keystroke "a" using {{command down}}
        delay 0.4
        keystroke "{destino.stem}"
        delay 0.8
        key code 36
    end tell''')
    for _ in range(30):
        time.sleep(1)
        if destino.exists():
            time.sleep(1)
            return destino
    sys.exit(f"ERROR: no aparecio {destino}")


def encoger(ruta, ancho=ANCHO_MAX):
    im = Image.open(ruta)
    orig = im.size
    im.thumbnail((ancho, ancho * 3), Image.LANCZOS)
    im.convert("RGB").save(ruta, optimize=True)
    return orig, im.size


def tableau():
    IMG.mkdir(parents=True, exist_ok=True)
    abrir_tableau()
    osa('tell application "Tableau" to activate')
    time.sleep(1)
    for nombre, archivo in PESTANAS:
        menu("Ventana", nombre)
        time.sleep(6)                # que la pestana termine de consultar
        ruta = exportar(archivo)
        orig, fin = encoger(ruta)
        print(f"  {archivo}: {orig[0]}x{orig[1]} -> {fin[0]}x{fin[1]}")


def shiny(url="http://127.0.0.1:7799", archivo="shiny-pronostico.png"):
    """Captura la app en Safari por id de ventana y recorta el cromo del
    navegador. Safari sirve porque esta en cualquier Mac; headless Chrome no
    esta instalado y webshot2 lo necesita."""
    IMG.mkdir(parents=True, exist_ok=True)
    osa(f'tell application "Safari" to make new document with properties {{URL:"{url}"}}')
    osa('tell application "Safari" to set bounds of front window to {0, 0, 1440, 1080}')
    time.sleep(12)                   # que Shiny conecte y dibuje los graficos
    ws = Quartz.CGWindowListCopyWindowInfo(
        Quartz.kCGWindowListOptionAll | Quartz.kCGWindowListExcludeDesktopElements,
        Quartz.kCGNullWindowID)
    cand = [w for w in ws if (w.get("kCGWindowOwnerName") or "") == "Safari"
            and w.get("kCGWindowIsOnscreen")
            and w.get("kCGWindowBounds", {}).get("Height", 0) > 400]
    if not cand:
        sys.exit("ERROR: no encontre la ventana de Safari")
    wid = cand[0]["kCGWindowNumber"]
    Quartz.CGWarpMouseCursorPosition(Quartz.CGPointMake(4, 4))
    time.sleep(1)
    ruta = IMG / archivo
    subprocess.run(["screencapture", "-x", "-o", "-l", str(wid), str(ruta)], check=True)
    im = Image.open(ruta)
    escala = im.size[0] / 1440
    im = im.crop((0, int(52 * escala), im.size[0], im.size[1]))   # fuera la barra de Safari (ajustar si recorta el titulo)
    im.convert("RGB").save(ruta, optimize=True)
    orig, fin = encoger(ruta)
    print(f"  {archivo}: {orig[0]}x{orig[1]} -> {fin[0]}x{fin[1]}")


if __name__ == "__main__":
    que = sys.argv[1] if len(sys.argv) > 1 else "tableau"
    {"tableau": tableau, "shiny": shiny}[que]()
