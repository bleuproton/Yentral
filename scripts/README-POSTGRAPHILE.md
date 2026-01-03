# PostGraphile Scripts

This directory contains scripts for running and managing PostGraphile in the Yentral project.

## Available Scripts

### 1. `postgraphile-cli.ts` - CLI Server

Standalone PostGraphile server that runs independently.

**Usage:**
```bash
pnpm postgraphile
# or
pnpm postgraphile:cli
# or
pnpm exec tsx scripts/postgraphile-cli.ts
```

**Configuration:**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `POSTGRAPHILE_PORT` - Server port (default: 5000)
- `POSTGRAPHILE_SCHEMA` - Database schema to expose (default: public)

**Access:**
- GraphQL API: http://localhost:5000/graphql
- GraphiQL UI: http://localhost:5000/graphiql

### 2. `postgraphile-server.ts` - Programmatic Integration

Express middleware for integrating PostGraphile into your application.

**Usage:**
```bash
pnpm postgraphile:server
```

Or integrate into your own Express app:
```typescript
import { createPostGraphileMiddleware } from './scripts/postgraphile-server';

app.use(createPostGraphileMiddleware({
  schema: 'public',
  graphiql: true,
  subscriptions: true,
}));
```

See [examples/express-postgraphile.ts](../examples/express-postgraphile.ts) for a complete example.

### 3. `test-postgraphile-setup.ts` - Setup Validation

Smoke test to validate PostGraphile setup without requiring a database.

**Usage:**
```bash
pnpm exec tsx scripts/test-postgraphile-setup.ts
```

This validates:
- PostGraphile modules can be imported
- Configuration is valid
- Environment variables are set

## Quick Start

1. **Set up environment variables** in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral?schema=public
   POSTGRAPHILE_PORT=5000
   POSTGRAPHILE_SCHEMA=public
   ```

2. **Start your PostgreSQL database**

3. **Run PostGraphile**:
   ```bash
   pnpm postgraphile
   ```

4. **Open GraphiQL** in your browser:
   ```
   http://localhost:5000/graphiql
   ```

## Features

- ✅ **Instant GraphQL API** - Auto-generated from database schema
- ✅ **GraphiQL Interface** - Interactive API explorer with docs
- ✅ **Real-time Subscriptions** - WebSocket support for live updates
- ✅ **Schema Watching** - Hot reload on database changes (development)
- ✅ **Dynamic JSON** - Flexible JSON field handling
- ✅ **TypeScript Support** - Full type safety
- ✅ **Row-Level Security** - Respects PostgreSQL RLS policies
- ✅ **Multi-tenancy Ready** - Context-based tenant isolation

## Documentation

For detailed setup instructions, configuration options, and examples, see:
- [docs/POSTGRAPHILE.md](../docs/POSTGRAPHILE.md) - Complete integration guide
- [examples/express-postgraphile.ts](../examples/express-postgraphile.ts) - Express integration example

## Troubleshooting

### "DATABASE_URL is required" error
Make sure your `.env` file has the `DATABASE_URL` set:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/yentral?schema=public
```

### Port already in use
Change the port in your `.env` file:
```env
POSTGRAPHILE_PORT=5001
```

### TypeScript errors
Run the setup test to validate your configuration:
```bash
pnpm exec tsx scripts/test-postgraphile-setup.ts
```

## Security Notes

**For Production:**
- Disable GraphiQL: Set `graphiql: false` in configuration
- Disable schema watching: Set `watchPg: false`
- Add authentication middleware
- Configure CORS properly
- Set up PostgreSQL row-level security (RLS)
- Use connection pooling
- Monitor query complexity

**For Development:**
- GraphiQL is enabled by default
- Schema watching is enabled for hot reload
- CORS is enabled for easier development
- Extended error messages are shown

## Additional Resources

- [PostGraphile Documentation](https://www.graphile.org/postgraphile/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
