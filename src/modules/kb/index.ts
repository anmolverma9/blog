import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface KBCategory {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface KBArticle {
  id?: number;
  title: string;
  slug: string;
  content: string;
  category_id: number;
  category_name?: string;
  status: string; // draft, published
  created_at?: Date;
  updated_at?: Date;
}

export interface KBTicket {
  id?: number;
  subject: string;
  description: string;
  status: string; // open, closed
  user_email: string;
  article_id?: number | null;
  article_title?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class KBService {
  // --- Category Methods ---
  async getCategories(): Promise<KBCategory[]> {
    const [rows]: any = await pool.query('SELECT * FROM kb_categories ORDER BY name ASC');
    return rows;
  }

  async getCategoryBySlug(slug: string): Promise<KBCategory | null> {
    const [rows]: any = await pool.query('SELECT * FROM kb_categories WHERE slug = ?', [slug]);
    return rows[0] || null;
  }

  async createCategory(cat: Omit<KBCategory, 'id'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO kb_categories (name, slug, description) VALUES (?, ?, ?)',
      [cat.name, cat.slug, cat.description || null]
    );
    return result.insertId;
  }

  // --- Article Methods ---
  async getArticles(options: { categoryId?: number; status?: string; limit?: number; search?: string } = {}): Promise<KBArticle[]> {
    const filters: string[] = [];
    const params: any[] = [];

    if (options.categoryId !== undefined) {
      filters.push('a.category_id = ?');
      params.push(options.categoryId);
    }
    if (options.status) {
      filters.push('a.status = ?');
      params.push(options.status);
    }
    if (options.search) {
      filters.push('(a.title LIKE ? OR a.content LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';

    const query = `
      SELECT a.*, c.name as category_name
      FROM kb_articles a
      JOIN kb_categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.id DESC
      ${limitClause}
    `;

    const [rows]: any = await pool.query(query, params);
    return rows;
  }

  async getArticleBySlug(slug: string): Promise<KBArticle | null> {
    const [rows]: any = await pool.query(
      `SELECT a.*, c.name as category_name 
       FROM kb_articles a 
       JOIN kb_categories c ON a.category_id = c.id 
       WHERE a.slug = ?`,
      [slug]
    );
    return rows[0] || null;
  }

  async getArticleById(id: number): Promise<KBArticle | null> {
    const [rows]: any = await pool.query('SELECT * FROM kb_articles WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async createArticle(art: Omit<KBArticle, 'id'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO kb_articles (title, slug, content, category_id, status) VALUES (?, ?, ?, ?, ?)',
      [art.title, art.slug, art.content, art.category_id, art.status || 'draft']
    );
    return result.insertId;
  }

  async updateArticle(id: number, art: Partial<KBArticle>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (art.title !== undefined) { fields.push('title = ?'); values.push(art.title); }
    if (art.slug !== undefined) { fields.push('slug = ?'); values.push(art.slug); }
    if (art.content !== undefined) { fields.push('content = ?'); values.push(art.content); }
    if (art.category_id !== undefined) { fields.push('category_id = ?'); values.push(art.category_id); }
    if (art.status !== undefined) { fields.push('status = ?'); values.push(art.status); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE kb_articles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM kb_articles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // --- Support Recommendations Engine ---
  async getRelatedSupportSuggestions(subject: string): Promise<KBArticle[]> {
    if (!subject || subject.trim().length === 0) return [];
    
    // Split subject by spaces and look for articles matching keywords
    const keywords = subject.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    if (keywords.length === 0) return [];

    const filters = keywords.map(() => 'title LIKE ?').join(' OR ');
    const params = keywords.map(kw => `%${kw}%`);

    const query = `
      SELECT id, title, slug 
      FROM kb_articles 
      WHERE status = 'published' AND (${filters})
      LIMIT 3
    `;

    const [rows]: any = await pool.query(query, params);
    return rows;
  }

  // --- Ticket Management Methods ---
  async createTicket(ticket: Omit<KBTicket, 'id' | 'status'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO kb_tickets (subject, description, user_email, article_id, status) VALUES (?, ?, ?, ?, ?)',
      [ticket.subject, ticket.description, ticket.user_email, ticket.article_id || null, 'open']
    );
    return result.insertId;
  }

  async getTickets(): Promise<KBTicket[]> {
    const [rows]: any = await pool.query(`
      SELECT t.*, a.title as article_title 
      FROM kb_tickets t
      LEFT JOIN kb_articles a ON t.article_id = a.id
      ORDER BY t.id DESC
    `);
    return rows;
  }

  async updateTicketStatus(id: number, status: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE kb_tickets SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }
}

export const kbService = new KBService();
