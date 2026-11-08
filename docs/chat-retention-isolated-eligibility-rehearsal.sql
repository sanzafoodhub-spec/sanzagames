-- SanZa Chat PREVIEW ONLY: isolated, READ-ONLY deletion-eligibility rehearsal.
-- Uses inline sample records; NO real chat tables read or changed.
-- NO DELETE, CREATE TABLE, scheduled job, or writes of any kind.
WITH
messages(id, age_days) AS (
 VALUES (1,40),(2,40),(3,40),(4,40),(5,10),(6,40),(7,40),(8,40)
),
reports(id,message_id,status,resolved_days_ago,legal_hold,disposal_approved) AS (
 VALUES
 (101,2,'pending',NULL::integer,false,false),
 (102,3,'resolved',110,true,true),
 (103,4,'resolved',110,false,true),
 (104,5,'resolved',110,false,true),
 (105,6,'resolved',110,false,false),
 (106,7,'resolved',110,false,true),
 (107,7,'pending',NULL::integer,false,false),
 (108,8,'resolved',20,false,true)
),
report_candidates AS (
 SELECT r.id,r.message_id,
   (r.status='resolved' AND r.resolved_days_ago>90
    AND NOT r.legal_hold AND r.disposal_approved
    AND NOT EXISTS (
      SELECT 1 FROM reports other
      WHERE other.message_id=r.message_id AND other.id<>r.id
        AND (other.status='pending' OR other.legal_hold)
    )) AS eligible
 FROM reports r
),
message_candidates AS (
 SELECT m.id,
   (m.age_days>30
    AND NOT EXISTS (
      SELECT 1 FROM reports r
      JOIN report_candidates c ON c.id=r.id
      WHERE r.message_id=m.id AND NOT c.eligible
    )) AS eligible_after_approved_report_disposal
 FROM messages m
),
results AS (
 SELECT
  (SELECT array_agg(id ORDER BY id) FROM report_candidates WHERE eligible) AS eligible_reports,
  (SELECT array_agg(id ORDER BY id) FROM message_candidates
   WHERE eligible_after_approved_report_disposal) AS eligible_messages
)
SELECT CASE WHEN eligible_reports=ARRAY[103,104] AND eligible_messages=ARRAY[1,4]
  THEN 'PASS' ELSE 'FAIL' END AS simulation_result,
 eligible_reports,eligible_messages,
 'Sample data only; no real deletion' AS safety_note
FROM results;
