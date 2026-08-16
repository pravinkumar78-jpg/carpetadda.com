import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:90]))
        # 1) homepage RTMI section
        await page.goto(BASE + "/", wait_until="networkidle"); await page.wait_for_timeout(1500)
        d = await page.evaluate("""() => ({
          section: !!document.querySelector('[data-testid="rtmi-projects"]'),
          cards: document.querySelectorAll('[data-testid="rtmi-projects"] [data-testid^="project-card-"], [data-testid="rtmi-projects"] a[href^="/project/"]').length,
          navRtmi: !!document.querySelector('[data-testid="nav-rtmi"]'),
        })""")
        print("HOME RTMI:", d)
        # 2) RTMI nav → page
        await page.click('[data-testid="nav-rtmi"]'); await page.wait_for_timeout(1500)
        cnt = await page.inner_text('[data-testid="rtmi-count"]')
        print("RTMI PAGE:", page.url, "|", cnt)
        # click first card → detail
        await page.click('[data-testid="rtmi-list"] a[href^="/project/"] >> nth=0')
        await page.wait_for_timeout(1500)
        print("RTMI card → detail:", page.url)
        await page.close()

        # 3) project detail: RERA blocks, youtube, master plan, similar toggle
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda e: errs.append(str(e)[:90]))
        await page.goto(BASE + "/project/skyline-marina", wait_until="networkidle"); await page.wait_for_timeout(1500)
        d = await page.evaluate("""() => ({
          reraBlocks: document.querySelectorAll('[data-testid^="rera-block-"]').length,
          reraCert: !!document.querySelector('[data-testid="rera-cert-0"]'),
          reraLink: !!document.querySelector('[data-testid="rera-link-0"]'),
          qrHref: document.querySelector('[data-testid="rera-qr-0"]')?.getAttribute('href'),
          youtube: !!document.querySelector('[data-testid="section-youtube"] iframe'),
          ytSrc: document.querySelector('[data-testid="section-youtube"] iframe')?.src,
          masterPlanInGallery: [...document.querySelectorAll('[data-testid^="all-images-img-"]')].some(b => (b.textContent||"").includes("Master Plan")),
          similarToggle: !!document.querySelector('[data-testid="similar-view-list"]'),
        })""")
        print("PROJECT DETAIL:", d)
        # similar list toggle
        await page.click('[data-testid="similar-view-list"]'); await page.wait_for_timeout(400)
        lst = await page.evaluate("""() => document.querySelectorAll('[data-testid^="similar-list-"]').length""")
        href = await page.get_attribute('[data-testid^="similar-list-"] >> nth=0', "href")
        print("SIMILAR list rows:", lst, "| first href:", href)
        await page.click('[data-testid="similar-view-grid"]'); await page.wait_for_timeout(300)
        # lightbox zoom
        await page.click('[data-testid="all-images-img-0"]'); await page.wait_for_timeout(400)
        await page.click('[data-testid="all-images-zoom-in"]'); await page.wait_for_timeout(200)
        z1 = await page.evaluate("() => document.querySelector('[data-testid=all-images-lightbox-img]').style.transform")
        await page.click('[data-testid="all-images-zoom-in"]'); await page.wait_for_timeout(200)
        z2 = await page.evaluate("() => document.querySelector('[data-testid=all-images-lightbox-img]').style.transform")
        await page.click('[data-testid="all-images-lightbox-next"]'); await page.wait_for_timeout(300)
        z3 = await page.evaluate("() => document.querySelector('[data-testid=all-images-lightbox-img]').style.transform")
        print("ZOOM:", z1, "→", z2, "| after next:", z3)
        await page.keyboard.press("Escape")
        await page.close()

        # 4) negative: project without youtube (aksh-boulevard) hides section
        page = await b.new_page(viewport={"width": 390, "height": 844})
        page.on("pageerror", lambda e: errs.append(str(e)[:90]))
        await page.goto(BASE + "/project/aksh-boulevard", wait_until="networkidle"); await page.wait_for_timeout(1200)
        neg = await page.evaluate("""() => ({
          yt: !!document.querySelector('[data-testid="section-youtube"]'),
          hOverflow: document.documentElement.scrollWidth > window.innerWidth,
        })""")
        print("NEGATIVE (no yt):", neg)
        await page.close()

        # 5) property detail youtube + similar toggle
        page = await b.new_page(viewport={"width": 390, "height": 844})
        page.on("pageerror", lambda e: errs.append(str(e)[:90]))
        await page.goto(BASE + "/properties", wait_until="networkidle"); await page.wait_for_timeout(1200)
        slug = await page.get_attribute('[data-testid^="property-card-"] >> nth=0', "href") or await page.evaluate("() => document.querySelector('a[href^=\"/property/\"]').getAttribute('href')")
        await page.goto(BASE + slug, wait_until="networkidle"); await page.wait_for_timeout(1200)
        d = await page.evaluate("""() => ({
          yt: !!document.querySelector('[data-testid="section-youtube"] iframe'),
          toggle: !!document.querySelector('[data-testid="similar-view-list"]'),
          hOverflow: document.documentElement.scrollWidth > window.innerWidth,
        })""")
        print("PROPERTY DETAIL:", slug, d)
        if d["toggle"]:
            await page.click('[data-testid="similar-view-list"]'); await page.wait_for_timeout(300)
            rows = await page.evaluate("() => document.querySelectorAll('[data-testid^=\"similar-list-\"]').length")
            print("property similar list rows:", rows)
        await page.close()
        errs2 = [e for e in errs if "posthog" not in e]
        print("PAGE ERRORS:", errs2 if errs2 else "none")
        await b.close()
asyncio.run(main())
