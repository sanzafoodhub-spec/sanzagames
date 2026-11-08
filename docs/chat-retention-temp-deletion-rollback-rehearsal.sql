-- SanZa Chat PREVIEW ONLY — isolated deletion + rollback rehearsal.
-- IMPORTANT: Contains DELETE statements on TEMPORARY TEST TABLES ONLY.
-- Supabase may show a destructive-query warning. Review before running.
-- Do not run against production. No public.chat_* table is changed.
-- Everything is inside a transaction and ends with ROLLBACK.
BEGIN;

CREATE TEMP TABLE sanza_test_messages (
  id integer PRIMARY KEY, age_days integer NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE sanza_test_reports (
  id integer PRIMARY KEY,
  message_id integer NOT NULL REFERENCES sanza_test_messages(id) ON DELETE RESTRICT,
  status text NOT NULL,
  resolved_days_ago integer,
  legal_hold boolean NOT NULL,
  approved boolean NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE sanza_test_audit (
  action text NOT NULL, record_id integer NOT NULL
) ON COMMIT DROP;

INSERT INTO sanza_test_messages(id,age_days) VALUES
  (1,40),(2,40),(3,40),(4,40),(5,10),(6,40),(7,40),(8,40);
INSERT INTO sanza_test_reports(id,message_id,status,resolved_days_ago,legal_hold,approved) VALUES
  (101,2,'pending',NULL,false,false),
  (102,3,'resolved',110,true,true),
  (103,4,'resolved',110,false,true),
  (104,5,'resolved',110,false,true),
  (105,6,'resolved',110,false,false),
  (106,7,'resolved',110,false,true),
  (107,7,'pending',NULL,false,false),
  (108,8,'resolved',20,false,true);

-- Delete eligible reports only. Capture minimal audit entries.
WITH deleted AS (
  DELETE FROM sanza_test_reports r
  WHERE r.status='resolved'
    AND r.resolved_days_ago>90
    AND NOT r.legal_hold AND r.approved
    AND NOT EXISTS (
      SELECT 1 FROM sanza_test_reports other
      WHERE other.message_id=r.message_id AND other.id<>r.id
        AND (other.status='pending' OR other.legal_hold)
    )
  RETURNING r.id
)
INSERT INTO sanza_test_audit(action,record_id)
SELECT 'report_deleted',id FROM deleted;

-- Delete old messages that have no remaining report reference.
WITH deleted AS (
  DELETE FROM sanza_test_messages m
  WHERE m.age_days>30
    AND NOT EXISTS (
      SELECT 1 FROM sanza_test_reports r WHERE r.message_id=m.id
    )
  RETURNING m.id
)
INSERT INTO sanza_test_audit(action,record_id)
SELECT 'message_deleted',id FROM deleted;

SELECT
  CASE WHEN
    (SELECT array_agg(record_id ORDER BY record_id)
     FROM sanza_test_audit WHERE action='report_deleted')=ARRAY[103,104]
    AND (SELECT array_agg(record_id ORDER BY record_id)
     FROM sanza_test_audit WHERE action='message_deleted')=ARRAY[1,4]
    AND (SELECT array_agg(id ORDER BY id)
     FROM sanza_test_reports)=ARRAY[101,102,105,106,107,108]
    AND (SELECT array_agg(id ORDER BY id)
     FROM sanza_test_messages)=ARRAY[2,3,5,6,7,8]
  THEN 'PASS' ELSE 'FAIL' END AS rehearsal_result,
  (SELECT array_agg(record_id ORDER BY record_id)
   FROM sanza_test_audit WHERE action='report_deleted') AS deleted_sample_reports,
  (SELECT array_agg(record_id ORDER BY record_id)
   FROM sanza_test_audit WHERE action='message_deleted') AS deleted_sample_messages,
  (SELECT count(*) FROM sanza_test_audit) AS sample_audit_entries,
  'TEMP TABLES ONLY; transaction rolled back below' AS safety_note;

ROLLBACK;
-- All temporary sample tables and audit entries are discarded by ROLLBACK.
-- No cleanup function or schedule is enabled.
