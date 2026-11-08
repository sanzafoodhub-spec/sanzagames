-- SanZa Chat PREVIEW ONLY — read-only retention eligibility review.
-- Does NOT delete anything, install a function, or enable pg_cron.
-- Resolution age alone does NOT authorise destruction of moderation evidence.
WITH report_review AS (
 SELECT r.id,r.message_id,r.status,r.legal_hold,r.resolved_at,
   (r.status='resolved' AND r.resolved_at < now()-interval '90 days'
     AND r.legal_hold=false
     AND NOT EXISTS (
       SELECT 1 FROM public.chat_reports x
       WHERE x.message_id=r.message_id AND x.id<>r.id
         AND (x.status='pending' OR x.legal_hold)
     )) AS meets_age_and_hold_screen
 FROM public.chat_reports r
), message_review AS (
 SELECT m.id,
   (m.created_at < now()-interval '30 days'
    AND NOT EXISTS(SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id)
   ) AS unreported_over_30_days
 FROM public.chat_messages m
)
SELECT 'ordinary_messages_30d_no_reports_review_only' AS check_name,
       count(*) FILTER(WHERE unreported_over_30_days) AS record_count
FROM message_review
UNION ALL
SELECT 'resolved_reports_90d_no_hold_review_only',
       count(*) FILTER(WHERE meets_age_and_hold_screen)
FROM report_review
UNION ALL
SELECT 'pending_reports_protected',
       count(*) FILTER(WHERE status='pending')
FROM report_review
UNION ALL
SELECT 'legal_hold_reports_protected',
       count(*) FILTER(WHERE legal_hold)
FROM report_review
UNION ALL
SELECT 'messages_referenced_by_any_report_protected',
       count(DISTINCT message_id)
FROM report_review;
