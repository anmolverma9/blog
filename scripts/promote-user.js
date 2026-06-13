const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'appluxe',
};

async function main() {
  const targetEmail = process.argv[2] || 'dscurlock@mail.com';
  const targetPassword = process.argv[3] || 'adminpassword123';
  const targetName = 'D. Scurlock';

  console.log(`Connecting to database at ${dbConfig.host} (db: ${dbConfig.database})...`);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL successfully!');

    // 1. Get the Super Admin role ID
    const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Super Admin']);
    if (roles.length === 0) {
      console.error('Super Admin role does not exist in roles table. Please initialize the DB first using scripts/init-db.js.');
      process.exit(1);
    }
    const superAdminRoleId = roles[0].id;

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(targetPassword, 10);

    // 3. Check if user exists
    const [users] = await connection.query('SELECT id, role_id FROM users WHERE email = ?', [targetEmail]);

    if (users.length === 0) {
      console.log(`User '${targetEmail}' not found. Creating a new Super Admin user...`);
      const [insertResult] = await connection.query(
        'INSERT INTO users (email, password_hash, name, role_id, status) VALUES (?, ?, ?, ?, ?)',
        [targetEmail, passwordHash, targetName, superAdminRoleId, 'active']
      );
      const userId = insertResult.insertId;

      // Check/create author profile
      const [existingAuthor] = await connection.query('SELECT id FROM authors WHERE user_id = ?', [userId]);
      if (existingAuthor.length === 0) {
        await connection.query(
          'INSERT INTO authors (user_id, bio) VALUES (?, ?)',
          [userId, 'Co-founder & Chief Editor. Tech enthusiast and SaaS entrepreneur.']
        );
      }
      console.log(`SUCCESS: Created new Super Admin user: ${targetEmail}`);
    } else {
      const userId = users[0].id;
      console.log(`User '${targetEmail}' found. Promoting to Super Admin and updating password...`);
      await connection.query(
        'UPDATE users SET role_id = ?, password_hash = ?, status = ? WHERE id = ?',
        [superAdminRoleId, passwordHash, 'active', userId]
      );

      // Check/create author profile
      const [existingAuthor] = await connection.query('SELECT id FROM authors WHERE user_id = ?', [userId]);
      if (existingAuthor.length === 0) {
        await connection.query(
          'INSERT INTO authors (user_id, bio) VALUES (?, ?)',
          [userId, 'Co-founder & Chief Editor. Tech enthusiast and SaaS entrepreneur.']
        );
      }
      console.log(`SUCCESS: User '${targetEmail}' has been successfully promoted to Super Admin.`);
    }

  } catch (err) {
    console.error('Database Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
