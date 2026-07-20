-- ContractIQ — Supabase Database Schema
-- Version: 1.0
-- Run this entire file in Supabase SQL Editor (Project → SQL Editor → New query)
-- Prerequisites: Supabase project provisioned; pg_cron extension enabled via
--   Database → Extensions → pg_cron

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  type         text NOT NULL CHECK (type IN ('NDA', 'MSA')),
  status       text NOT NULL DEFAULT 'uploading'
               CHECK (status IN ('uploading', 'uploaded', 'processing', 'processed', 'error')),
  contract_text text,
  file_path    text,
  page_count   int,
  token_count  int,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS key_terms (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id      uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_name        text NOT NULL,
  value            text,
  page_number      int,
  confidence_score float CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  source_sentence  text,
  is_custom        bool NOT NULL DEFAULT false,
  is_edited        bool NOT NULL DEFAULT false,
  original_value   text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_key_terms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_name   text NOT NULL,
  is_manual   bool NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      text NOT NULL CHECK (rating IN ('thumbs_up', 'thumbs_down')),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS contracts_user_id_idx ON contracts(user_id);
CREATE INDEX IF NOT EXISTS contracts_user_created_idx ON contracts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS key_terms_contract_id_idx ON key_terms(contract_id);
CREATE INDEX IF NOT EXISTS key_terms_user_id_idx ON key_terms(user_id);

CREATE INDEX IF NOT EXISTS custom_key_terms_contract_id_idx ON custom_key_terms(contract_id);

CREATE INDEX IF NOT EXISTS chat_sessions_contract_id_idx ON chat_sessions(contract_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx ON chat_messages(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS user_feedback_contract_id_idx ON user_feedback(contract_id);

-- ============================================================
-- TRIGGER: auto-update contracts.updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE contracts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_terms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_key_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback    ENABLE ROW LEVEL SECURITY;

-- contracts: users own their own rows
DROP POLICY IF EXISTS "Users own their contracts" ON contracts;
CREATE POLICY "Users own their contracts" ON contracts
  FOR ALL USING (auth.uid() = user_id);

-- key_terms: users own their own rows
DROP POLICY IF EXISTS "Users own their key terms" ON key_terms;
CREATE POLICY "Users own their key terms" ON key_terms
  FOR ALL USING (auth.uid() = user_id);

-- custom_key_terms: users own their own rows
DROP POLICY IF EXISTS "Users own their custom terms" ON custom_key_terms;
CREATE POLICY "Users own their custom terms" ON custom_key_terms
  FOR ALL USING (auth.uid() = user_id);

-- chat_sessions: users own their own rows
DROP POLICY IF EXISTS "Users own their chat sessions" ON chat_sessions;
CREATE POLICY "Users own their chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- chat_messages: access via parent session ownership
DROP POLICY IF EXISTS "Users own their chat messages" ON chat_messages;
CREATE POLICY "Users own their chat messages" ON chat_messages
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM chat_sessions WHERE id = session_id
    )
  );

-- user_feedback: users own their own rows
DROP POLICY IF EXISTS "Users own their feedback" ON user_feedback;
CREATE POLICY "Users own their feedback" ON user_feedback
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE: contracts bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;
CREATE POLICY "Users can upload their own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
CREATE POLICY "Users can view their own PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
CREATE POLICY "Users can delete their own PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 90-DAY AUTO-DELETION via pg_cron
-- Requires: pg_cron extension enabled in Supabase Dashboard
--   → Database → Extensions → pg_cron → Enable
-- ============================================================

SELECT cron.schedule(
  'delete-expired-pdfs',
  '0 2 * * *',
  $$
    UPDATE contracts
    SET file_path = NULL
    WHERE file_path IS NOT NULL
      AND updated_at < NOW() - INTERVAL '90 days';
  $$
);
