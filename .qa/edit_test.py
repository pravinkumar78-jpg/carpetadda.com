import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def login(page, email, pw):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.fill('[data-testid="login-email"]', email)
    await page.fill('[data-testid="login-password"]', pw)
    await page.click('[data-testid="login-submit"]')
    await page.wait_for_timeout(2200)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1) ADMIN EDIT flow
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        api_calls = []
        page.on("response", lambda r: api_calls.append(f"{r.status} {r.request.method} {r.url.split('/api/')[-1][:50]}") if r.request.method in ("POST","PUT") else None)
        await login(page, "admin@estatehub.in", "Admin@123")
        await page.goto(BASE + "/admin", wait_until="networkidle"); await page.wait_for_timeout(1200)
        await page.click('[data-testid="admin-tab-projects"]'); await page.wait_for_timeout(1200)
        await page.fill('[data-testid="admin-proj-search"]', "Skyline"); await page.wait_for_timeout(1000)
        await page.click('tr:has-text("Skyline Marina") [data-testid^="edit-proj-"]'); await page.wait_for_timeout(1800)
        await page.click('button:has-text("Save Draft")'); await page.wait_for_timeout(2500)
        toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,120))")
        print("ADMIN EDIT SAVE:", toasts, api_calls[-2:])
        await page.close()
        # 2) DEVELOPER create flow
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        page.on("response", lambda r: api_calls.append(f"{r.status} {r.request.method} {r.url.split('/api/')[-1][:50]}") if r.request.method in ("POST","PUT") else None)
        await login(page, "developer@estatehub.in", "Developer@123")
        await page.goto(BASE + "/developer/projects/new", wait_until="networkidle"); await page.wait_for_timeout(1500)
        print("dev new project url:", page.url)
        loaded = await page.evaluate("() => [...document.querySelectorAll('label')].some(x => x.textContent.includes('Project Title'))")
        print("dev form loaded:", loaded)
        if loaded:
            await page.evaluate("""() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.includes('Project Title')); l.parentElement.querySelector('input').focus(); }""")
            await page.keyboard.type("QA Dev Project", delay=10)
            await page.evaluate("""() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.trim().startsWith('Developer')); l.parentElement.querySelector('button').click(); }""")
            await page.wait_for_timeout(500)
            await page.click('[role="option"] >> nth=0'); await page.wait_for_timeout(300)
            await page.click('button:has-text("Submit for Admin Review")'); await page.wait_for_timeout(2500)
            toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,120))")
            print("DEV SUBMIT:", toasts, api_calls[-2:])
        await page.close()
        # 3) FETCH NEARBY
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        page.on("response", lambda r: api_calls.append(f"{r.status} POST nearby/fetch") if "nearby" in r.url and r.request.method == "POST" else None)
        await login(page, "admin@estatehub.in", "Admin@123")
        await page.goto(BASE + "/admin/projects/new", wait_until="networkidle"); await page.wait_for_timeout(1500)
        await page.click('button:has-text("Location")'); await page.wait_for_timeout(500)
        # fill address first
        await page.evaluate("""() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.includes('Address')); const i = l.parentElement.querySelector('input,textarea'); if (i) { i.focus(); } }""")
        await page.keyboard.type("Dombivli East, Thane", delay=5)
        await page.click('[data-testid="fetch-nearby-btn"]'); await page.wait_for_timeout(6000)
        toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,140))")
        print("NEARBY:", toasts, "| api:", [c for c in api_calls if "nearby" in c])
        await b.close()
asyncio.run(main())
