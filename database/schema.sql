CREATE TYPE exam_status AS ENUM ('draft', 'scheduled', 'live', 'stopped', 'completed');
CREATE TYPE question_type AS ENUM ('mcq', 'subjective');
CREATE TYPE session_status AS ENUM ('registered', 'in_progress', 'submitted', 'expired', 'stopped');
CREATE TYPE violation_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE mcq_option AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE scoring_mode AS ENUM ('positive_only');

CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  exam_code VARCHAR(32) NOT NULL UNIQUE,
  instructions_html TEXT NOT NULL,
  status exam_status NOT NULL DEFAULT 'draft',
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  scoring_mode scoring_mode NOT NULL DEFAULT 'positive_only',
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  prompt_html TEXT NOT NULL,
  option_a_html TEXT,
  option_b_html TEXT,
  option_c_html TEXT,
  option_d_html TEXT,
  correct_option mcq_option,
  marks INTEGER NOT NULL CHECK (marks >= 0),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  asset_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidate_sessions (
  id TEXT PRIMARY KEY,
  candidate_id VARCHAR(32) NOT NULL UNIQUE,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  status session_status NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  question_order JSONB,
  option_order_map JSONB,
  last_heartbeat_at TIMESTAMPTZ,
  warning_count INTEGER NOT NULL DEFAULT 0,
  current_question_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES candidate_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option mcq_option,
  subjective_answer_html TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  final_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT responses_session_question_key UNIQUE (session_id, question_id)
);

CREATE TABLE violations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES candidate_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity violation_severity NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjective_scores (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES candidate_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  evaluator_admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  awarded_marks INTEGER NOT NULL CHECK (awarded_marks >= 0),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjective_scores_session_question_key UNIQUE (session_id, question_id)
);

CREATE TABLE results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE REFERENCES candidate_sessions(id) ON DELETE CASCADE,
  mcq_score INTEGER NOT NULL DEFAULT 0,
  subjective_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX questions_exam_sort_order_idx ON questions (exam_id, sort_order);
CREATE INDEX candidate_sessions_exam_email_phone_idx ON candidate_sessions (exam_id, email, phone);
CREATE INDEX candidate_sessions_status_ends_at_idx ON candidate_sessions (status, ends_at);
CREATE INDEX violations_session_detected_at_idx ON violations (session_id, detected_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admins_set_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER exams_set_updated_at
BEFORE UPDATE ON exams
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_sessions_set_updated_at
BEFORE UPDATE ON candidate_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER responses_set_updated_at
BEFORE UPDATE ON responses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER subjective_scores_set_updated_at
BEFORE UPDATE ON subjective_scores
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER results_set_updated_at
BEFORE UPDATE ON results
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
