/**
 * Utility functions for PostGraphile setup
 */

/**
 * Validates that the DATABASE_URL environment variable is set
 * 
 * @param databaseUrl - Optional database URL to validate, otherwise uses DATABASE_URL env var
 * @returns The validated database URL
 * @throws Error if DATABASE_URL is not set
 */
export function validateDatabaseUrl(databaseUrl?: string): string {
  const url = databaseUrl || process.env.DATABASE_URL;
  
  if (!url) {
    throw new Error(
      'DATABASE_URL is required for PostGraphile. ' +
      'Set it in your .env file or pass it in the config.\n\n' +
      'Example:\n' +
      'DATABASE_URL=postgresql://user:password@localhost:5432/yentral?schema=public'
    );
  }
  
  return url;
}

/**
 * Gets the PostGraphile port from environment or uses default
 * 
 * @param defaultPort - Default port if POSTGRAPHILE_PORT is not set
 * @returns The port number
 */
export function getPostGraphilePort(defaultPort: number = 5000): number {
  return parseInt(process.env.POSTGRAPHILE_PORT || String(defaultPort), 10);
}

/**
 * Gets the database schema from environment or uses default
 * 
 * @param defaultSchema - Default schema if POSTGRAPHILE_SCHEMA is not set
 * @returns The schema name
 */
export function getPostGraphileSchema(defaultSchema: string = 'public'): string {
  return process.env.POSTGRAPHILE_SCHEMA || defaultSchema;
}
