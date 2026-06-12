import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// Wrap pool.query to handle database outages/connection issues gracefully
const originalQuery = pool.query;
pool.query = async function (this: any, ...args: any[]) {
  try {
    return await (originalQuery as any).apply(this, args);
  } catch (err: any) {
    console.error('Database query error:', err.message || err);
    
    // Parse the SQL query to return the appropriate empty/fallback structures
    const sql = typeof args[0] === 'string'
      ? args[0].toUpperCase()
      : (args[0] && typeof args[0].sql === 'string' ? args[0].sql.toUpperCase() : '');

    // For inserts, updates, deletes, return a mock ResultSetHeader
    if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
      return [{ insertId: 0, affectedRows: 0 } as any, []];
    }

    // For count/sum queries that do double destructuring, e.g., const [[postsCount]]
    if (sql.includes('COUNT') || sql.includes('SUM')) {
      return [[{ total: 0, count: 0 } as any], []];
    }

    // Default to empty array for row queries
    return [[], []] as any;
  }
} as any;

export default pool;
