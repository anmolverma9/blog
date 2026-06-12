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
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'appluxe',
};

async function main() {
  const targetEmail = 'dscurlock@mail.com';
  const targetPassword = 'adminpassword123';
  const targetName = 'D. Scurlock';

  console.log(`Connecting to database at ${dbConfig.host} (db: ${dbConfig.database})...`);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL successfully!');

    // Hash the target password
    const passwordHash = await bcrypt.hash(targetPassword, 10);

    // 1. Check if the Super Admin role exists
    const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Super Admin']);
    if (roles.length === 0) {
      console.error('Super Admin role does not exist in roles table. Please initialize the DB first using scripts/init-db.js.');
      process.exit(1);
    }
    const superAdminRoleId = roles[0].id;

    // 2. Check if a user with target email already exists
    const [existingTarget] = await connection.query('SELECT id FROM users WHERE email = ?', [targetEmail]);
    if (existingTarget.length > 0) {
      console.log(`User with email '${targetEmail}' exists. Updating password and setting role to Super Admin (ID: ${superAdminRoleId})...`);
      await connection.query(
        'UPDATE users SET password_hash = ?, name = ?, role_id = ? WHERE id = ?',
        [passwordHash, targetName, superAdminRoleId, existingTarget[0].id]
      );
      console.log(`SUCCESS: Login details and role for ${targetEmail} have been updated to Super Admin.`);
      return;
    }

    // 3. Check if default user admin@appluxe.com exists, so we can convert it
    const [existingLegacy] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@appluxe.com']);
    if (existingLegacy.length > 0) {
      console.log("Legacy admin 'admin@appluxe.com' user found. Converting to new email & password...");
      await connection.query(
        'UPDATE users SET email = ?, password_hash = ?, name = ? WHERE id = ?',
        [targetEmail, passwordHash, targetName, existingLegacy[0].id]
      );
      console.log(`SUCCESS: Legacy admin converted to ${targetEmail} with new password.`);
      return;
    }

    // 4. Create new Super Admin user if no user exists with either email
    console.log(`Neither '${targetEmail}' nor 'admin@appluxe.com' found. Creating new Super Admin...`);
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

    console.log(`SUCCESS: Created new Super Admin user:`);
    console.log(`- Email: ${targetEmail}`);
    console.log(`- Name:  ${targetName}`);
  } catch (err) {
    console.error('Database Error:', err.message);
    console.error('\nNOTE: If your local database is currently offline, you can run this script manually using:');
    console.error('  node scripts/update-admin.js');
    console.error('once your MySQL service is started.');
  } finally {
    if (connection) await connection.end();
  }
}

main();
