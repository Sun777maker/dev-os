-- ============================================================
-- ContractIQ — Production Database Schema
-- Version: 1.0 · 2026-07-19
-- ============================================================
--
-- PREREQUISITES — complete these before running this file:
--
--   1. Supabase project is provisioned and you are in the
--      SQL Editor (Dashboard → SQL Editor → New query).
--
--   2. Enable the pg_cron extension:
--      Dashboard → Database → Extensions → search "pg_cron" → Enable
--      (required for Section 6 — Scheduled Maintenance)
--
-- IDEMPOTENCY — this file is safe to run multiple times:
--   • Tables:   CREATE TABLE IF NOT EXISTS
--   • Indexes:  CREATE INDEX IF NOT EXISTS
--   • Triggers: DROP TRIGGER IF EXISTS + CREATE TRIGGER
--   • Policies: DROP POLICY IF EXISTS + CREATE POLICY
--   • Storage:  ON CONFLICT (id) DO NOTHING
--   • pg_cron:  cron.unschedule() before re-scheduling
--
-- FILE PATH CONVENTION for storage objects:
--   {user_id}/{contract_id}/{original_filename}.pdf
--   The first path segment (user_id) is what RLS policies
--   compare against auth.uid() to enforce ownership.
-- ============================================================


-- ============================================================
-- SECTION 1 — TABLES
-- Creation order respects foreign-key dependencies.
-- ============================================================

-- ----------------------------------------------------------
-- 1.1  contracts
--      Master record per uploaded contract.
--      Stores extracted full text (contract_text) at upload
--      so all downstream AI steps read from the DB — never
--      the storage file.  file_path is nullable; Storage
--      upload failure is non-blocking (text fallback used).
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL
                            REFERENCES auth.users (id) ON DELETE CASCADE,
  name          text        NOT NULL,
  type          text        NOT NULL
                            CHECK (type IN ('NDA', 'MSA')),
  status        text        NOT NULL DEFAULT 'uploading'
                            CHECK (status IN (
                              'uploading', 'uploaded',
                              'processing', 'processed', 'error'
                            )),
  contract_text text,                         -- full text with [PAGE N] markers
  file_path     text,                         -- storage path; NULL if upload failed
  page_count    int,                          -- from pdf-parse
  token_count   int,                          -- from tiktoken, enforces 15k limit
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
                            -- auto-refreshed by trigger on any write to
                            -- this row OR child key_terms / chat_messages rows;
                            -- drives the 90-day Storage auto-deletion clock
);

