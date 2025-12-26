-- Tables missing tenantId column
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = t.table_name
    AND c.column_name = 'tenantId'
);

-- Global unique constraints (review to ensure they are on intended global tables only)
SELECT conname AS constraint_name, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'u'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- Foreign keys where child has tenantId but parent may not (manual review)
SELECT
  conrelid::regclass AS child_table,
  confrelid::regclass AS parent_table,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN information_schema.columns cc ON cc.table_name = conrelid::regclass::text AND cc.column_name = 'tenantId'
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace;
