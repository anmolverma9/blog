import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';

export interface Media {
  id?: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  title_text?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class MediaRepository {
  async findById(id: number): Promise<Media | null> {
    const [rows]: any = await pool.query('SELECT * FROM media WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findAll(): Promise<Media[]> {
    const [rows]: any = await pool.query('SELECT * FROM media ORDER BY id DESC');
    return rows;
  }

  async create(media: Media): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO media (filename, file_path, file_size, mime_type, alt_text, title_text) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        media.filename,
        media.file_path,
        media.file_size,
        media.mime_type,
        media.alt_text || null,
        media.title_text || null,
      ]
    );
    return result.insertId;
  }

  async updateMetadata(id: number, altText: string, titleText: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE media SET alt_text = ?, title_text = ? WHERE id = ?',
      [altText || null, titleText || null, id]
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM media WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class MediaService {
  private repo = new MediaRepository();

  async getMedia(id: number) {
    return this.repo.findById(id);
  }

  async getAllMedia() {
    return this.repo.findAll();
  }

  async addMedia(media: Media) {
    return this.repo.create(media);
  }

  async updateMetadata(id: number, altText: string, titleText: string) {
    return this.repo.updateMetadata(id, altText, titleText);
  }

  async deleteMedia(id: number) {
    const media = await this.repo.findById(id);
    if (!media) {
      throw new Error('Media item not found');
    }

    // Try deleting physical file from disk
    try {
      const absolutePath = path.join(process.cwd(), 'public', media.file_path);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err: any) {
      console.error('Failed to delete physical media file:', err.message);
    }

    return this.repo.delete(id);
  }
}

export const mediaService = new MediaService();