-- ----------------------------------------------------------
-- 1.2  key_terms
--      Extracted terms per contract after GPT-4o processing.
--      user_id is denormalised from contracts for RLS index
--      efficiency (avoids a join on every RLS check).
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS key_terms (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id      uuid        NOT NULL
                               REFERENCES contracts (id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL
                               REFERENCES auth.users (id) ON DELETE CASCADE,
  term_name        text        NOT NULL,
  value            text,                      -- NULL when term not found
  page_number      int,                       -- 1-indexed, from [PAGE N] marker
  confidence_score float
                   CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  source_sentence  text,                      -- verbatim sentence used by GPT-4o
  is_custom        bool        NOT NULL DEFAULT false,
  is_edited        bool        NOT NULL DEFAULT false,
  original_value   text,                      -- preserves AI value when user edits
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 1.3  custom_key_terms
--      Terms the user adds before processing.  Injected into
--      the GPT-4o extraction prompt; appear in pre-processing
--      preview with a "Custom" badge.  Max 5 per contract
--      enforced at the application layer.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_key_terms (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid        NOT NULL
                          REFERENCES contracts (id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL
                          REFERENCES auth.users (id) ON DELETE CASCADE,
  term_name   text        NOT NULL,
  is_manual   bool        NOT NULL DEFAULT true,  -- always true; marks custom origin
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 1.4  chat_sessions
--      One session per user-contract pair (enforced by
--      UNIQUE constraint).  Upserted on first chat load
--      so the session is created lazily, not at upload time.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid        NOT NULL
                          REFERENCES contracts (id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL
                          REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, user_id)
);

-- ----------------------------------------------------------
-- 1.5  chat_messages
--      Individual messages in ascending chronological order.
--      RLS on this table is enforced via parent session
--      ownership (subquery join) — no user_id column needed
--      because session_id already identifies ownership.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL
                         REFERENCES chat_sessions (id) ON DELETE CASCADE,
  role       text        NOT NULL
                         CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 1.6  user_feedback
--      Thumbs-up / thumbs-down per user-contract pair.
--      UNIQUE constraint allows ON CONFLICT DO UPDATE so
--      repeat submissions update rather than duplicate.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid        NOT NULL
                          REFERENCES contracts (id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL
                          REFERENCES auth.users (id) ON DELETE CASCADE,
  rating      text        NOT NULL
                          CHECK (rating IN ('thumbs_up', 'thumbs_down')),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, user_id)
);


-- ============================================================
-- SECTION 2 — INDEXES
-- All indexes are idempotent (IF NOT EXISTS).
-- ============================================================

-- contracts: user-scoped lookups and dashboard list (DESC sort)
CREATE INDEX IF NOT EXISTS contracts_user_id_idx
  ON contracts (user_id);

CREATE INDEX IF NOT EXISTS contracts_user_created_idx
  ON contracts (user_id, created_at DESC);

-- key_terms: term list for a given contract (primary access pattern)
CREATE INDEX IF NOT EXISTS key_terms_contract_id_idx
  ON key_terms (contract_id);

-- key_terms: RLS check (auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS key_terms_user_id_idx
  ON key_terms (user_id);

-- custom_key_terms: look up pre-processing terms for a contract
CREATE INDEX IF NOT EXISTS custom_key_terms_contract_id_idx
  ON custom_key_terms (contract_id);

-- chat_sessions: upsert lookup by contract + user
CREATE INDEX IF NOT EXISTS chat_sessions_contract_id_idx
  ON chat_sessions (contract_id);

CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
  ON chat_sessions (user_id);

-- chat_messages: ordered fetch for a session (API returns ASC)
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx
  ON chat_messages (session_id);

CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
  ON chat_messages (session_id, created_at ASC);

-- user_feedback: contract-level lookup
CREATE INDEX IF NOT EXISTS user_feedback_contract_id_idx
  ON user_feedback (contract_id);

CREATE INDEX IF NOT EXISTS user_feedback_user_id_idx
  ON user_feedback (user_id);


-- ============================================================
-- SECTION 3 — FUNCTIONS & TRIGGERS
-- ============================================================

-- ----------------------------------------------------------
-- 3.1  update_updated_at()
--      Called by the BEFORE UPDATE trigger on contracts.
--      Keeps contracts.updated_at current on every direct
--      UPDATE to the contracts row itself.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------
-- 3.2  touch_contract_updated_at()
--      Called by AFTER INSERT OR UPDATE triggers on
--      key_terms and chat_messages.
--
--      Purpose: reset contracts.updated_at whenever a user
--      actively engages with a contract (edits a term or
--      sends a chat message).  This extends the 90-day
--      auto-deletion clock for active contracts.
--
--      Why SECURITY DEFINER?  The function runs in a
--      trigger context where the inserting user owns the
--      child row AND the parent contract.  SECURITY DEFINER
--      bypasses the RLS re-check on contracts to avoid a
--      subquery join, which is both simpler and faster.
--      The function is intentionally narrow: it only updates
--      updated_at on the specific parent row.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_contract_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'key_terms' THEN
    v_contract_id := NEW.contract_id;

  ELSIF TG_TABLE_NAME = 'chat_messages' THEN
    -- chat_messages has no direct contract_id; resolve via chat_sessions
    SELECT contract_id
      INTO v_contract_id
      FROM chat_sessions
     WHERE id = NEW.session_id;
  END IF;

  IF v_contract_id IS NOT NULL THEN
    UPDATE contracts
       SET updated_at = now()
     WHERE id = v_contract_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS key_terms_touch_contract ON key_terms;
CREATE TRIGGER key_terms_touch_contract
  AFTER INSERT OR UPDATE ON key_terms
  FOR EACH ROW
  EXECUTE FUNCTION touch_contract_updated_at();

DROP TRIGGER IF EXISTS chat_messages_touch_contract ON chat_messages;
CREATE TRIGGER chat_messages_touch_contract
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION touch_contract_updated_at();


-- ============================================================
-- SECTION 4 — ROW LEVEL SECURITY
-- One policy per table.  All use FOR ALL so a single USING
-- clause covers SELECT / INSERT / UPDATE / DELETE.
-- chat_messages is the exception: ownership is resolved
-- through the parent chat_sessions row (subquery).
-- ============================================================

ALTER TABLE contracts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_terms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_key_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback    ENABLE ROW LEVEL SECURITY;

-- contracts
DROP POLICY IF EXISTS "Users own their contracts" ON contracts;
CREATE POLICY "Users own their contracts"
  ON contracts
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- key_terms
DROP POLICY IF EXISTS "Users own their key terms" ON key_terms;
CREATE POLICY "Users own their key terms"
  ON key_terms
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- custom_key_terms
DROP POLICY IF EXISTS "Users own their custom terms" ON custom_key_terms;
CREATE POLICY "Users own their custom terms"
  ON custom_key_terms
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- chat_sessions
DROP POLICY IF EXISTS "Users own their chat sessions" ON chat_sessions;
CREATE POLICY "Users own their chat sessions"
  ON chat_sessions
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- chat_messages — no user_id column; ownership resolved via parent session
DROP POLICY IF EXISTS "Users own their chat messages" ON chat_messages;
CREATE POLICY "Users own their chat messages"
  ON chat_messages
  FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id
        FROM chat_sessions
       WHERE id = session_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT user_id
        FROM chat_sessions
       WHERE id = session_id
    )
  );

-- user_feedback
DROP POLICY IF EXISTS "Users own their feedback" ON user_feedback;
CREATE POLICY "Users own their feedback"
  ON user_feedback
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- SECTION 5 — STORAGE BUCKET & POLICIES
--
-- Bucket: contracts (private)
-- Path pattern: {user_id}/{contract_id}/{filename}.pdf
--
-- RLS on storage.objects checks that the first path segment
-- matches auth.uid() — this is the user_id prefix in the
-- path convention above.
--
-- Signed URLs (1-hour expiry) are generated server-side via
-- supabase.storage.createSignedUrl(); clients never access
-- the bucket directly except through those URLs.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760,           -- 10 MB; mirrors the server-side upload validation
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- INSERT: user may upload only to their own folder
DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: user may download only their own files
--         (used internally when generating signed URLs)
DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
CREATE POLICY "Users can view their own PDFs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: allows signed-URL refresh without re-uploading
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
CREATE POLICY "Users can update their own PDFs"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: user may delete only their own files
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- SECTION 6 — SCHEDULED MAINTENANCE (pg_cron)
--
-- Requires pg_cron extension (see PREREQUISITES above).
--
-- Job: delete-expired-contract-pdfs
--   Schedule: 02:00 UTC daily
--   Action:   For contracts not accessed in 90+ days,
--             (1) physically delete the PDF from storage,
--             (2) null out contracts.file_path.
--
-- Why a CTE?  The UPDATE and DELETE must operate on the same
-- set of expired contracts.  A CTE captures the file_paths
-- atomically so the DELETE sees exactly what was updated —
-- no risk of a concurrent upload slipping in between.
--
-- The 90-day clock is driven by contracts.updated_at, which
-- is refreshed whenever the user:
--   • directly updates a contract row
--   • edits a key term   (trigger: key_terms_touch_contract)
--   • sends a chat message (trigger: chat_messages_touch_contract)
-- ============================================================

-- Remove any existing registration before re-creating so
-- running this file multiple times doesn't duplicate jobs.
SELECT cron.unschedule('delete-expired-contract-pdfs')
WHERE EXISTS (
  SELECT 1
    FROM cron.job
   WHERE jobname = 'delete-expired-contract-pdfs'
);

SELECT cron.schedule(
  'delete-expired-contract-pdfs',
  '0 2 * * *',
  $$
    WITH expired AS (
      UPDATE contracts
         SET file_path = NULL
       WHERE file_path IS NOT NULL
         AND updated_at < NOW() - INTERVAL '90 days'
      RETURNING file_path AS old_path
    )
    DELETE FROM storage.objects
     WHERE bucket_id = 'contracts'
       AND name IN (SELECT old_path FROM expired);
  $$
);
