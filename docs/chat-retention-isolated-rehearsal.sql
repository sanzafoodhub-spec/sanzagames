-- SanZa Chat: isolated deletion rehearsal (PREVIEW ONLY)
-- Safe to run in Supabase SQL Editor: uses TEMP tables only, then ROLLBACK.
-- Does not touch public.chat_* tables, does not schedule jobs.
BEGIN;
CREATE TEMP TABLE retention_test_messages (
  id integer PRIMARY KEY,
  created_at timestamptz NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE retention_test_reports (
  id integer PRIMARY KEY,
  message_id integer REFERENCES retention_test_messages(id),
  status text NOT NULL,
  resolved_at timestamptz,
  legal_hold boolean NOT NULL DEFAULT false
) ON COMMIT DROP;
INSERT INTO retention_test_messages(id,created_at) VALUES
(1,now()-interval '40 days'), -- ordinary: delete
(2,now()-interval '40 days'), -- pending: keep
(3,now()-interval '40 days'), -- held: keep
(4,now()-interval '40 days'), -- resolved old: delete after report
(5,now()-interval '10 days'), -- young: keep
(6,now()-interval '40 days'); -- resolved recent: keep
INSERT INTO retention_test_reports(id,message_id,status,resolved_at,legal_hold) VALUES
(12,2,'pending',NULL,false),
(13,3,'resolved',now()-interval '100 days',true),
(14,4,'resolved',now()-interval '100 days',false),
(16,6,'resolved',now()-interval '20 days',false);
-- Remove only expired, resolved, non-held reports in the TEMP table.
DELETE FROM retention_test_reports r
WHERE r.status='resolved'
 AND r.legal_hold IS FALSE
 AND r.resolved_at < now()-interval '90 days'
 AND NOT EXISTS (
   SELECT 1 FROM retention_test_reports other
   WHERE other.message_id=r.message_id AND other.id<>r.id
     AND (other.status='pending' OR other.legal_hold IS TRUE)
 );
-- Remove old messages only if no report references them.
DELETE FROM retention_test_messages m
WHERE m.created_at < now()-interval '30 days'
 AND NOT EXISTS (
   SELECT 1 FROM retention_test_reports r WHERE r.message_id=m.id
 );
-- Should return PASS: remaining messages 2,3,5,6; reports 12,13,16.
SELECT CASE WHEN
 (SELECT array_agg(id ORDER BY id) FROM retention_test_messages)=ARRAY[2,3,5,6]
 AND (SELECT array_agg(id ORDER BY id) FROM retention_test_reports)=ARRAY[12,13,16]
 THEN 'PASS' ELSE 'FAIL' END AS retention_rehearsal,
 (SELECT array_agg(id ORDER BY id) FROM retention_test_messages) AS remaining_message_ids,
 (SELECT array_agg(id ORDER BY id) FROM retention_test_reports) AS remaining_report_ids;
ROLLBACK;
-- This rehearsal does NOT establish production readiness. Before enabling
-- cron, implement audited retention/legal-hold decisions, privilege checks,
-- backup/restore plans, and operational monitoring.
