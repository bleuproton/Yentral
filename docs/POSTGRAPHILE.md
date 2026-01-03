# PostGraphile Integration Guide

PostGraphile is now integrated into the Yentral project, providing an instant GraphQL API over your PostgreSQL database. This guide will help you get started with PostGraphile.

## 🎯 Overview

PostGraphile automatically generates a GraphQL API from your PostgreSQL database schema. It includes:

- **GraphQL API**: Fully-featured GraphQL endpoint with queries, mutations, and subscriptions
- **GraphiQL Interface**: Interactive in-browser IDE for exploring and testing your API
- **Real-time Subscriptions**: WebSocket support for live data updates
- **Schema Watching**: Automatic hot reload when your database schema changes
- **Type Safety**: Full TypeScript support

## 🚀 Quick Start

### Prerequisites

- PostgreSQL database running (see `DATABASE_URL` in `.env`)
- Node.js and pnpm installed
- Project dependencies installed (`pnpm install`)

### Starting PostGraphile

There are three ways to run PostGraphile:

#### 1. CLI Mode (Recommended for Development)

Start PostGraphile as a standalone server:

```bash
pnpm run postgraphile
# or
pnpm run postgraphile:cli
```

This will start PostGraphile on port 5000 (configurable via `POSTGRAPHILE_PORT`):

- GraphQL API: `http://localhost:5000/graphql`
- GraphiQL Interface: `http://localhost:5000/graphiql`

#### 2. Programmatic Integration

Integrate PostGraphile into your existing Express application:

```typescript
import express from 'express';
import { createPostGraphileMiddleware } from './scripts/postgraphile-server';

const app = express();

// Your existing routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Add PostGraphile
app.use(createPostGraphileMiddleware());

app.listen(3000, () => {
  console.log('Server running with PostGraphile at http://localhost:3000/graphiql');
});
```

#### 3. Standalone Programmatic Server

Run the programmatic server directly:

```bash
pnpm run postgraphile:server
```

This runs on port 4000 by default (configurable via `POSTGRAPHILE_PORT`).

## ⚙️ Configuration

### Environment Variables

Add these to your `.env` file:

```env
# PostgreSQL Connection (Required)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral?schema=public

# PostGraphile Configuration (Optional)
POSTGRAPHILE_PORT=5000
POSTGRAPHILE_SCHEMA=public

# Environment
NODE_ENV=development
```

### Advanced Configuration

You can customize PostGraphile options in `scripts/postgraphile-server.ts`:

```typescript
const middleware = createPostGraphileMiddleware({
  schema: 'public', // or ['public', 'other_schema']
  graphiql: true,
  subscriptions: true,
  watchPg: true,
  options: {
    // Add any additional PostGraphile options here
    // See: https://www.graphile.org/postgraphile/usage-library/
  }
});
```

## 🎨 Using GraphiQL

Once PostGraphile is running, open GraphiQL in your browser:

```
http://localhost:5000/graphiql
```

### Example Queries

Here are some example queries to get you started:

#### Query all users

```graphql
query GetUsers {
  allUsers {
    nodes {
      id
      email
      name
      role
      createdAt
    }
  }
}
```

#### Query with pagination

```graphql
query GetProductsPaginated {
  allProducts(first: 10, orderBy: CREATED_AT_DESC) {
    nodes {
      id
      name
      description
      status
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Query with filtering

```graphql
query GetActiveProducts {
  allProducts(condition: { status: ACTIVE }) {
    nodes {
      id
      name
      price
      status
    }
  }
}
```

#### Mutation example

```graphql
mutation CreateProduct {
  createProduct(
    input: {
      product: {
        name: "New Product"
        description: "A test product"
        sku: "TEST-001"
        price: 29.99
        status: DRAFT
        tenantId: "your-tenant-id"
      }
    }
  ) {
    product {
      id
      name
      status
    }
  }
}
```

#### Subscription example

```graphql
subscription OnProductCreated {
  listen(topic: "product_created") {
    relatedNode {
      ... on Product {
        id
        name
        status
      }
    }
  }
}
```

## 🔐 Security Considerations

### Multi-Tenancy

PostGraphile respects PostgreSQL's Row-Level Security (RLS). To implement multi-tenancy:

1. **Set up RLS policies** in your PostgreSQL database:

```sql
-- Example: Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to filter by tenant
CREATE POLICY tenant_isolation_policy ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

