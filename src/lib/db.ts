import mysql from 'mysql2/promise';

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

let pool: mysql.Pool;

if (globalThis._mysqlPool) {
  pool = globalThis._mysqlPool;
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 15, // A low limit is fine now that pools are cached
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
      // For count/sum queries that do double destructuring
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
      const isConnErr = err.code === 'ECONNREFUSED' || 
                        err.code === 'ENOTFOUND' || 
                        err.code === 'ETIMEDOUT' || 
                        err.code === 'ER_CON_COUNT_ERROR' ||
                        err.code === 'ER_USER_LIMIT_REACHED' ||
                        err.message?.includes('connect') ||
                        err.message?.includes('Too many connections');
      
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

  if (process.env.NODE_ENV !== 'production') {
    globalThis._mysqlPool = pool;
  }
}

export default pool;

