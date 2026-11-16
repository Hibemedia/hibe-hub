# Edge functions

- Task, edit and feedback handovers run through assign-task / assign-edit-editor / assign-feedback-editor: each writes with the caller's own session (RLS unchanged) and then mails that one person through the shared template registry — the UI never writes those rows directly, so the person who has to act always learns about it.
- A mail that cannot go out (unverified sender domain, suppressed recipient, nobody to notify) returns 200 with sent:false and a reason; only a failed write is an error, so a saved assignment never looks broken.
