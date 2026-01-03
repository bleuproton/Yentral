/**
 * PostGraphile Programmatic Integration
 * 
 * This file provides Express middleware for integrating PostGraphile programmatically
 * into your Node.js application. This approach allows you to run PostGraphile alongside
 * your existing Express application.
 * 
 * Usage Example:
 * 
 * ```typescript
 * import express from 'express';
 * import { createPostGraphileMiddleware } from './postgraphile-server';
 * 
 * const app = express();
 * 
 * // Add your existing routes
 * app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
 * 
 * // Add PostGraphile middleware
 * app.use(createPostGraphileMiddleware());
 * 
 * app.listen(3000, () => {
 *   console.log('Server running on http://localhost:3000');
 *   console.log('GraphiQL available at http://localhost:3000/graphiql');
 * });
 * ```
 * 
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   POSTGRAPHILE_SCHEMA - Database schema to expose (default: public)
 *   NODE_ENV - Environment (development/production)
 */

import { postgraphile, PostGraphileOptions } from 'postgraphile';
import type { RequestHandler } from 'express';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration options for PostGraphile
 */
export interface PostGraphileConfig {
  /**
   * PostgreSQL connection string
   * If not provided, will use DATABASE_URL from environment
   */
  databaseUrl?: string;
  
  /**
   * Database schema(s) to expose
   * Can be a string or array of strings
   * Default: 'public'
   */
  schema?: string | string[];
  
  /**
   * Enable GraphiQL interface
   * Default: true in development, false in production
   */
  graphiql?: boolean;
  
  /**
   * Enable real-time subscriptions
   * Default: true
   */
  subscriptions?: boolean;
  
  /**
   * Watch for database schema changes
   * Default: true in development, false in production
   */
  watchPg?: boolean;
  
  /**
   * Additional PostGraphile options
   */
  options?: PostGraphileOptions<any, any>;
}

/**
 * Create PostGraphile middleware with the recommended configuration
 * 
 * @param config - Configuration options
 * @returns Express middleware
 */
export function createPostGraphileMiddleware(
  config: PostGraphileConfig = {}
): RequestHandler {
  // Get database URL
  const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for PostGraphile. Set it in your .env file or pass it in the config.');
  }
  
  // Determine environment
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Set defaults based on environment
  const schema = config.schema || process.env.POSTGRAPHILE_SCHEMA || 'public';
  const graphiql = config.graphiql !== undefined ? config.graphiql : isDevelopment;
  const subscriptions = config.subscriptions !== undefined ? config.subscriptions : true;
  const watchPg = config.watchPg !== undefined ? config.watchPg : isDevelopment;
  
  // Build PostGraphile options
  const options: PostGraphileOptions<any, any> = {
    // GraphiQL interface
    graphiql,
    enhanceGraphiql: graphiql,
    
    // Real-time subscriptions
    subscriptions,
    
    // Schema watching
    watchPg,
    
    // Dynamic JSON support
    dynamicJson: true,
    
    // Error handling
    showErrorStack: isDevelopment,
    extendedErrors: isDevelopment ? ['hint', 'detail', 'errcode'] : [],
    
    // CORS
    enableCors: isDevelopment,
    
    // Routes
    graphqlRoute: '/graphql',
    graphiqlRoute: '/graphiql',
    
    // Security and performance
    legacyRelations: 'omit',
    setofFunctionsContainNulls: false,
    ignoreRBAC: false, // Respect row-level security
    ignoreIndexes: false,
    
    // Connection settings
    pgSettings: {
      statement_timeout: '30000', // 30 seconds
    },
    
    // Request-level settings (useful for multi-tenancy)
    additionalGraphQLContextFromRequest: async (req) => {
      // You can add custom logic here based on the request
      // For example, set tenant context from authentication
      // const tenantId = req.user?.tenantId;
      // if (tenantId) {
      //   return { tenantId };
      // }
      
      return {};
    },
    
    // Merge with any additional options provided
    ...config.options,
  };
  
  console.log('🔌 PostGraphile middleware initialized');
  console.log(`📊 Schema: ${Array.isArray(schema) ? schema.join(', ') : schema}`);
  console.log(`🎨 GraphiQL: ${graphiql ? 'enabled' : 'disabled'}`);
  console.log(`📡 Subscriptions: ${subscriptions ? 'enabled' : 'disabled'}`);
  console.log(`👀 Watch mode: ${watchPg ? 'enabled' : 'disabled'}`);
  
  // Create and return the middleware
  return postgraphile(databaseUrl, schema, options);
}

/**
 * Example standalone server using PostGraphile
 * 
 * You can run this directly with: tsx scripts/postgraphile-server.ts
 */
export async function startStandaloneServer(port: number = 4000) {
  const express = await import('express');
  const app = express.default();
  
  // Add PostGraphile middleware
  app.use(createPostGraphileMiddleware());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'postgraphile' });
  });
  
  // Start server
  app.listen(port, () => {
    console.log('');
    console.log('✅ PostGraphile server is running!');
    console.log('');
    console.log('📍 Endpoints:');
    console.log(`   Health:       http://localhost:${port}/health`);
    console.log(`   GraphQL API:  http://localhost:${port}/graphql`);
    console.log(`   GraphiQL UI:  http://localhost:${port}/graphiql`);
    console.log('');
  });
  
  return app;
}

// If this file is run directly, start the standalone server
if (require.main === module) {
  const port = parseInt(process.env.POSTGRAPHILE_PORT || '4000', 10);
  startStandaloneServer(port).catch((error) => {
    console.error('Failed to start PostGraphile server:', error);
    process.exit(1);
  });
}
