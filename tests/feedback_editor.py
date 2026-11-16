"""Feedback assignment regression: real team selection, persisted UI readback, cleanup."""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    session_json = os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]
    session = json.loads(session_json)
    headers = {"apikey": os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"], "Authorization": "Bearer " + session["access_token"], "Prefer": "return=representation"}
    url = os.environ["VITE_SUPABASE_URL"] + "/rest/v1"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        api = context.request
        response = await api.get(url + "/video_items?status=eq.feedback&archived_at=is.null&select=id,title,editor_id,status&limit=1", headers=headers)
        assert response.ok
        item = (await response.json())[0]
        response = await api.get(url + "/user_roles?role=eq.admin&select=user_id", headers=headers)
        team = [r["user_id"] for r in await response.json()]
        response = await api.post(url + "/rpc/visible_profiles", headers=headers, data={})
        profiles = await response.json()
        editor = next(r for r in profiles if r["id"] in team and r["id"] != item["editor_id"])
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            await page.goto("http://localhost:8080")
            await page.evaluate("([k,v]) => localStorage.setItem(k,v)", [os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"], session_json])
            await page.evaluate("() => localStorage.removeItem('hibe.media.filters')")
            await page.goto("http://localhost:8080/hibe/videos/stap/feedback")
            picker = page.get_by_role("combobox", name="Editor voor " + item["title"], exact=True)
            await picker.click()
            await page.get_by_role("option", name=editor["name"], exact=True).click()
            await page.get_by_text("Feedback toegewezen", exact=True).wait_for()
            response = await api.get(url + "/video_items?id=eq." + item["id"] + "&select=editor_id,status", headers=headers)
            saved = (await response.json())[0]
            assert saved["editor_id"] == editor["id"], "Selected feedback editor must be persisted"
            assert saved["status"] == "feedback", "Assignment must not change the feedback status"
            await page.reload()
            await picker.filter(has_text=editor["name"]).wait_for()
            screenshots = Path("/tmp/browser/feedback-editor")
            screenshots.mkdir(parents=True, exist_ok=True)
            await page.screenshot(path=str(screenshots / "desktop.png"))
            await page.set_viewport_size({"width": 390, "height": 844})
            await picker.wait_for()
            assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile page must not overflow"
            await page.screenshot(path=str(screenshots / "mobile.png"))
            await picker.click()
            await page.get_by_role("option", name="Geen editor", exact=True).click()
            await page.get_by_text("Editor verwijderd", exact=True).wait_for()
            response = await api.get(url + "/video_items?id=eq." + item["id"] + "&select=editor_id", headers=headers)
            assert (await response.json())[0]["editor_id"] is None, "Feedback editor can be cleared"
            assert not errors, errors
            print("PASS: feedback editor selected, stored, read back after reload and cleared; no mobile overflow or runtime errors")
        finally:
            response = await api.post(url + "/rpc/set_video_feedback_editor", headers=headers, data={"_item_id": item["id"], "_editor_id": item["editor_id"]})
            assert response.ok, "Original feedback assignment restore failed"
            await browser.close()


asyncio.run(main())