2. **Configure request-level settings** in `scripts/postgraphile-server.ts`:

```typescript
async pgSettings(req) {
  const tenantId = req.user?.tenantId; // Get from authentication
  return {
    'app.current_tenant_id': tenantId,
    role: 'yentral_user',
  };
}
```

### Authentication

To secure your GraphQL endpoint, integrate authentication middleware:

```typescript
import { createPostGraphileMiddleware } from './scripts/postgraphile-server';
import { authMiddleware } from './your-auth-middleware';

const app = express();

// Add authentication before PostGraphile
app.use('/graphql', authMiddleware);
app.use('/graphiql', authMiddleware);

// Add PostGraphile
app.use(createPostGraphileMiddleware());
```

## 🛠️ Development Tips

### 1. Schema Changes

PostGraphile automatically watches for schema changes in development mode. When you:
- Add a new table
- Modify columns
- Add or change functions

PostGraphile will hot-reload and update the GraphQL schema automatically.

### 2. Disable Features in Production

For production, consider these settings:

```typescript
const middleware = createPostGraphileMiddleware({
  graphiql: false, // Disable GraphiQL in production
  watchPg: false, // Disable schema watching
  options: {
    showErrorStack: false,
    extendedErrors: [],
    enableCors: false, // Disable CORS or configure properly
  }
});
```

### 3. Performance Optimization

- **Connection Pooling**: PostGraphile uses a connection pool by default
- **Query Complexity**: Consider adding query complexity limits for production
- **Caching**: Use `@graphile/pg-simplify-inflector` for better cache keys

### 4. Custom Functions

Create PostgreSQL functions to expose custom business logic:

```sql
CREATE FUNCTION get_product_summary(product_id uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'total_variants', (SELECT COUNT(*) FROM product_variants WHERE product_id = $1)
  )
  FROM products WHERE id = $1;
$$ LANGUAGE sql STABLE;
```

This function will automatically be available in GraphQL as a query.

## 📚 Additional Resources

- [PostGraphile Documentation](https://www.graphile.org/postgraphile/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 🐛 Troubleshooting

### PostGraphile won't start

**Issue**: `DATABASE_URL is required` error

**Solution**: Make sure your `.env` file has the `DATABASE_URL` set:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral?schema=public
```

### No tables visible in GraphiQL

**Issue**: GraphiQL shows no queries or types

**Solution**: 
1. Check that your database has tables in the specified schema
2. Verify `POSTGRAPHILE_SCHEMA` matches your database schema
3. Make sure the database user has proper permissions:
```sql
GRANT USAGE ON SCHEMA public TO yentral_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO yentral_user;
```

### Subscriptions not working

**Issue**: WebSocket subscriptions fail to connect

**Solution**: 
1. Ensure `subscriptions: true` is enabled in the configuration
2. Check that your client supports WebSocket connections
3. Verify firewall/proxy settings allow WebSocket connections

### Schema changes not reflecting

**Issue**: Made database changes but GraphQL schema hasn't updated

**Solution**:
1. In development, `watchPg` should handle this automatically
2. If not working, restart PostGraphile
3. Check PostgreSQL logs for connection issues

## 🎯 Next Steps

1. **Explore your schema** using GraphiQL
2. **Set up authentication** to secure your endpoints
3. **Implement RLS policies** for multi-tenant data isolation
4. **Create custom functions** for business logic
5. **Add subscriptions** for real-time features
6. **Optimize queries** with proper indexes

Happy GraphQL-ing! 🚀
