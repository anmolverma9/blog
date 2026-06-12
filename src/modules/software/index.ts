import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface SoftwareCategory {
  id?: number;
  name: string;
  slug: string;
  description?: string;
}

export interface SoftwareListing {
  id?: number;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  pricing_model: string; // free, freemium, paid
  overall_rating: number;
  category_id?: number | null;
  category_name?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface SoftwareReview {
  id?: number;
  software_id: number;
  user_name: string;
  rating: number;
  review_text?: string;
  pros?: string[]; // JSON stored
  cons?: string[]; // JSON stored
  created_at?: Date;
}

export class SoftwareService {
  // --- Category Management ---
  async getCategories(): Promise<SoftwareCategory[]> {
    const [rows]: any = await pool.query('SELECT * FROM software_categories ORDER BY name ASC');
    return rows;
  }

  async createCategory(name: string, slug: string, description?: string): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO software_categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );
    return result.insertId;
  }

  // --- Software Listings ---
  async getListings(options: { categoryId?: number; pricingModel?: string; search?: string; limit?: number } = {}): Promise<SoftwareListing[]> {
    const filters: string[] = [];
    const params: any[] = [];

    if (options.categoryId !== undefined) {
      filters.push('s.category_id = ?');
      params.push(options.categoryId);
    }
    if (options.pricingModel) {
      filters.push('s.pricing_model = ?');
      params.push(options.pricingModel);
    }
    if (options.search) {
      filters.push('(s.name LIKE ? OR s.tagline LIKE ? OR s.description LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';

    const query = `
      SELECT s.*, sc.name as category_name
      FROM software s
      LEFT JOIN software_categories sc ON s.category_id = sc.id
      ${whereClause}
      ORDER BY s.overall_rating DESC, s.id DESC
      ${limitClause}
    `;

    const [rows]: any = await pool.query(query, params);
    return rows;
  }

  async getListingBySlug(slug: string): Promise<SoftwareListing | null> {
    const [rows]: any = await pool.query(
      `SELECT s.*, sc.name as category_name
       FROM software s
       LEFT JOIN software_categories sc ON s.category_id = sc.id
       WHERE s.slug = ?`,
      [slug]
    );
    return rows[0] || null;
  }

  async getListingById(id: number): Promise<SoftwareListing | null> {
    const [rows]: any = await pool.query('SELECT * FROM software WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async createListing(soft: Omit<SoftwareListing, 'id' | 'overall_rating'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO software (name, slug, tagline, description, logo_url, website_url, pricing_model, category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [soft.name, soft.slug, soft.tagline || null, soft.description, soft.logo_url || null, soft.website_url || null, soft.pricing_model || 'free', soft.category_id || null]
    );
    return result.insertId;
  }

  async updateListing(id: number, soft: Partial<SoftwareListing>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (soft.name !== undefined) { fields.push('name = ?'); values.push(soft.name); }
    if (soft.slug !== undefined) { fields.push('slug = ?'); values.push(soft.slug); }
    if (soft.tagline !== undefined) { fields.push('tagline = ?'); values.push(soft.tagline); }
    if (soft.description !== undefined) { fields.push('description = ?'); values.push(soft.description); }
    if (soft.logo_url !== undefined) { fields.push('logo_url = ?'); values.push(soft.logo_url); }
    if (soft.website_url !== undefined) { fields.push('website_url = ?'); values.push(soft.website_url); }
    if (soft.pricing_model !== undefined) { fields.push('pricing_model = ?'); values.push(soft.pricing_model); }
    if (soft.category_id !== undefined) { fields.push('category_id = ?'); values.push(soft.category_id); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE software SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async deleteListing(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM software WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // --- Reviews Methods ---
  async getReviews(softwareId: number): Promise<SoftwareReview[]> {
    const [rows]: any = await pool.query(
      'SELECT * FROM software_reviews WHERE software_id = ? ORDER BY id DESC',
      [softwareId]
    );
    
    return rows.map((row: any) => {
      let prosArray = [];
      let consArray = [];
      try {
        prosArray = typeof row.pros === 'string' ? JSON.parse(row.pros) : (Array.isArray(row.pros) ? row.pros : []);
        consArray = typeof row.cons === 'string' ? JSON.parse(row.cons) : (Array.isArray(row.cons) ? row.cons : []);
      } catch (e) {
        console.error('Failed to parse pros/cons json', e);
      }
      return {
        ...row,
        pros: prosArray,
        cons: consArray,
      };
    });
  }

  async addReview(review: Omit<SoftwareReview, 'id' | 'created_at'>): Promise<number> {
    const prosJson = JSON.stringify(review.pros || []);
    const consJson = JSON.stringify(review.cons || []);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO software_reviews (software_id, user_name, rating, review_text, pros, cons) VALUES (?, ?, ?, ?, ?, ?)',
      [review.software_id, review.user_name, review.rating, review.review_text || null, prosJson, consJson]
    );

    // Recalculate and update the overall average rating for this software listing
    await this.recalculateRating(review.software_id);

    return result.insertId;
  }

  async deleteReview(reviewId: number, softwareId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM software_reviews WHERE id = ?', [reviewId]);
    await this.recalculateRating(softwareId);
    return result.affectedRows > 0;
  }

  private async recalculateRating(softwareId: number): Promise<void> {
    const [rows]: any = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM software_reviews WHERE software_id = ?',
      [softwareId]
    );
    const avg = rows[0]?.avg_rating ? parseFloat(rows[0].avg_rating).toFixed(2) : 0.00;
    await pool.query('UPDATE software SET overall_rating = ? WHERE id = ?', [avg, softwareId]);
  }
}

export const softwareService = new SoftwareService();
