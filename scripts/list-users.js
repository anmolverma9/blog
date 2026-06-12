const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'appluxe',
};

async function main() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.query('SELECT u.id, u.email, u.name, u.role_id, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id');
    console.log(JSON.stringify(users, null, 2));
    await connection.end();
  } catch (err) {
    console.error('Database query error:', err.message);
  }
}

main();
