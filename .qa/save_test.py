import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        reqs = []
        page.on("response", lambda r: reqs.append(f"{r.status} {r.request.method} {r.url[-60:]}") if "/api/projects" in r.url and r.request.method in ("POST","PUT") else None)
        await page.goto(BASE + "/login", wait_until="networkidle")
        await page.fill('[data-testid="login-email"]', "admin@estatehub.in")
        await page.fill('[data-testid="login-password"]', "Admin@123")
        await page.click('[data-testid="login-submit"]')
        await page.wait_for_timeout(2200)
        await page.goto(BASE + "/admin/projects/new", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        # fill minimal: name + developer dropdown
        name_inp = await page.query_selector('input[placeholder*="Project name"], input[placeholder*="name"]')
        await name_inp.fill("QA Save UI Test")
        # developer select
        dev = await page.query_selector('[data-testid="project-developer"], [data-testid*="developer"]')
        print("developer control:", await dev.get_attribute("data-testid") if dev else None, await dev.evaluate("el => el.tagName") if dev else None)
        if dev:
            await dev.click(); await page.wait_for_timeout(400)
            opt = await page.query_selector('[role="option"]')
            if opt: await opt.click(); await page.wait_for_timeout(300)
        # find save buttons
        btns = await page.evaluate("() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /save|publish|draft/i.test(t))")
        print("buttons:", btns)
        # click Save Draft
        draft = await page.query_selector('button:has-text("Save Draft"), button:has-text("Draft")')
        await draft.click(); await page.wait_for_timeout(2500)
        toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,100))")
        print("TOASTS:", toasts)
        print("PROJECT API CALLS:", reqs)
        print("URL now:", page.url)
        await b.close()
asyncio.run(main())
