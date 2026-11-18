# Edge functions

- Task, edit and feedback handovers run through assign-task / assign-edit-editor / assign-feedback-editor: each writes with the caller's own session (RLS unchanged) and then mails that one person through the shared template registry — the UI never writes those rows directly, so the person who has to act always learns about it.
- A mail that cannot go out (unverified sender domain, suppressed recipient, nobody to notify) returns 200 with sent:false and a reason; only a failed write is an error, so a saved assignment never looks broken.
- When a video with an editor moves to status "feedback", the video_items_notify_feedback trigger calls notify-feedback (pg_net, guarded by NOTIFY_FEEDBACK_SECRET), which mails that editor via the feedback-ontvangen template; the idempotency key pins one mail per video per version.
- Personal Hibby = chat_rooms kind 'hibby' with one member; there hibby runs a tool-calling agent (tasks, calendar_events, shoot content_moments) writing with the caller's session so RLS decides what is allowed.
