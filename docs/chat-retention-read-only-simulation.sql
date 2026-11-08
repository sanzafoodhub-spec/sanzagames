-- SanZa Chat preview: READ-ONLY retention simulation.
-- Uses inline sample data only. No tables created, no writes, no cron jobs.
WITH sample_messages(id,days_old) AS (
 VALUES (1,40),(2,40),(3,40),(4,40),(5,10),(6,40)
), sample_reports(id,message_id,status,days_since_resolution,legal_hold) AS (
 VALUES
 (12,2,'pending',NULL::integer,false),
 (13,3,'resolved',100,true),
 (14,4,'resolved',100,false),
 (16,6,'resolved',20,false)
), report_decisions AS (
 SELECT r.id,r.message_id,
   (r.status='resolved' AND r.days_since_resolution>90 AND NOT r.legal_hold
    AND NOT EXISTS (
      SELECT 1 FROM sample_reports other
      WHERE other.message_id=r.message_id AND other.id<>r.id
        AND (other.status='pending' OR other.legal_hold)
    )) AS eligible_for_deletion
 FROM sample_reports r
), message_decisions AS (
 SELECT m.id,
   (m.days_old>30 AND NOT EXISTS (
     SELECT 1 FROM sample_reports r
     JOIN report_decisions d ON d.id=r.id
     WHERE r.message_id=m.id AND NOT d.eligible_for_deletion
   )) AS eligible_for_deletion
 FROM sample_messages m
)
SELECT
 CASE WHEN
   (SELECT array_agg(id ORDER BY id) FROM report_decisions WHERE eligible_for_deletion)=ARRAY[14]
   AND (SELECT array_agg(id ORDER BY id) FROM message_decisions WHERE eligible_for_deletion)=ARRAY[1,4]
 THEN 'PASS' ELSE 'FAIL' END AS simulation_result,
 (SELECT array_agg(id ORDER BY id) FROM report_decisions WHERE eligible_for_deletion) AS eligible_report_ids,
 (SELECT array_agg(id ORDER BY id) FROM message_decisions WHERE eligible_for_deletion) AS eligible_message_ids;
