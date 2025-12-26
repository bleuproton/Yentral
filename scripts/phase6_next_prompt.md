If issues remain (warnings from phase6_verify):

- Fix tenant safety warnings: ensure Membership→User (global) is intentionally global; PluginInstallation→Plugin, LegalEntity/TaxProfile→Jurisdiction, Ticket→author/assignee, AuditEvent→User, IntegrationConnection→ConnectorVersion are tenant-safe or explicitly documented as global refs. Add composite tenant FK where applicable, or mark as intentional global and update the verifier allowlist.
- Add DATABASE_URL in .env so db pull check can run; rerun phase6_verify.
- After schema changes, generate a migration that hardens any cross-tenant FKs to composite (tenantId, id) and re-run prisma migrate deploy + phase6_verify.

Concrete Codex prompt to run next:
```
You are working in the Yentral repo. Address the phase6_verify warnings:
1) For Membership, PluginInstallation, LegalEntity/TaxProfile, Ticket (author/assignee), AuditEvent, IntegrationConnection: ensure relations are tenant-safe. Add composite FKs with tenantId where appropriate or explicitly mark them as global exceptions and update scripts/phase6_verify.ts allowlist.
2) If any schema changes are needed, update prisma/schema.prisma and create a new migration named phase6_tenant_fk_cleanup, then run prisma migrate dev (or deploy) and prisma generate.
3) Set DATABASE_URL in .env and rerun npm run phase6:verify until zero critical/warnings (except intentional global refs documented).
Provide a summary of fixes and commands run.
```

If everything is clean (no warnings/criticals), use this prompt for Phase 7:
```
Phase 7: Implement tenant enforcement middleware + query guards + audit injection.
Tasks:
- Add middleware to ensure every API route resolves tenant from session/membership and injects tenantId into service calls.
- Add repository/service guards that assert tenantId on all lookups and writes.
- Add audit logging helper that records tenantId, actor, action, resourceType/id for all mutating routes.
- Update a sample route to use the middleware/guards, then add a smoke script to exercise it.
```
