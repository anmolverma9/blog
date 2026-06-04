import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Category {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  language_code: string;
  translation_group_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class CategoryRepository {
  async findById(id: number): Promise<Category | null> {
    const [rows]: any = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findBySlug(slug: string, lang: string = 'en'): Promise<Category | null> {
    const [rows]: any = await pool.query(
      'SELECT * FROM categories WHERE slug = ? AND language_code = ?',
      [slug, lang]
    );
    return rows[0] || null;
  }

  async findAll(lang?: string): Promise<Category[]> {
    let query = 'SELECT * FROM categories';
    const params: any[] = [];
    if (lang) {
      query += ' WHERE language_code = ?';
      params.push(lang);
    }
    query += ' ORDER BY name ASC';
    const [rows]: any = await pool.query(query, params);
    return rows;
  }

  async create(cat: Category): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO categories (name, slug, description, parent_id, language_code, translation_group_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cat.name,
        cat.slug,
        cat.description || null,
        cat.parent_id || null,
        cat.language_code || 'en',
        cat.translation_group_id || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, cat: Partial<Category>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (cat.name !== undefined) { fields.push('name = ?'); values.push(cat.name); }
    if (cat.slug !== undefined) { fields.push('slug = ?'); values.push(cat.slug); }
    if (cat.description !== undefined) { fields.push('description = ?'); values.push(cat.description || null); }
    if (cat.parent_id !== undefined) { fields.push('parent_id = ?'); values.push(cat.parent_id || null); }
    if (cat.language_code !== undefined) { fields.push('language_code = ?'); values.push(cat.language_code); }
    if (cat.translation_group_id !== undefined) { fields.push('translation_group_id = ?'); values.push(cat.translation_group_id || null); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class CategoryService {
  private repo = new CategoryRepository();

  async getCategory(id: number) {
    return this.repo.findById(id);
  }

  async getCategoryBySlug(slug: string, lang: string = 'en') {
    return this.repo.findBySlug(slug, lang);
  }

  async getAllCategories(lang?: string) {
    return this.repo.findAll(lang);
  }

  async createCategory(cat: Category) {
    // Check if slug already exists for the given language
    const existing = await this.repo.findBySlug(cat.slug, cat.language_code);
    if (existing) {
      throw new Error(`Category slug '${cat.slug}' already exists for language '${cat.language_code}'`);
    }
    return this.repo.create(cat);
  }

  async updateCategory(id: number, cat: Partial<Category>) {
    if (cat.slug) {
      const current = await this.repo.findById(id);
      if (!current) throw new Error('Category not found');
      
      const lang = cat.language_code || current.language_code;
      const existing = await this.repo.findBySlug(cat.slug, lang);
      if (existing && existing.id !== id) {
        throw new Error(`Category slug '${cat.slug}' already exists for language '${lang}'`);
      }
    }
    return this.repo.update(id, cat);
  }

  async deleteCategory(id: number) {
    return this.repo.delete(id);
  }
}

export const categoryService = new CategoryService();
