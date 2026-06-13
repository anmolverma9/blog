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

let isDbOffline = false;
let lastOfflineCheck = 0;
const OFFLINE_RETRY_INTERVAL = 30000; // 30 seconds cache window

// Wrap pool.query to handle database outages/connection issues gracefully
const originalQuery = pool.query;
pool.query = async function (this: any, ...args: any[]) {
  const now = Date.now();
  const sql = typeof args[0] === 'string'
    ? args[0].toUpperCase()
    : (args[0] && typeof args[0].sql === 'string' ? args[0].sql.toUpperCase() : '');

  const getFallback = () => {
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
  };

  if (isDbOffline && (now - lastOfflineCheck < OFFLINE_RETRY_INTERVAL)) {
    return getFallback();
  }

  try {
    const result = await (originalQuery as any).apply(this, args);
    isDbOffline = false; // Connection succeeded
    return result;
  } catch (err: any) {
    const isConnErr = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.message?.includes('connect');
    
    // Only log query connection errors once per interval window to avoid spam
    if (!isDbOffline || (now - lastOfflineCheck >= OFFLINE_RETRY_INTERVAL)) {
      console.warn('Database query error (Offline Fallback):', err.message || err);
    }

    if (isConnErr) {
      isDbOffline = true;
      lastOfflineCheck = now;
    }

    return getFallback();
  }
} as any;

export default pool;

