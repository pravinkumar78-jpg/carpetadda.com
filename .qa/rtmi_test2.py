import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def dismiss_popup(page):
    try:
        btn = await page.query_selector('[data-testid="scroll-visit-close"], button:has-text("×")')
        if btn: await btn.click(timeout=1500)
    except Exception: pass
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:90]))
        await page.goto(BASE + "/project/skyline-marina", wait_until="networkidle"); await page.wait_for_timeout(1200)
        await dismiss_popup(page)
        await page.click('[data-testid="similar-view-list"]'); await page.wait_for_timeout(300)
        await dismiss_popup(page)
        await page.click('[data-testid="similar-view-grid"]', timeout=8000); await page.wait_for_timeout(300)
        grid = await page.evaluate("() => document.querySelectorAll('[data-testid=\"section-similar\"] [data-testid^=\"project-card-\"]').length")
        print("toggle back to grid, cards:", grid)
        # zoom chain
        await dismiss_popup(page)
        await page.click('[data-testid="all-images-img-0"]'); await page.wait_for_timeout(400)
        await page.click('[data-testid="all-images-zoom-in"]'); await page.wait_for_timeout(200)
        z1 = await page.evaluate("() => document.querySelector('[data-testid=all-images-lightbox-img]').style.transform")
        await page.click('[data-testid="all-images-zoom-in"]'); await page.wait_for_timeout(200)
        z2 = await page.evaluate("() => document.querySelector('[data-testid=all-images-lightbox-img]').style.transform")
        await page.click('[data-testid="all-images-lightbox-next"]'); await page.wait_for_timeout(300)
        z3 = await page.evaluate("() => document.querySelector('[data-testid=all-images-lightbox-img]').style.transform")
        await page.keyboard.press("Escape"); await page.wait_for_timeout(200)
        closed = await page.evaluate("() => !document.querySelector('[data-testid=all-images-lightbox]')")
        scroll_ok = await page.evaluate("() => document.body.style.overflow === ''")
        print("ZOOM:", z1, "→", z2, "| after next:", z3, "| esc closed:", closed, "| body scroll restored:", scroll_ok)
        # negative + property
        await page.goto(BASE + "/project/aksh-boulevard", wait_until="networkidle"); await page.wait_for_timeout(1200)
        neg = await page.evaluate("""() => ({ yt: !!document.querySelector('[data-testid="section-youtube"]'),
          reraLegacyBlock: document.querySelectorAll('[data-testid^="rera-block-"]').length })""")
        print("aksh-boulevard (no yt, legacy rera):", neg)
        await page.goto(BASE + "/properties", wait_until="networkidle"); await page.wait_for_timeout(1200)
        href = await page.evaluate("() => document.querySelector('a[href^=\"/property/\"]').getAttribute('href')")
        await page.goto(BASE + href, wait_until="networkidle"); await page.wait_for_timeout(1200)
        d = await page.evaluate("""() => ({ yt: !!document.querySelector('[data-testid="section-youtube"] iframe'),
          toggle: !!document.querySelector('[data-testid="similar-view-list"]'),
          hov: document.documentElement.scrollWidth > window.innerWidth })""")
        print("property:", href, d)
        if d["toggle"]:
            await dismiss_popup(page)
            await page.click('[data-testid="similar-view-list"]'); await page.wait_for_timeout(300)
            rows = await page.evaluate("() => document.querySelectorAll('[data-testid^=\"similar-list-\"]').length")
            print("property list rows:", rows)
        # mobile youtube aspect check
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto(BASE + "/project/skyline-marina", wait_until="networkidle"); await page.wait_for_timeout(1200)
        mob = await page.evaluate("""() => { const f = document.querySelector('[data-testid="section-youtube"] iframe');
          const r = f.getBoundingClientRect(); return { fits: r.width <= window.innerWidth, hov: document.documentElement.scrollWidth > window.innerWidth }; }""")
        print("mobile youtube:", mob)
        errs = [e for e in errs if "posthog" not in e]
        print("errors:", errs if errs else "none")
        await b.close()
asyncio.run(main())
