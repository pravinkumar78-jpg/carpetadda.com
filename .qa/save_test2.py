import asyncio
from playwright.async_api import async_playwright
BASE = "https://realtor-uploader.preview.emergentagent.com"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1440, "height": 900})
        api_calls = []
        page.on("response", lambda r: api_calls.append(f"{r.status} {r.request.method} {r.url.split('/api/')[-1]}") if "/api/projects" in r.url and r.request.method in ("POST", "PUT") else None)
        await page.goto(BASE + "/login", wait_until="networkidle")
        await page.fill('[data-testid="login-email"]', "admin@estatehub.in")
        await page.fill('[data-testid="login-password"]', "Admin@123")
        await page.click('[data-testid="login-submit"]')
        await page.wait_for_timeout(2200)
        await page.goto(BASE + "/admin/projects/new", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        # title input = the input right after the fetch panel (label "Project Title *")
        await page.evaluate("""() => {
          const labels = [...document.querySelectorAll('label')];
          const l = labels.find(x => x.textContent.includes('Project Title'));
          const inp = l.parentElement.querySelector('input');
          inp.focus();
        }""")
        await page.keyboard.type("QA Save UI Test", delay=10)
        # developer select: label "Developer *" → click the select trigger inside
        await page.evaluate("""() => {
          const labels = [...document.querySelectorAll('label')];
          const l = labels.find(x => x.textContent.trim().startsWith('Developer'));
          l.parentElement.querySelector('button').click();
        }""")
        await page.wait_for_timeout(500)
        opt = await page.query_selector('[role="option"]')
        await opt.click(); await page.wait_for_timeout(300)
        await page.click('button:has-text("Save Draft")')
        await page.wait_for_timeout(2500)
        toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,120))")
        print("SAVE DRAFT → toasts:", toasts, "| api:", api_calls, "| url:", page.url)
        # now publish a NEW one
        await page.goto(BASE + "/admin/projects/new", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.evaluate("""() => {
          const l = [...document.querySelectorAll('label')].find(x => x.textContent.includes('Project Title'));
          l.parentElement.querySelector('input').focus();
        }""")
        await page.keyboard.type("QA Publish UI Test", delay=10)
        await page.evaluate("""() => {
          const l = [...document.querySelectorAll('label')].find(x => x.textContent.trim().startsWith('Developer'));
          l.parentElement.querySelector('button').click();
        }""")
        await page.wait_for_timeout(500)
        await page.click('[role="option"] >> nth=0')
        await page.wait_for_timeout(300)
        await page.click('button:has-text("Publish")')
        await page.wait_for_timeout(2500)
        toasts = await page.eval_on_selector_all('[data-sonner-toast]', "els => els.map(e => e.innerText.slice(0,120))")
        print("PUBLISH → toasts:", toasts, "| api:", api_calls[-2:], "| url:", page.url)
        await b.close()
asyncio.run(main())
