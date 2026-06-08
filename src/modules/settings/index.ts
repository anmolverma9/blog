import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface Setting {
  id?: number;
  setting_key: string;
  setting_value: string;
  created_at?: Date;
  updated_at?: Date;
}

export class SettingsRepository {
  async findByKey(key: string): Promise<string | null> {
    const [rows]: any = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    return rows[0]?.setting_value || null;
  }

  async findAll(): Promise<Record<string, string>> {
    const [rows]: any = await pool.query('SELECT setting_key, setting_value FROM settings');
    return rows.reduce((acc: Record<string, string>, row: any) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
  }

  async createOrUpdate(key: string, value: string): Promise<void> {
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );
  }
}

export class SettingsService {
  private repo = new SettingsRepository();

  async getSetting(key: string): Promise<string | null> {
    return this.repo.findByKey(key);
  }

  async getSettings(): Promise<Record<string, string>> {
    return this.repo.findAll();
  }

  async saveSetting(key: string, value: string): Promise<void> {
    await this.repo.createOrUpdate(key, value);
  }

  async saveSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.repo.createOrUpdate(key, value);
    }
  }

  // Analytics Helpers
  async getHeaderScripts(): Promise<string> {
    return (await this.getSetting('header_scripts')) || '';
  }

  async getFooterScripts(): Promise<string> {
    return (await this.getSetting('footer_scripts')) || '';
  }

  async getGoogleAnalyticsId(): Promise<string> {
    return (await this.getSetting('google_analytics_id')) || '';
  }

  // Theme Helpers
  async getBrandColor(): Promise<string> {
    return (await this.getSetting('brand_color')) || '';
  }
}

export const settingsService = new SettingsService();
