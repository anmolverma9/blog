import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface Subscriber {
  id?: number;
  email: string;
  status: string; // active, unsubscribed
  source_page?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class NewsletterRepository {
  async findByEmail(email: string): Promise<Subscriber | null> {
    const [rows]: any = await pool.query('SELECT * FROM newsletter_subscribers WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findAll(): Promise<Subscriber[]> {
    const [rows]: any = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY id DESC');
    return rows;
  }

  async create(sub: Subscriber): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO newsletter_subscribers (email, status, source_page) VALUES (?, ?, ?)',
      [sub.email.trim().toLowerCase(), sub.status || 'active', sub.source_page || null]
    );
    return result.insertId;
  }

  async updateStatus(email: string, status: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE newsletter_subscribers SET status = ? WHERE email = ?',
      [status, email.trim().toLowerCase()]
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class NewsletterService {
  private repo = new NewsletterRepository();

  async getSubscribers() {
    return this.repo.findAll();
  }

  async subscribe(email: string, sourcePage?: string) {
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Resubscribe
        return this.repo.updateStatus(email, 'active');
      }
      throw new Error('This email is already subscribed.');
    }

    const id = await this.repo.create({
      email,
      status: 'active',
      source_page: sourcePage,
    });

    // FUTURE: Integrate Brevo API here.
    // try {
    //   await sendToBrevo(email);
    // } catch (err) {
    //   console.error("Brevo sync error:", err);
    // }

    return id;
  }

  async unsubscribe(email: string) {
    return this.repo.updateStatus(email, 'unsubscribed');
  }

  async removeSubscriber(id: number) {
    return this.repo.delete(id);
  }
}

export const newsletterService = new NewsletterService();
