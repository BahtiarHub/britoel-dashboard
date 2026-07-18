WITH branch_mantri AS (
  SELECT DISTINCT ON ("branch_code")
    "branch_code",
    "name",
    COALESCE("display_username", "username", "name") AS "login_username"
  FROM "user"
  WHERE "role" = 'Mantri' AND "active" = true
  ORDER BY "branch_code", "created_at" ASC
)
UPDATE "brimen_file_loans" AS loan
SET
  "borrower_name" = branch_mantri."name",
  "borrower_username" = branch_mantri."login_username",
  "updated_at" = NOW()
FROM "brimen_customers" AS customer, branch_mantri
WHERE loan."customer_id" = customer."id"
  AND branch_mantri."branch_code" = customer."branch_code"
  AND loan."borrower_username" = 'USER_NON_CS'
  AND loan."status" <> 'Sudah Dikembalikan';
