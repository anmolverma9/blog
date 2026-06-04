import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface Tag {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  language_code: string;
  translation_group_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class TagRepository {
  async findById(id: number): Promise<Tag | null> {
    const [rows]: any = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findBySlug(slug: string, lang: string = 'en'): Promise<Tag | null> {
    const [rows]: any = await pool.query(
      'SELECT * FROM tags WHERE slug = ? AND language_code = ?',
      [slug, lang]
    );
    return rows[0] || null;
  }

  async findAll(lang?: string): Promise<Tag[]> {
    let query = 'SELECT * FROM tags';
    const params: any[] = [];
    if (lang) {
      query += ' WHERE language_code = ?';
      params.push(lang);
    }
    query += ' ORDER BY name ASC';
    const [rows]: any = await pool.query(query, params);
    return rows;
  }

  async create(tag: Tag): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tags (name, slug, description, language_code, translation_group_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        tag.name,
        tag.slug,
        tag.description || null,
        tag.language_code || 'en',
        tag.translation_group_id || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, tag: Partial<Tag>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (tag.name !== undefined) { fields.push('name = ?'); values.push(tag.name); }
    if (tag.slug !== undefined) { fields.push('slug = ?'); values.push(tag.slug); }
    if (tag.description !== undefined) { fields.push('description = ?'); values.push(tag.description || null); }
    if (tag.language_code !== undefined) { fields.push('language_code = ?'); values.push(tag.language_code); }
    if (tag.translation_group_id !== undefined) { fields.push('translation_group_id = ?'); values.push(tag.translation_group_id || null); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM tags WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class TagService {
  private repo = new TagRepository();

  async getTag(id: number) {
    return this.repo.findById(id);
  }

  async getTagBySlug(slug: string, lang: string = 'en') {
    return this.repo.findBySlug(slug, lang);
  }

  async getAllTags(lang?: string) {
    return this.repo.findAll(lang);
  }

  async createTag(tag: Tag) {
    const existing = await this.repo.findBySlug(tag.slug, tag.language_code);
    if (existing) {
      throw new Error(`Tag slug '${tag.slug}' already exists for language '${tag.language_code}'`);
    }
    return this.repo.create(tag);
  }

  async updateTag(id: number, tag: Partial<Tag>) {
    if (tag.slug) {
      const current = await this.repo.findById(id);
      if (!current) throw new Error('Tag not found');
      
      const lang = tag.language_code || current.language_code;
      const existing = await this.repo.findBySlug(tag.slug, lang);
      if (existing && existing.id !== id) {
        throw new Error(`Tag slug '${tag.slug}' already exists for language '${lang}'`);
      }
    }
    return this.repo.update(id, tag);
  }

  async deleteTag(id: number) {
    return this.repo.delete(id);
  }
}

export const tagService = new TagService();
