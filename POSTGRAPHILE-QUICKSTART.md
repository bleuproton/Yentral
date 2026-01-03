# 🚀 PostGraphile Quick Start

Get a GraphQL API running over your PostgreSQL database in seconds!

## Start PostGraphile

```bash
pnpm postgraphile
```

Visit: **http://localhost:5000/graphiql** 🎨

## What You Get

- **GraphQL API** at `/graphql`
- **GraphiQL Interface** at `/graphiql` 
- **Real-time Subscriptions** via WebSocket
- **Auto-generated Schema** from your database
- **Hot Reload** when schema changes

## Environment Setup

Add to your `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/yentral?schema=public
POSTGRAPHILE_PORT=5000
POSTGRAPHILE_SCHEMA=public
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm postgraphile` | Start PostGraphile CLI server |
| `pnpm postgraphile:server` | Start programmatic server |
| `pnpm exec tsx scripts/test-postgraphile-setup.ts` | Validate setup |

## Example Query

Try this in GraphiQL:

```graphql
query GetProducts {
  allProducts(first: 10) {
    nodes {
      id
      name
      status
    }
  }
}
```

## Integration with Express

```typescript
import { createPostGraphileMiddleware } from './scripts/postgraphile-server';

app.use(createPostGraphileMiddleware());
```

See `examples/express-postgraphile.ts` for complete example.

## Documentation

- **Complete Guide**: [docs/POSTGRAPHILE.md](docs/POSTGRAPHILE.md)
- **Scripts README**: [scripts/README-POSTGRAPHILE.md](scripts/README-POSTGRAPHILE.md)
- **Example App**: [examples/express-postgraphile.ts](examples/express-postgraphile.ts)

## Features

✅ Instant GraphQL API from PostgreSQL  
✅ Interactive GraphiQL playground  
✅ Real-time subscriptions  
✅ Schema watching (hot reload)  
✅ Row-level security support  
✅ Multi-tenancy ready  
✅ TypeScript support  

---

**Need help?** Check out the [full documentation](docs/POSTGRAPHILE.md) or visit [graphile.org](https://www.graphile.org/postgraphile/)
