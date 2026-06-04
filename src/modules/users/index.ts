import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  name: string;
  role_id: number;
  role_name?: string;
  status: string; // active, suspended
  created_at?: Date;
  updated_at?: Date;
}

export interface Author {
  id?: number;
  user_id: number;
  bio?: string;
  avatar_id?: number | null;
  avatar_path?: string | null;
  social_twitter?: string;
  social_facebook?: string;
  social_linkedin?: string;
  author_name?: string; // from joined users table
  author_email?: string; // from joined users table
  created_at?: Date;
  updated_at?: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    const [rows]: any = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows]: any = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  async findAll(): Promise<User[]> {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.email, u.name, u.role_id, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.id DESC`
    );
    return rows;
  }

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, password_hash, name, role_id, status) VALUES (?, ?, ?, ?, ?)',
      [user.email, user.password_hash, user.name, user.role_id, user.status || 'active']
    );
    return result.insertId;
  }

  async update(id: number, user: Partial<User>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (user.email !== undefined) { fields.push('email = ?'); values.push(user.email); }
    if (user.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(user.password_hash); }
    if (user.name !== undefined) { fields.push('name = ?'); values.push(user.name); }
    if (user.role_id !== undefined) { fields.push('role_id = ?'); values.push(user.role_id); }
    if (user.status !== undefined) { fields.push('status = ?'); values.push(user.status); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async findRoles(): Promise<Role[]> {
    const [rows]: any = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    return rows;
  }
}

export class AuthorRepository {
  async findById(id: number): Promise<Author | null> {
    const [rows]: any = await pool.query(
      `SELECT a.*, u.name as author_name, u.email as author_email, m.file_path as avatar_path 
       FROM authors a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media m ON a.avatar_id = m.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByUserId(userId: number): Promise<Author | null> {
    const [rows]: any = await pool.query(
      `SELECT a.*, u.name as author_name, u.email as author_email, m.file_path as avatar_path 
       FROM authors a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media m ON a.avatar_id = m.id
       WHERE a.user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  }

  async findAll(): Promise<Author[]> {
    const [rows]: any = await pool.query(
      `SELECT a.*, u.name as author_name, u.email as author_email, m.file_path as avatar_path 
       FROM authors a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media m ON a.avatar_id = m.id
       ORDER BY u.name ASC`
    );
    return rows;
  }

  async create(author: Author): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO authors (user_id, bio, avatar_id, social_twitter, social_facebook, social_linkedin) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        author.user_id,
        author.bio || null,
        author.avatar_id || null,
        author.social_twitter || null,
        author.social_facebook || null,
        author.social_linkedin || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, author: Partial<Author>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (author.bio !== undefined) { fields.push('bio = ?'); values.push(author.bio || null); }
    if (author.avatar_id !== undefined) { fields.push('avatar_id = ?'); values.push(author.avatar_id || null); }
    if (author.social_twitter !== undefined) { fields.push('social_twitter = ?'); values.push(author.social_twitter || null); }
    if (author.social_facebook !== undefined) { fields.push('social_facebook = ?'); values.push(author.social_facebook || null); }
    if (author.social_linkedin !== undefined) { fields.push('social_linkedin = ?'); values.push(author.social_linkedin || null); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE authors SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM authors WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class UserService {
  private userRepo = new UserRepository();
  private authorRepo = new AuthorRepository();

  async getUser(id: number) {
    return this.userRepo.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }

  async getAllUsers() {
    return this.userRepo.findAll();
  }

  async getRoles() {
    return this.userRepo.findRoles();
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'> & { plainPassword?: string }) {
    const existing = await this.userRepo.findByEmail(user.email);
    if (existing) {
      throw new Error(`User with email '${user.email}' already exists`);
    }

    let passwordHash = user.password_hash;
    if (user.plainPassword) {
      passwordHash = await bcrypt.hash(user.plainPassword, 10);
    }

    if (!passwordHash) {
      throw new Error('Password is required');
    }

    const userId = await this.userRepo.create({
      email: user.email,
      password_hash: passwordHash,
      name: user.name,
      role_id: user.role_id,
      status: user.status || 'active',
    });

    // Automatically create author profile for Admin, Editor, or Author roles
    const roles = await this.getRoles();
    const roleMap = roles.reduce((acc, r) => {
      acc[r.id] = r.name;
      return acc;
    }, {} as Record<number, string>);

    const roleName = roleMap[user.role_id];
    if (roleName === 'Super Admin' || roleName === 'Editor' || roleName === 'Author') {
      await this.authorRepo.create({
        user_id: userId,
        bio: `Author profile for ${user.name}`,
      });
    }

    return userId;
  }

  async updateUser(id: number, user: Partial<User> & { plainPassword?: string }) {
    if (user.email) {
      const existing = await this.userRepo.findByEmail(user.email);
      if (existing && existing.id !== id) {
        throw new Error(`Email '${user.email}' is already in use`);
      }
    }

    const updateData: Partial<User> = { ...user };
    if (user.plainPassword) {
      updateData.password_hash = await bcrypt.hash(user.plainPassword, 10);
    }
    delete updateData.password_hash; // Remove if not hashed

    if (user.plainPassword) {
      updateData.password_hash = await bcrypt.hash(user.plainPassword, 10);
    }

    return this.userRepo.update(id, updateData);
  }

  async deleteUser(id: number) {
    return this.userRepo.delete(id);
  }

  // --- Author Profile Operations ---
  async getAuthor(id: number) {
    return this.authorRepo.findById(id);
  }

  async getAuthorByUserId(userId: number) {
    return this.authorRepo.findByUserId(userId);
  }

  async getAllAuthors() {
    return this.authorRepo.findAll();
  }

  async updateAuthorByUserId(userId: number, author: Partial<Author>) {
    const existing = await this.authorRepo.findByUserId(userId);
    if (!existing) {
      // Create profile
      return this.authorRepo.create({
        user_id: userId,
        ...author
      } as Author);
    }
    return this.authorRepo.update(existing.id!, author);
  }
}

export const userService = new UserService();
