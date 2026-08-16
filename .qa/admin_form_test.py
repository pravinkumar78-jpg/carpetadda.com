import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:90]))
        await page.goto(BASE + "/login", wait_until="networkidle")
        await page.fill('[data-testid="login-email"]', "admin@estatehub.in")
        await page.fill('[data-testid="login-password"]', "Admin@123")
        await page.click('[data-testid="login-submit"]')
        await page.wait_for_timeout(2200)
        # edit skyline-marina in admin project form
        await page.goto(BASE + "/admin", wait_until="networkidle"); await page.wait_for_timeout(1500)
        await page.click('[data-testid="admin-tab-projects"]'); await page.wait_for_timeout(1200)
        # edit Skyline Marina specifically
        await page.fill('[data-testid="admin-proj-search"]', "Skyline Marina"); await page.wait_for_timeout(1200)
        row = await page.query_selector('tr:has-text("Skyline Marina")')
        edit = await row.query_selector('[data-testid^="edit-proj-"]')
        await edit.click(); await page.wait_for_timeout(1800)
        # RERA tab
        await page.click('button:has-text("RERA")'); await page.wait_for_timeout(500)
        d = await page.evaluate("""() => ({
          entries: document.querySelectorAll('[data-testid^="rera-entry-"]').length,
          firstNumber: document.querySelector('[data-testid="rera-number-0"]')?.value,
          addBtn: !!document.querySelector('[data-testid="rera-add"]'),
        })""")
        print("RERA TAB:", d)
        # add a third entry then remove it (editor works, don't save)
        await page.click('[data-testid="rera-add"]'); await page.wait_for_timeout(300)
        n = await page.evaluate("() => document.querySelectorAll('[data-testid^=\"rera-entry-\"]').length")
        await page.click('[data-testid="rera-remove-2"]'); await page.wait_for_timeout(300)
        n2 = await page.evaluate("() => document.querySelectorAll('[data-testid^=\"rera-entry-\"]').length")
        print("add/remove: 2 →", n, "→", n2)
        await page.screenshot(path="/tmp/admin_rera.jpg", type="jpeg", quality=40)
        # media tab: master plan + youtube
        await page.click('button:has-text("Media")'); await page.wait_for_timeout(500)
        d2 = await page.evaluate("""() => ({
          masterPlan: !!document.querySelector('[data-testid="project-master-plan-upload"]'),
          youtube: document.querySelector('[data-testid="project-youtube-url"]')?.value,
        })""")
        print("MEDIA TAB:", d2)
        # property form youtube
        await page.goto(BASE + "/admin", wait_until="networkidle"); await page.wait_for_timeout(1500)
        await page.click('[data-testid="admin-tab-properties"]'); await page.wait_for_timeout(1200)
        addBtn = await page.query_selector('[data-testid^="edit-"]')
        await addBtn.click(); await page.wait_for_timeout(1800)
        yt = await page.evaluate("() => { const i = document.querySelector('[data-testid=\"property-youtube-url\"]'); if (!i) return null; const mediaTab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Media'); return 'needs-media-tab'; }")
        # property form may be tabbed — click Media tab if youtube not visible
        has = await page.query_selector('[data-testid="property-youtube-url"]')
        if not has:
            for tabName in ["Media", "Photos", "Images"]:
                t = await page.query_selector(f'button:has-text("{tabName}")')
                if t:
                    await t.click(); await page.wait_for_timeout(400)
                    has = await page.query_selector('[data-testid="property-youtube-url"]')
                    if has: break
        print("PROPERTY FORM youtube field:", bool(has))
        print("errors:", [e for e in errs if "posthog" not in e] or "none")
        await b.close()
asyncio.run(main())
