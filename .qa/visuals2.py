import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def dismiss(page):
    for _ in range(3):
        try:
            b = await page.query_selector('[data-testid="scroll-visit-close"]')
            if b: await b.click(timeout=800); await page.wait_for_timeout(300)
        except Exception: pass
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(BASE + "/project/skyline-marina", wait_until="networkidle"); await page.wait_for_timeout(1500)
        el = await page.query_selector('[data-testid="section-rera-details"]')
        await el.scroll_into_view_if_needed(); await dismiss(page); await page.wait_for_timeout(300)
        await page.screenshot(path="/tmp/rera_section.jpg", type="jpeg", quality=40)
        el2 = await page.query_selector('[data-testid="all-images-section"]')
        await el2.scroll_into_view_if_needed(); await dismiss(page)
        await page.click('[data-testid="all-images-img-0"]', timeout=8000); await page.wait_for_timeout(400)
        await page.click('[data-testid="all-images-zoom-in"]'); await page.click('[data-testid="all-images-zoom-in"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path="/tmp/zoom.jpg", type="jpeg", quality=40)
        await page.goto(BASE + "/rtmi", wait_until="networkidle"); await page.wait_for_timeout(1200)
        await page.screenshot(path="/tmp/rtmi_page.jpg", type="jpeg", quality=40)
        print("done")
        await b.close()
asyncio.run(main())
