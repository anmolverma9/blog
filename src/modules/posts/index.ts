import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { generateAutoSEOSuggestions } from '@/lib/seo';

export interface Post {
  id?: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  status: string; // draft, scheduled, published
  published_at?: string | null;
  author_id: number;
  category_id?: number | null;
  featured_image_id?: number | null;
  read_time?: number;
  views?: number;
  language_code: string;
  translation_group_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
  // Join fields
  author_name?: string;
  author_avatar_path?: string | null;
  author_twitter?: string | null;
  author_facebook?: string | null;
  author_linkedin?: string | null;
  category_name?: string;
  category_slug?: string;
  featured_image_path?: string | null;
  tags?: Array<{ id: number; name: string; slug: string }>;
  meta?: Record<string, string>;
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

export interface FetchPostOptions {
  status?: string;
  authorId?: number;
  categoryId?: number;
  tagId?: number;
  tagSlug?: string;
  categorySlug?: string;
  search?: string;
  lang?: string;
  limit?: number;
  offset?: number;
  orderBy?: string; // views, published_at, created_at, random
}

export class PostRepository {
  async findById(id: number): Promise<Post | null> {
    const [posts]: any = await pool.query(
      `SELECT p.*, u.name as author_name, m.file_path as featured_image_path, c.name as category_name, c.slug as category_slug,
              a.social_twitter as author_twitter, a.social_facebook as author_facebook, a.social_linkedin as author_linkedin, am.file_path as author_avatar_path
       FROM posts p
       JOIN authors a ON p.author_id = a.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media am ON a.avatar_id = am.id
       LEFT JOIN media m ON p.featured_image_id = m.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    const post = posts[0];
    if (!post) return null;

    post.tags = await this.getPostTags(id);
    post.meta = await this.getPostMeta(id);
    post.seo = await this.getPostSEO(id);
    return post;
  }

  async findBySlug(slug: string, lang: string = 'en'): Promise<Post | null> {
    const [posts]: any = await pool.query(
      `SELECT p.*, u.name as author_name, m.file_path as featured_image_path, c.name as category_name, c.slug as category_slug, am.file_path as author_avatar_path,
              a.social_twitter as author_twitter, a.social_facebook as author_facebook, a.social_linkedin as author_linkedin
       FROM posts p
       JOIN authors a ON p.author_id = a.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media am ON a.avatar_id = am.id
       LEFT JOIN media m ON p.featured_image_id = m.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.language_code = ?`,
      [slug, lang]
    );

    const post = posts[0];
    if (!post) return null;

    post.tags = await this.getPostTags(post.id);
    post.meta = await this.getPostMeta(post.id);
    post.seo = await this.getPostSEO(post.id);
    return post;
  }

  async findAll(options: FetchPostOptions): Promise<{ posts: Post[]; total: number }> {
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const params: any[] = [];
    const countParams: any[] = [];

    let whereClauses = ['1 = 1'];

    if (options.status) {
      whereClauses.push('p.status = ?');
      params.push(options.status);
      countParams.push(options.status);

      if (options.status === 'published') {
        whereClauses.push('(p.published_at IS NULL OR p.published_at <= NOW())');
      }
    }

    if (options.authorId) {
      whereClauses.push('p.author_id = ?');
      params.push(options.authorId);
      countParams.push(options.authorId);
    }

    if (options.categoryId) {
      whereClauses.push('p.category_id = ?');
      params.push(options.categoryId);
      countParams.push(options.categoryId);
    }

    if (options.categorySlug) {
      whereClauses.push('c.slug = ?');
      params.push(options.categorySlug);
      countParams.push(options.categorySlug);
    }

    if (options.lang) {
      whereClauses.push('p.language_code = ?');
      params.push(options.lang);
      countParams.push(options.lang);
    }

    if (options.tagId) {
      whereClauses.push('p.id IN (SELECT post_id FROM post_tags WHERE tag_id = ?)');
      params.push(options.tagId);
      countParams.push(options.tagId);
    }

    if (options.tagSlug) {
      whereClauses.push('p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.slug = ?)');
      params.push(options.tagSlug);
      countParams.push(options.tagSlug);
    }

    if (options.search) {
      whereClauses.push('(p.title LIKE ? OR p.content LIKE ? OR p.summary LIKE ?)');
      const searchWildcard = `%${options.search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
      countParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    const whereSql = whereClauses.join(' AND ');

    // Order By
    let orderBySql = 'ORDER BY p.id DESC';
    if (options.orderBy === 'views') {
      orderBySql = 'ORDER BY p.views DESC, p.id DESC';
    } else if (options.orderBy === 'published_at') {
      orderBySql = 'ORDER BY p.published_at DESC, p.id DESC';
    } else if (options.orderBy === 'created_at') {
      orderBySql = 'ORDER BY p.created_at DESC, p.id DESC';
    } else if (options.orderBy === 'random') {
      orderBySql = 'ORDER BY RAND()';
    }

    // Get Total Count
    const [countRows]: any = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as total 
       FROM posts p 
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${whereSql}`,
      countParams
    );
    const total = countRows[0]?.total || 0;

    // Get Posts
    const [posts]: any = await pool.query(
      `SELECT p.*, u.name as author_name, m.file_path as featured_image_path, c.name as category_name, c.slug as category_slug
       FROM posts p
       JOIN authors a ON p.author_id = a.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media m ON p.featured_image_id = m.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${whereSql}
       ${orderBySql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Populate tags for each post
    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
    }

    return { posts, total };
  }

  async create(post: Post): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO posts (title, slug, content, summary, status, published_at, author_id, category_id, featured_image_id, read_time, language_code, translation_group_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.title,
        post.slug,
        post.content,
        post.summary || null,
        post.status || 'draft',
        post.published_at || null,
        post.author_id,
        post.category_id || null,
        post.featured_image_id || null,
        post.read_time || 0,
        post.language_code || 'en',
        post.translation_group_id || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, post: Partial<Post>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (post.title !== undefined) { fields.push('title = ?'); values.push(post.title); }
    if (post.slug !== undefined) { fields.push('slug = ?'); values.push(post.slug); }
    if (post.content !== undefined) { fields.push('content = ?'); values.push(post.content); }
    if (post.summary !== undefined) { fields.push('summary = ?'); values.push(post.summary || null); }
    if (post.status !== undefined) { fields.push('status = ?'); values.push(post.status); }
    if (post.published_at !== undefined) { fields.push('published_at = ?'); values.push(post.published_at || null); }
    if (post.category_id !== undefined) { fields.push('category_id = ?'); values.push(post.category_id || null); }
    if (post.featured_image_id !== undefined) { fields.push('featured_image_id = ?'); values.push(post.featured_image_id || null); }
    if (post.read_time !== undefined) { fields.push('read_time = ?'); values.push(post.read_time); }
    if (post.language_code !== undefined) { fields.push('language_code = ?'); values.push(post.language_code); }
    if (post.translation_group_id !== undefined) { fields.push('translation_group_id = ?'); values.push(post.translation_group_id || null); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM posts WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async incrementViews(id: number): Promise<void> {
    await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);
  }

  // Tags Relationship Helpers
  async setPostTags(postId: number, tagIds: number[]): Promise<void> {
    // Clear old mappings
    await pool.query('DELETE FROM post_tags WHERE post_id = ?', [postId]);
    if (tagIds.length === 0) return;

    // Insert new mappings
    const values = tagIds.map(tagId => [postId, tagId]);
    await pool.query('INSERT INTO post_tags (post_id, tag_id) VALUES ?', [values]);
  }

  async getPostTags(postId: number): Promise<Array<{ id: number; name: string; slug: string }>> {
    const [rows]: any = await pool.query(
      `SELECT t.id, t.name, t.slug 
       FROM tags t 
       JOIN post_tags pt ON t.id = pt.tag_id 
       WHERE pt.post_id = ?`,
      [postId]
    );
    return rows;
  }

  // Meta Helpers
  async setPostMeta(postId: number, key: string, value: string): Promise<void> {
    await pool.query(
      `INSERT INTO post_meta (post_id, meta_key, meta_value) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE meta_value = ?`,
      [postId, key, value, value]
    );
  }

  async getPostMeta(postId: number): Promise<Record<string, string>> {
    const [rows]: any = await pool.query('SELECT meta_key, meta_value FROM post_meta WHERE post_id = ?', [postId]);
    return rows.reduce((acc: any, row: any) => {
      acc[row.meta_key] = row.meta_value;
      return acc;
    }, {});
  }

  // SEO Helpers
  async setPostSEO(postId: number, seo: any): Promise<void> {
    const schemaMarkupString = seo.schema_markup ? JSON.stringify(seo.schema_markup) : null;
    await pool.query(
      `INSERT INTO seo_data (entity_type, entity_id, meta_title, meta_description, meta_keywords, canonical_url, robots_settings, og_title, og_description, og_image, twitter_card, schema_markup) 
       VALUES ('post', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
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
        postId,
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

  async getPostSEO(postId: number): Promise<any> {
    const [rows]: any = await pool.query(
      "SELECT * FROM seo_data WHERE entity_type = 'post' AND entity_id = ?",
      [postId]
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

export class PostService {
  private repo = new PostRepository();

  async getPost(id: number) {
    return this.repo.findById(id);
  }

  async getPostBySlug(slug: string, lang: string = 'en') {
    const post = await this.repo.findBySlug(slug, lang);
    if (post && post.id) {
      await this.repo.incrementViews(post.id);
    }
    return post;
  }

  async getPosts(options: FetchPostOptions) {
    return this.repo.findAll(options);
  }

  // Calculate reading time based on 200 words per minute
  private calculateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  async createPost(post: Post, tagIds: number[] = []) {
    // Verify slug uniqueness
    const existing = await this.repo.findBySlug(post.slug, post.language_code);
    if (existing) {
      throw new Error(`Post slug '${post.slug}' already exists for language '${post.language_code}'`);
    }

    // Set reading time
    post.read_time = this.calculateReadingTime(post.content);

    // If publishing, set published_at
    if (post.status === 'published' && !post.published_at) {
      post.published_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    const id = await this.repo.create(post);

    // Save Tags
    if (tagIds.length > 0) {
      await this.repo.setPostTags(id, tagIds);
    }

    // Auto generate SEO if none provided
    const seoData = post.seo || {};
    const autoSeo = generateAutoSEOSuggestions(post.title, post.content, post.summary || '');
    
    const finalSeo = {
      meta_title: seoData.meta_title || autoSeo.metaTitle,
      meta_description: seoData.meta_description || autoSeo.metaDescription,
      meta_keywords: seoData.meta_keywords || '',
      canonical_url: seoData.canonical_url || `/${post.slug}`,
      robots_settings: seoData.robots_settings || 'index, follow',
      og_title: seoData.og_title || autoSeo.ogTitle,
      og_description: seoData.og_description || autoSeo.ogDescription,
      og_image: seoData.og_image || null,
      twitter_card: seoData.twitter_card || 'summary_large_image',
      schema_markup: seoData.schema_markup || null
    };

    await this.repo.setPostSEO(id, finalSeo);

    // Save post meta
    if (post.meta) {
      for (const [key, value] of Object.entries(post.meta)) {
        await this.repo.setPostMeta(id, key, value);
      }
    }

    return id;
  }

  async updatePost(id: number, post: Partial<Post>, tagIds?: number[]) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error('Post not found');

    if (post.slug) {
      const lang = post.language_code || current.language_code;
      const existing = await this.repo.findBySlug(post.slug, lang);
      if (existing && existing.id !== id) {
        throw new Error(`Post slug '${post.slug}' already exists for language '${lang}'`);
      }
    }

    if (post.content !== undefined) {
      post.read_time = this.calculateReadingTime(post.content);
    }

    // Set published_at if transitioning to published
    if (post.status === 'published' && current.status !== 'published' && !post.published_at) {
      post.published_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await this.repo.update(id, post);

    if (tagIds !== undefined) {
      await this.repo.setPostTags(id, tagIds);
    }

    // Update SEO
    if (post.seo) {
      await this.repo.setPostSEO(id, post.seo);
    }

    // Update post meta
    if (post.meta) {
      for (const [key, value] of Object.entries(post.meta)) {
        await this.repo.setPostMeta(id, key, value);
      }
    }

    return true;
  }

  async deletePost(id: number) {
    return this.repo.delete(id);
  }

  async getRelatedPosts(postId: number, limit: number = 3): Promise<Post[]> {
    const post = await this.repo.findById(postId);
    if (!post) return [];

    // Query posts in same category, or with sharing same tags
    const [rows]: any = await pool.query(
      `SELECT DISTINCT p.*, u.name as author_name, m.file_path as featured_image_path
       FROM posts p
       JOIN authors a ON p.author_id = a.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media m ON p.featured_image_id = m.id
       LEFT JOIN post_tags pt ON p.id = pt.post_id
       WHERE p.status = 'published' 
         AND p.id != ? 
         AND (p.category_id = ? OR pt.tag_id IN (SELECT tag_id FROM post_tags WHERE post_id = ?))
       ORDER BY p.published_at DESC
       LIMIT ?`,
      [postId, post.category_id, postId, limit]
    );

    return rows;
  }

  // Get Analytics Overview
  async getDashboardAnalytics() {
    const [[postsCount]]: any = await pool.query('SELECT COUNT(*) as total FROM posts');
    const [[viewsCount]]: any = await pool.query('SELECT SUM(views) as total FROM posts');
    const [[authorsCount]]: any = await pool.query('SELECT COUNT(*) as total FROM authors');
    const [recentPosts]: any = await pool.query(
      `SELECT p.id, p.title, p.views, p.status, p.published_at, u.name as author_name 
       FROM posts p
       JOIN authors a ON p.author_id = a.id
       JOIN users u ON a.user_id = u.id
       ORDER BY p.id DESC LIMIT 5`
    );

    return {
      totalPosts: postsCount.total || 0,
      totalViews: viewsCount.total || 0,
      totalAuthors: authorsCount.total || 0,
      recentPosts,
    };
  }
}

export const postService = new PostService();
