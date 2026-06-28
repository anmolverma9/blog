import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface Redirect {
  id?: number;
  old_url: string;
  new_url: string;
  status_code: number; // 301 or 302
  created_at?: Date;
  updated_at?: Date;
}

export class RedirectRepository {
  async findById(id: number): Promise<Redirect | null> {
    const [rows]: any = await pool.query('SELECT * FROM redirects WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByOldUrl(oldUrl: string): Promise<Redirect | null> {
    if (!oldUrl) return null;
    const urlsToTry = new Set<string>();
    
    // Add raw input
    urlsToTry.add(oldUrl);
    urlsToTry.add(oldUrl.trim());
    
    // Normalize path by stripping trailing/leading whitespace and slashes
    const trimmed = oldUrl.trim();
    const cleanPath = trimmed.replace(/\/$/, ""); // strip trailing slash
    
    urlsToTry.add(cleanPath);
    urlsToTry.add(cleanPath + "/");
    
    // If it starts with /blog, try matching without the /blog prefix as well
    if (cleanPath.startsWith('/blog')) {
      const strippedPath = cleanPath.substring(5); // remove '/blog'
      if (strippedPath.startsWith('/')) {
        urlsToTry.add(strippedPath);
        urlsToTry.add(strippedPath + "/");
        urlsToTry.add(strippedPath.replace(/\/$/, ""));
      } else {
        const withSlash = '/' + strippedPath;
        urlsToTry.add(withSlash);
        urlsToTry.add(withSlash + "/");
        urlsToTry.add(withSlash.replace(/\/$/, ""));
      }
    } else {
      // If it doesn't start with /blog, try adding /blog prefix as well
      const withBlog = '/blog' + (cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath);
      urlsToTry.add(withBlog);
      urlsToTry.add(withBlog + "/");
      urlsToTry.add(withBlog.replace(/\/$/, ""));
    }

    // Add absolute URL variations
    const domainVariations = [
      'https://appluxe.com',
      'https://www.appluxe.com',
      'http://appluxe.com',
      'http://www.appluxe.com'
    ];

    // For each unique path format we've gathered, generate absolute URL variations
    const currentPaths = Array.from(urlsToTry);
    for (const path of currentPaths) {
      if (path.startsWith('/')) {
        for (const domain of domainVariations) {
          urlsToTry.add(domain + path);
          urlsToTry.add(domain + path + '/');
          urlsToTry.add((domain + path).replace(/\/$/, ""));
        }
      }
    }

    const uniqueUrls = Array.from(urlsToTry);
    const placeholders = uniqueUrls.map(() => '?').join(', ');
    const query = `SELECT * FROM redirects WHERE old_url IN (${placeholders}) LIMIT 1`;
    
    const [rows]: any = await pool.query(query, uniqueUrls);
    return rows[0] || null;
  }

  async findAll(): Promise<Redirect[]> {
    const [rows]: any = await pool.query('SELECT * FROM redirects ORDER BY id DESC');
    return rows;
  }

  async create(red: Redirect): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO redirects (old_url, new_url, status_code) VALUES (?, ?, ?)',
      [red.old_url.trim(), red.new_url.trim(), red.status_code || 301]
    );
    return result.insertId;
  }

  async update(id: number, red: Partial<Redirect>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (red.old_url !== undefined) { fields.push('old_url = ?'); values.push(red.old_url.trim()); }
    if (red.new_url !== undefined) { fields.push('new_url = ?'); values.push(red.new_url.trim()); }
    if (red.status_code !== undefined) { fields.push('status_code = ?'); values.push(red.status_code); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE redirects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM redirects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class RedirectService {
  private repo = new RedirectRepository();

  async getRedirect(id: number) {
    return this.repo.findById(id);
  }

  async checkRedirect(oldUrl: string) {
    return this.repo.findByOldUrl(oldUrl);
  }

  async getAllRedirects() {
    return this.repo.findAll();
  }

  async createRedirect(red: Redirect) {
    const existing = await this.repo.findByOldUrl(red.old_url);
    if (existing) {
      throw new Error(`Redirect for URL '${red.old_url}' already exists`);
    }
    return this.repo.create(red);
  }

  async updateRedirect(id: number, red: Partial<Redirect>) {
    if (red.old_url) {
      const existing = await this.repo.findByOldUrl(red.old_url);
      if (existing && existing.id !== id) {
        throw new Error(`Redirect for URL '${red.old_url}' already exists`);
      }
    }
    return this.repo.update(id, red);
  }

  async deleteRedirect(id: number) {
    return this.repo.delete(id);
  }
}

export const redirectService = new RedirectService();
