const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Helper to parse .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if any
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
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

async function main() {
  console.log('Connecting to database:', dbConfig.host, 'db:', dbConfig.database);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  try {
    console.log('Connection established. Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Basic SQL statements parser (splitting by semicolons that are not inside strings)
    // For schema.sql, we can split by semicolon.
    const statements = schemaSql
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.query(statement);
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err.message);
        console.error('SQL:', statement);
        throw err;
      }
    }
    console.log('Schema created successfully.');

    // Seed roles
    console.log('Seeding roles...');
    const [existingRoles] = await connection.query('SELECT name FROM roles');
    const existingRoleNames = existingRoles.map(r => r.name);
    const defaultRoles = [
      { name: 'Super Admin', description: 'Full access to the ecosystem' },
      { name: 'Editor', description: 'Can manage all blog content' },
      { name: 'Author', description: 'Can manage own blog content' },
      { name: 'Contributor', description: 'Can submit blog drafts for review' },
      { name: 'Reader', description: 'End reader/subscriber' }
    ];

    for (const role of defaultRoles) {
      if (!existingRoleNames.includes(role.name)) {
        await connection.query('INSERT INTO roles (name, description) VALUES (?, ?)', [role.name, role.description]);
        console.log(`Role '${role.name}' created.`);
      }
    }

    // Seed permissions
    console.log('Seeding permissions...');
    const [existingPerms] = await connection.query('SELECT permission_key FROM permissions');
    const existingPermKeys = existingPerms.map(p => p.permission_key);
    const defaultPerms = [
      { name: 'Manage All Content', key: 'manage_all_content', description: 'Create, edit, delete any post, page, category, or tag' },
      { name: 'Manage Own Content', key: 'manage_own_content', description: 'Create, edit, delete own posts' },
      { name: 'Manage Users', key: 'manage_users', description: 'Create, edit, delete users and authors' },
      { name: 'Manage Settings', key: 'manage_settings', description: 'Modify application settings, analytics codes, and redirects' }
    ];

    for (const perm of defaultPerms) {
      if (!existingPermKeys.includes(perm.key)) {
        await connection.query('INSERT INTO permissions (name, permission_key, description) VALUES (?, ?, ?)', [perm.name, perm.key, perm.description]);
        console.log(`Permission '${perm.key}' created.`);
      }
    }

    // Map permissions to roles
    console.log('Mapping permissions to roles...');
    const [[superAdminRole]] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Super Admin']);
    const [[editorRole]] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Editor']);
    const [[authorRole]] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Author']);
    const [[contributorRole]] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Contributor']);

    const [perms] = await connection.query('SELECT id, permission_key FROM permissions');
    const permMap = perms.reduce((acc, p) => {
      acc[p.permission_key] = p.id;
      return acc;
    }, {});

    const mappings = [
      // Super Admin gets all
      { roleId: superAdminRole.id, permId: permMap['manage_all_content'] },
      { roleId: superAdminRole.id, permId: permMap['manage_own_content'] },
      { roleId: superAdminRole.id, permId: permMap['manage_users'] },
      { roleId: superAdminRole.id, permId: permMap['manage_settings'] },
      // Editor gets all content
      { roleId: editorRole.id, permId: permMap['manage_all_content'] },
      { roleId: editorRole.id, permId: permMap['manage_own_content'] },
      // Author gets own content
      { roleId: authorRole.id, permId: permMap['manage_own_content'] },
      // Contributor gets own content
      { roleId: contributorRole.id, permId: permMap['manage_own_content'] }
    ];

    for (const m of mappings) {
      try {
        await connection.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [m.roleId, m.permId]);
      } catch (err) {
        console.error('Error inserting mapping:', err.message);
      }
    }

    // Seed default admin user if none exists
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('Seeding default Super Admin user...');
      const adminEmail = 'dscurlock@mail.com';
      const adminPassword = 'adminpassword123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, name, role_id, status) VALUES (?, ?, ?, ?, ?)',
        [adminEmail, passwordHash, 'D. Scurlock', superAdminRole.id, 'active']
      );

      const userId = userResult.insertId;

      // Create author profile
      await connection.query(
        'INSERT INTO authors (user_id, bio) VALUES (?, ?)',
        [userId, 'Co-founder & Chief Editor of AppLuxe. Tech enthusiast and SaaS entrepreneur.']
      );

      console.log('====================================================');
      console.log('DEFAULT ADMIN USER SEEDED:');
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('====================================================');
    } else {
      console.log('Users already exist, skipping admin seeding.');
    }

    // Seed page templates
    console.log('Seeding page templates...');
    const [templates] = await connection.query('SELECT name FROM page_templates');
    const templateNames = templates.map(t => t.name);
    const defaultTemplates = [
      { name: 'Standard Page', file_name: 'standard.tsx', description: 'Standard layout with header and footer.' },
      { name: 'Landing Page', file_name: 'landing.tsx', description: 'Landing page layout with full controls and sections.' },
      { name: 'Full Width Page', file_name: 'fullwidth.tsx', description: 'Full width page with no sidebars.' }
    ];

    for (const t of defaultTemplates) {
      if (!templateNames.includes(t.name)) {
        await connection.query('INSERT INTO page_templates (name, file_name, description) VALUES (?, ?, ?)', [t.name, t.file_name, t.description]);
        console.log(`Page template '${t.name}' created.`);
      }
    }

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error during database initialization:', err.stack);
  } finally {
    await connection.end();
  }
}

main();
