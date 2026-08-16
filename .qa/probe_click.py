import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(BASE + "/project/skyline-marina", wait_until="networkidle"); await page.wait_for_timeout(1200)
        info = await page.evaluate("""() => {
          const btn = document.querySelector('[data-testid="similar-view-grid"]');
          const r = btn.getBoundingClientRect();
          const cx = r.left + r.width/2, cy = r.top + r.height/2;
          const el = document.elementFromPoint(cx, cy);
          return { rect: {x: Math.round(cx), y: Math.round(cy)}, hit: el ? (el.tagName + '.' + (el.className.baseVal !== undefined ? '' : String(el.className)).slice(0,60)) : null,
                   hitTestid: el?.getAttribute?.('data-testid'), isBtn: el === btn, inViewport: cy < window.innerHeight };
        }""")
        print("hit test:", info)
        await b.close()
asyncio.run(main())
