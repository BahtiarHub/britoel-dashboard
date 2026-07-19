-- The application connects directly to PostgreSQL. Do not expose application
-- tables through Supabase's anon/authenticated Data API roles.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification',
    'whatsapp_contacts', 'upload_records', 'branch_profiles', 'loan_records',
    'loan_mantri_assignments', 'nominative_ckpn_records',
    'missing_loan_resolutions', 'ckpn_forecasts', 'deposit_records',
    'quick_count_results', 'whatsapp_campaigns',
    'whatsapp_campaign_recipients', 'audit_logs', 'warning_letters',
    'covenance_records', 'brimen_customers', 'brimen_file_loans',
    'brimen_file_loan_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
  END IF;
END $$;
