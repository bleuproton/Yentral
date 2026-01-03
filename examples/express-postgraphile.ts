/**
 * Example: Express Server with PostGraphile Integration
 * 
 * This file demonstrates how to integrate PostGraphile into an existing Express application.
 * Copy and adapt this code for your use case.
 * 
 * To run this example:
 *   tsx examples/express-postgraphile.ts
 */

import express from 'express';
import { createPostGraphileMiddleware } from '../scripts/postgraphile-server';

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());

// Example: Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Yentral API'
  });
});

// Example: Custom API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API is running',
    endpoints: {
      graphql: '/graphql',
      graphiql: '/graphiql',
      health: '/health'
    }
  });
});

// Example: Authentication middleware (optional)
// Uncomment and implement based on your auth strategy
/*
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Verify token and attach user to request
  // req.user = verifyToken(token);
  
  next();
};

// Protect GraphQL endpoints
app.use('/graphql', authMiddleware);
app.use('/graphiql', authMiddleware);
*/

// Add PostGraphile middleware
// This will handle all GraphQL requests at /graphql and /graphiql
app.use(createPostGraphileMiddleware({
  // Customize configuration here if needed
  graphiql: true,
  subscriptions: true,
  watchPg: process.env.NODE_ENV !== 'production',
  
  // Example: Custom schema selection
  // schema: ['public', 'custom_schema'],
  
  // Example: Additional options
  options: {
    // Add any PostGraphile options here
  }
}));

// Example: Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Express + PostGraphile Server Started!');
  console.log('');
  console.log('📍 Available Endpoints:');
  console.log(`   API Status:   http://localhost:${PORT}/api/status`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   GraphQL API:  http://localhost:${PORT}/graphql`);
  console.log(`   GraphiQL UI:  http://localhost:${PORT}/graphiql`);
  console.log('');
  console.log('💡 Tips:');
  console.log('   - Open GraphiQL in your browser to explore your schema');
  console.log('   - Use the GraphQL endpoint in your client applications');
  console.log('   - Enable authentication middleware for production use');
  console.log('');
});

export default app;
