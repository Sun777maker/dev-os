-- ============================================================
-- ContractIQ — RLS Policies + Rate Limiting Table
-- Run this in the Supabase SQL Editor.
-- All statements are idempotent.
-- ============================================================

-- ============================================================
-- Rate limiting table
-- Managed exclusively via service-role (createAdminClient).
-- No user-facing RLS policies — users must not be able to
-- read or manipulate their own rate limit counts.
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON rate_limit_events (user_id, action, created_at DESC);

ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — service role only

-- ============================================================
-- Re-enable RLS on all application tables (idempotent)
-- ============================================================

ALTER TABLE contracts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_terms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_key_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- contracts
-- ============================================================

DROP POLICY IF EXISTS "Users own their contracts" ON contracts;
CREATE POLICY "Users own their contracts"
  ON contracts FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- key_terms
-- ============================================================

DROP POLICY IF EXISTS "Users own their key terms" ON key_terms;
CREATE POLICY "Users own their key terms"
  ON key_terms FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- custom_key_terms
-- ============================================================

DROP POLICY IF EXISTS "Users own their custom terms" ON custom_key_terms;
CREATE POLICY "Users own their custom terms"
  ON custom_key_terms FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- chat_sessions
-- ============================================================

DROP POLICY IF EXISTS "Users own their chat sessions" ON chat_sessions;
CREATE POLICY "Users own their chat sessions"
  ON chat_sessions FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- chat_messages — ownership resolved through parent session
-- ============================================================

DROP POLICY IF EXISTS "Users own their chat messages" ON chat_messages;
CREATE POLICY "Users own their chat messages"
  ON chat_messages FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id FROM chat_sessions WHERE id = session_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM chat_sessions WHERE id = session_id
    )
  );

-- ============================================================
-- user_feedback
-- ============================================================

DROP POLICY IF EXISTS "Users own their feedback" ON user_feedback;
CREATE POLICY "Users own their feedback"
  ON user_feedback FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
