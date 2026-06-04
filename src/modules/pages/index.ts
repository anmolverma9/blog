import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface Page {
  id?: number;
  title: string;
  slug: string;
  content: string;
  template_id: number;
  template_name?: string;
  template_file_name?: string;
  status: string; // draft, published
  language_code: string;
  translation_group_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical_url?: string;
    robots_settings?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    twitter_card?: string;
    schema_markup?: any;
  };
}

export class PageRepository {
  async findById(id: number): Promise<Page | null> {
    const [pages]: any = await pool.query(
      `SELECT p.*, t.name as template_name, t.file_name as template_file_name
       FROM pages p
       JOIN page_templates t ON p.template_id = t.id
       WHERE p.id = ?`,
      [id]
    );

    const page = pages[0];
    if (!page) return null;

    page.seo = await this.getPageSEO(id);
    return page;
  }

  async findBySlug(slug: string, lang: string = 'en'): Promise<Page | null> {
    const [pages]: any = await pool.query(
      `SELECT p.*, t.name as template_name, t.file_name as template_file_name
       FROM pages p
       JOIN page_templates t ON p.template_id = t.id
       WHERE p.slug = ? AND p.language_code = ?`,
      [slug, lang]
    );

    const page = pages[0];
    if (!page) return null;

    page.seo = await this.getPageSEO(page.id);
    return page;
  }

  async findAll(lang?: string): Promise<Page[]> {
    let query = `
      SELECT p.*, t.name as template_name, t.file_name as template_file_name
      FROM pages p
      JOIN page_templates t ON p.template_id = t.id
    `;
    const params: any[] = [];
    if (lang) {
      query += ' WHERE p.language_code = ?';
      params.push(lang);
    }
    query += ' ORDER BY p.id DESC';

    const [rows]: any = await pool.query(query, params);
    return rows;
  }

  async create(page: Page): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO pages (title, slug, content, template_id, status, language_code, translation_group_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        page.title,
        page.slug,
        page.content,
        page.template_id,
        page.status || 'draft',
        page.language_code || 'en',
        page.translation_group_id || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, page: Partial<Page>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (page.title !== undefined) { fields.push('title = ?'); values.push(page.title); }
    if (page.slug !== undefined) { fields.push('slug = ?'); values.push(page.slug); }
    if (page.content !== undefined) { fields.push('content = ?'); values.push(page.content); }
    if (page.template_id !== undefined) { fields.push('template_id = ?'); values.push(page.template_id); }
    if (page.status !== undefined) { fields.push('status = ?'); values.push(page.status); }
    if (page.language_code !== undefined) { fields.push('language_code = ?'); values.push(page.language_code); }
    if (page.translation_group_id !== undefined) { fields.push('translation_group_id = ?'); values.push(page.translation_group_id || null); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE pages SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM pages WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async findTemplates(): Promise<Array<{ id: number; name: string; file_name: string; description: string }>> {
    const [rows]: any = await pool.query('SELECT * FROM page_templates ORDER BY id ASC');
    return rows;
  }

  // Page SEO helpers
  async setPageSEO(pageId: number, seo: any): Promise<void> {
    const schemaMarkupString = seo.schema_markup ? JSON.stringify(seo.schema_markup) : null;
    await pool.query(
      `INSERT INTO seo_data (entity_type, entity_id, meta_title, meta_description, meta_keywords, canonical_url, robots_settings, og_title, og_description, og_image, twitter_card, schema_markup) 
       VALUES ('page', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         meta_title = VALUES(meta_title), 
         meta_description = VALUES(meta_description), 
         meta_keywords = VALUES(meta_keywords), 
         canonical_url = VALUES(canonical_url), 
         robots_settings = VALUES(robots_settings), 
         og_title = VALUES(og_title), 
         og_description = VALUES(og_description), 
         og_image = VALUES(og_image), 
         twitter_card = VALUES(twitter_card), 
         schema_markup = VALUES(schema_markup)`,
      [
        pageId,
        seo.meta_title || null,
        seo.meta_description || null,
        seo.meta_keywords || null,
        seo.canonical_url || null,
        seo.robots_settings || 'index, follow',
        seo.og_title || null,
        seo.og_description || null,
        seo.og_image || null,
        seo.twitter_card || 'summary_large_image',
        schemaMarkupString,
      ]
    );
  }

  async getPageSEO(pageId: number): Promise<any> {
    const [rows]: any = await pool.query(
      "SELECT * FROM seo_data WHERE entity_type = 'page' AND entity_id = ?",
      [pageId]
    );
    const seo = rows[0] || null;
    if (seo && seo.schema_markup) {
      try {
        seo.schema_markup = typeof seo.schema_markup === 'string' ? JSON.parse(seo.schema_markup) : seo.schema_markup;
      } catch (e) {
        seo.schema_markup = null;
      }
    }
    return seo;
  }
}

export class PageService {
  private repo = new PageRepository();

  async getPage(id: number) {
    return this.repo.findById(id);
  }

  async getPageBySlug(slug: string, lang: string = 'en') {
    return this.repo.findBySlug(slug, lang);
  }

  async getAllPages(lang?: string) {
    return this.repo.findAll(lang);
  }

  async getTemplates() {
    return this.repo.findTemplates();
  }

  async createPage(page: Page) {
    const existing = await this.repo.findBySlug(page.slug, page.language_code);
    if (existing) {
      throw new Error(`Page slug '${page.slug}' already exists for language '${page.language_code}'`);
    }

    const id = await this.repo.create(page);

    // Save default SEO
    const seoData = page.seo || {};
    const finalSeo = {
      meta_title: seoData.meta_title || page.title,
      meta_description: seoData.meta_description || page.title,
      meta_keywords: seoData.meta_keywords || '',
      canonical_url: seoData.canonical_url || `/${page.slug}`,
      robots_settings: seoData.robots_settings || 'index, follow',
      og_title: seoData.og_title || page.title,
      og_description: seoData.og_description || page.title,
      og_image: seoData.og_image || null,
      twitter_card: seoData.twitter_card || 'summary_large_image',
      schema_markup: seoData.schema_markup || null
    };

    await this.repo.setPageSEO(id, finalSeo);
    return id;
  }

  async updatePage(id: number, page: Partial<Page>) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error('Page not found');

    if (page.slug) {
      const lang = page.language_code || current.language_code;
      const existing = await this.repo.findBySlug(page.slug, lang);
      if (existing && existing.id !== id) {
        throw new Error(`Page slug '${page.slug}' already exists for language '${lang}'`);
      }
    }

    await this.repo.update(id, page);

    if (page.seo) {
      await this.repo.setPageSEO(id, page.seo);
    }

    return true;
  }

  async deletePage(id: number) {
    return this.repo.delete(id);
  }
}

export const pageService = new PageService();
