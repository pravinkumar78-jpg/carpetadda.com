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
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:100]))
        # --- LOAN FORM with loan type ---
        await page.goto(BASE + "/home-loan", wait_until="networkidle"); await page.wait_for_timeout(800)
        await page.fill('[data-testid="hl-name"]', "QA Loan Tester")
        await page.fill('[data-testid="hl-mobile"]', "9820012345")
        await page.click('[data-testid="hl-loan-type"]'); await page.wait_for_timeout(300)
        await page.click('[role="option"]:has-text("Loan Against Property")'); await page.wait_for_timeout(200)
        await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Get")')
        await page.wait_for_timeout(2500)
        body = await page.inner_text("body")
        print("LOAN submit:", "thank" in body.lower() or "received" in body.lower() or "success" in body.lower(), "|", [t for t in await page.eval_on_selector_all('[data-sonner-toast]', 'e=>e.map(x=>x.innerText.slice(0,80))')])
        # --- PROJECT: create with typed developer name + configurations ---
        await login(page, "admin@estatehub.in", "Admin@123")
        await page.goto(BASE + "/admin/projects/new", wait_until="networkidle"); await page.wait_for_timeout(1500)
        await page.evaluate("""() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.includes('Project Title')); l.parentElement.querySelector('input').focus(); }""")
        await page.keyboard.type("QA Typed Dev Project", delay=8)
        await page.fill('[data-testid="project-developer"]', "Meridian Estates")
        await page.click('button:has-text("Details")'); await page.wait_for_timeout(400)
        # configurations field: clear and type
        await page.evaluate("""() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.trim().startsWith('Configurations')); const i = l.parentElement.querySelector('input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); }""")
        await page.evaluate("""() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.trim().startsWith('Configurations')); l.parentElement.querySelector('input').focus(); }""")
        await page.keyboard.type("1 BHK, 2 BHK, 3 BHK", delay=5)
        await page.click('button:has-text("Publish")')
        await page.wait_for_timeout(2500)
        toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,100))")
        print("PROJECT PUBLISH (typed dev + configs):", toasts)
        # verify saved configurations format
        import urllib.request, json
        # --- PROPERTY draft + publish ---
        await page.goto(BASE + "/admin", wait_until="networkidle"); await page.wait_for_timeout(1200)
        await page.click('[data-testid="admin-tab-properties"]'); await page.wait_for_timeout(1200)
        await page.click('[data-testid="add-property"], a:has-text("Add"), button:has-text("Add") >> nth=0')
        await page.wait_for_timeout(1500)
        print("property form url:", page.url)
        errs2 = [e for e in errs if "posthog" not in e]
        print("errors:", errs2 if errs2 else "none")
        await b.close()
asyncio.run(main())
