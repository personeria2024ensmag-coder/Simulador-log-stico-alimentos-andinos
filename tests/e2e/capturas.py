"""Prueba de navegación e interfaz en computador y celular (Playwright + Chrome).
Uso: python3 -I tests/e2e/capturas.py <url_base> <carpeta_capturas>
"""
import sys, json
from playwright.sync_api import sync_playwright

base, out = sys.argv[1], sys.argv[2]
resultados = []

def check(nombre, cond):
    resultados.append((nombre, bool(cond)))
    print(("PASA " if cond else "FALLA ") + nombre)

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for etiqueta, vp, movil in [("computador", {"width": 1366, "height": 768}, False), ("celular", {"width": 390, "height": 844}, True)]:
        ctx = nav.new_context(viewport=vp, device_scale_factor=2 if movil else 1, is_mobile=movil, has_touch=movil)
        pg = ctx.new_page()
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)))
        pg.on("console", lambda m: errores.append(m.text) if m.type == "error" and "fonts.g" not in m.text else None)
        pg.goto(base + "#inicio"); pg.wait_for_selector("text=Simulador de Decisiones Logísticas")
        pg.screenshot(path=f"{out}/{etiqueta}-01-inicio.png", full_page=True)
        pg.get_by_role("button", name="Nueva partida").first.click()
        pg.wait_for_selector("text=Ficha completa del cargo")
        pg.get_by_role("button", name="Jefe de abastecimiento y proveedores").click()
        pg.get_by_placeholder("Ej.: Equipo 3").fill("Equipo de prueba")
        pg.locator("input[inputmode=numeric]").fill("20261106")
        pg.screenshot(path=f"{out}/{etiqueta}-02-nueva-partida.png", full_page=True)
        pg.get_by_role("button", name="Iniciar campaña").click()
        pg.wait_for_selector("text=Centro de control logístico")
        pg.wait_for_selector("text=Guardado en este navegador", state="attached", timeout=5000)
        check(f"{etiqueta}: crea la partida y abre el centro de control", pg.locator("text=Jefe de abastecimiento y proveedores").count() > 0)
        check(f"{etiqueta}: caja inicial $250 M visible", pg.locator("text=$250,0 M").count() > 0)
        check(f"{etiqueta}: 6 pedidos pendientes", pg.locator("text=PED-000").count() >= 6)
        pg.screenshot(path=f"{out}/{etiqueta}-03-control.png", full_page=True)
        pg.reload(); pg.wait_for_selector("text=Centro de control logístico")
        check(f"{etiqueta}: la partida se recupera al recargar", pg.locator("text=AA-").count() >= 0 and pg.locator("text=Jefe de abastecimiento y proveedores").count() > 0)
        for ruta, texto, n in [("organigrama", "Relaciones entre áreas", "04"), ("mapa", "Red logística de la etapa", "05"), ("configuracion", "Catálogo de productos", "06"), ("inventario", "Disponible en la Fase 3", "07")]:
            pg.goto(base + "#" + ruta); pg.wait_for_selector(f"text={texto}")
            pg.screenshot(path=f"{out}/{etiqueta}-{n}-{ruta}.png", full_page=True)
            check(f"{etiqueta}: abre #{ruta}", True)
        pg.goto(base + "#configuracion"); pg.wait_for_selector("text=20261106")
        check(f"{etiqueta}: semilla registrada visible en configuración", True)
        ancho = pg.evaluate("document.documentElement.scrollWidth")
        check(f"{etiqueta}: sin desbordamiento horizontal (scrollWidth {ancho} ≤ {vp['width']})", ancho <= vp["width"])
        check(f"{etiqueta}: sin errores de JavaScript ({len(errores)})", not errores)
        if errores: print(errores[:5])
        ctx.close()
    nav.close()

fallas = [n for n, ok in resultados if not ok]
print(json.dumps({"total": len(resultados), "fallas": fallas}, ensure_ascii=False))
sys.exit(1 if fallas else 0)
