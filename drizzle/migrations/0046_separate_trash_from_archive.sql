ALTER TABLE public.video_items ADD COLUMN trashed_at timestamptz;
UPDATE public.video_items SET trashed_at = archived_at WHERE archived_at IS NOT NULL AND status <> 'archived';
CREATE INDEX video_items_trashed_at_idx ON public.video_items (trashed_at) WHERE trashed_at IS NOT NULL;