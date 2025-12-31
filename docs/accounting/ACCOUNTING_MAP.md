---
# ACCOUNTING_MAP.md

## Frontend

### Accounting / Finance Pages and Components
1. **Audit Logging**
   - Location: `src/server/audit/audit.ts`
   - Description: Logging actions and metadata, e.g., `writeAudit()`.
   - States: None implemented.

2. **VAT OSS Services**
   - Location: `src/server/services/vatOssService.ts`
   - Description: Handles VAT transactions and generates OSS VAT reports.
   - States: Basic implementation. Adds `vatTransaction` entities and summary reporting.

3. **Invoice and Document Services**
   - Location: `src/domain/finance/invoice.service.ts`
   - Components: Generates invoices, integrates SKU lines. Interacts server-to-VAT. Limited typing.

--- (To Be Completed for all referenced services and actions provided above OR derivatives)