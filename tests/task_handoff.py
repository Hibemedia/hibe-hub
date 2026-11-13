"""Authenticated task handoff regression; creates and removes its own test task."""
import asyncio
import json
import os
import uuid
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    creator = json.loads(os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"])
    with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as file:
        editor_auth = json.load(file)
    editor = editor_auth["session"]
    assert creator["user"]["id"] != editor["user"]["id"], "Mint an Editor session distinct from the injected creator"
    url = os.environ["VITE_SUPABASE_URL"]
    key = os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"]
    headers = {"apikey": key, "Authorization": "Bearer " + creator["access_token"], "Prefer": "return=representation"}
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        api = context.request
        profiles_response = await api.post(url + "/rest/v1/rpc/visible_profiles", headers=headers, data={})
        assert profiles_response.ok
        profiles = await profiles_response.json()
        roles_response = await api.get(url + "/rest/v1/user_roles?role=eq.admin&select=user_id", headers=headers)
        assert roles_response.ok
        team = {row["user_id"] for row in await roles_response.json()}
        colleague = next(row for row in profiles if row["id"] in team and row["id"] not in [creator["user"]["id"], editor["user"]["id"]])
        title = "Handoff regression " + uuid.uuid4().hex[:8]
        task_response = await api.post(url + "/rest/v1/tasks", headers=headers, data={"title": title, "created_by": creator["user"]["id"], "assignee_id": editor["user"]["id"]})
        assert task_response.ok, "Could not create disposable regression task"
        task = (await task_response.json())[0]
        try:
            page = await context.new_page()
            await page.goto("http://localhost:8080")
            await page.evaluate("([key, value]) => localStorage.setItem(key, value)", [editor_auth["storage_key"], json.dumps(editor)])
            await page.goto("http://localhost:8080/hibe/taken")
            await page.get_by_role("button", name=title, exact=True).click()
            await page.get_by_role("dialog").locator("button.ui-filter").filter(has_text=colleague["name"]).click()
            await page.get_by_role("button", name="Opslaan", exact=True).click()
            await page.get_by_role("dialog").wait_for(state="hidden")
            await page.get_by_role("button", name="Iedereen, per persoon", exact=True).click()
            row = page.locator("section").filter(has=page.get_by_role("button", name=title, exact=True))
            await row.get_by_role("heading", name=colleague["name"], exact=True).wait_for()
            response = await api.get(url + "/rest/v1/tasks?id=eq." + task["id"], headers=headers)
            saved = (await response.json())[0]
            assert saved["assignee_id"] == colleague["id"]
            assert saved["created_by"] == creator["user"]["id"]
            # After handoff, the old assignee must no longer be able to edit it.
            editor_headers = {**headers, "Authorization": "Bearer " + editor["access_token"]}
            forbidden = await api.patch(url + "/rest/v1/tasks?id=eq." + task["id"], headers=editor_headers, data={"title": "Must not change"})
            assert forbidden.ok and await forbidden.json() == []
            Path("/tmp/browser/task-handoff").mkdir(parents=True, exist_ok=True)
            await row.screenshot(path="/tmp/browser/task-handoff/result.png")
            print("PASS: Editor handed off another creator's task, UI read back the new assignee, and old-assignee access was revoked")
        finally:
            response = await api.delete(url + "/rest/v1/tasks?id=eq." + task["id"], headers=headers)
            assert response.ok, "Disposable test task cleanup failed"
            await browser.close()


asyncio.run(main())