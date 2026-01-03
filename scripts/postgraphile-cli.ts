#!/usr/bin/env tsx
/**
 * PostGraphile CLI Script
 * 
 * This script starts PostGraphile with the recommended configuration for the Yentral project.
 * It provides a GraphQL API endpoint with GraphiQL interface, real-time subscriptions,
 * and automatic schema watching for database changes.
 * 
 * Usage:
 *   npm run postgraphile:cli
 *   or
 *   tsx scripts/postgraphile-cli.ts
 * 
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   POSTGRAPHILE_PORT - Port to run PostGraphile on (default: 5000)
 *   POSTGRAPHILE_SCHEMA - Database schema to expose (default: public)
 * 
 * Features enabled:
 *   - GraphiQL interface at http://localhost:5000/graphiql
 *   - Real-time subscriptions via WebSockets
 *   - Database schema watching (hot reload on schema changes)
 *   - Enhanced GraphiQL with Explorer plugin
 *   - Dynamic JSON support
 *   - CORS enabled for development
 */

import { postgraphile } from 'postgraphile';
import { createServer } from 'http';
import * as dotenv from 'dotenv';
import { validateDatabaseUrl, getPostGraphilePort, getPostGraphileSchema } from './postgraphile-utils.js';

// Load environment variables
dotenv.config();

// Configuration
const DATABASE_URL = validateDatabaseUrl();
const PORT = getPostGraphilePort(5000);
const SCHEMA = getPostGraphileSchema('public');

console.log('🚀 Starting PostGraphile...');
console.log(`📊 Database Schema: ${SCHEMA}`);
console.log(`🌐 Port: ${PORT}`);

// Create PostGraphile middleware
const middleware = postgraphile(DATABASE_URL, SCHEMA, {
  // Enable GraphiQL interface
  graphiql: true,
  
  // Enhanced GraphiQL with additional features
  enhanceGraphiql: true,
  
  // Enable real-time subscriptions
  subscriptions: true,
  
  // Watch for schema changes and hot reload
  watchPg: true,
  
  // Enable dynamic JSON
  dynamicJson: true,
  
  // Show error details (useful for development, disable in production)
  showErrorStack: process.env.NODE_ENV !== 'production',
  extendedErrors: process.env.NODE_ENV !== 'production' ? ['hint', 'detail', 'errcode'] : [],
  
  // Allow CORS (for development)
  enableCors: true,
  
  // Expose GraphQL Playground/GraphiQL on root path
  graphqlRoute: '/graphql',
  graphiqlRoute: '/graphiql',
  
  // Additional options
  legacyRelations: 'omit', // Exclude deprecated relation fields
  setofFunctionsContainNulls: false,
  ignoreRBAC: false, // Respect row-level security
  ignoreIndexes: false,
  
  // Connection pool settings
  pgSettings: {
    // Custom PostgreSQL settings can be added here
    statement_timeout: '30000', // 30 seconds
  },
  
  // Add request-level pg settings (useful for multi-tenancy)
  additionalGraphQLContextFromRequest: async (req) => {
    // You can add custom logic here, e.g., setting tenant context
    return {
      // Add any request-specific context
    };
  },
});

// Create HTTP server
const server = createServer(middleware);

// Start server
server.listen(PORT, () => {
  console.log('✅ PostGraphile server is running!');
  console.log('');
  console.log('📍 Endpoints:');
  console.log(`   GraphQL API:  http://localhost:${PORT}/graphql`);
  console.log(`   GraphiQL UI:  http://localhost:${PORT}/graphiql`);
  console.log('');
  console.log('🔍 Try running a query in GraphiQL!');
  console.log('');
  console.log('💡 Tips:');
  console.log('   - Use GraphiQL Explorer to browse your schema');
  console.log('   - Subscriptions are enabled for real-time updates');
  console.log('   - Schema changes are watched automatically');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down PostGraphile server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down PostGraphile server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
