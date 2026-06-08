import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface MenuItem {
  id?: number;
  menu_id?: number;
  label: string;
  url: string;
  parent_id?: number | null;
  order_no: number;
}

export interface Menu {
  id?: number;
  name: string;
  slug: string;
  items?: MenuItem[];
}

export class MenuRepository {
  async findBySlug(slug: string): Promise<Menu | null> {
    const [menus]: any = await pool.query('SELECT * FROM menus WHERE slug = ?', [slug]);
    const menu = menus[0];
    if (!menu) return null;

    const [items]: any = await pool.query(
      'SELECT id, label, url, parent_id, order_no FROM menu_items WHERE menu_id = ? ORDER BY order_no ASC',
      [menu.id]
    );
    menu.items = items;
    return menu;
  }

  async saveMenuWithItems(slug: string, name: string, items: Omit<MenuItem, 'menu_id'>[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Get or Create Menu
      await conn.query(
        'INSERT INTO menus (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?',
        [name, slug, name]
      );

      const [menus]: any = await conn.query('SELECT id FROM menus WHERE slug = ?', [slug]);
      const menuId = menus[0].id;

      // 2. Delete existing items
      await conn.query('DELETE FROM menu_items WHERE menu_id = ?', [menuId]);

      // 3. Insert new items
      if (items.length > 0) {
        const insertQuery = 'INSERT INTO menu_items (menu_id, label, url, parent_id, order_no) VALUES ?';
        const values = items.map((item) => [
          menuId,
          item.label,
          item.url,
          item.parent_id || null,
          item.order_no,
        ]);
        await conn.query(insertQuery, [values]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

export class MenuService {
  private repo = new MenuRepository();

  async getMenuBySlug(slug: string): Promise<Menu | null> {
    return this.repo.findBySlug(slug);
  }

  async saveMenu(slug: string, name: string, items: Omit<MenuItem, 'menu_id'>[]): Promise<void> {
    if (!slug) throw new Error('Menu slug is required');
    if (!name) throw new Error('Menu name is required');
    await this.repo.saveMenuWithItems(slug, name, items);
  }
}

export const menuService = new MenuService();
