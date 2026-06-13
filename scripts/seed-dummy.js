const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Helper to parse .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if any
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

async function main() {
  console.log('Connecting to database...');
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  try {
    // 1. Create or get author "A Zadid"
    console.log('Setting up Author "A Zadid"...');
    const authorEmail = 'azadid@techgiantworld.com';
    let authorId;

    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [authorEmail]);
    if (existingUsers.length === 0) {
      // Create user
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, name, role_id, status) VALUES (?, ?, ?, ?, ?)',
        [authorEmail, 'dummy_hash_not_for_login_2026', 'A Zadid', 1, 'active']
      );
      const userId = userResult.insertId;

      // Create author
      const [authorResult] = await connection.query(
        'INSERT INTO authors (user_id, bio) VALUES (?, ?)',
        [userId, 'SaaS writer, digital marketer, and software reviewer.']
      );
      authorId = authorResult.insertId;
      console.log('Created new author profile for A Zadid.');
    } else {
      const userId = existingUsers[0].id;
      const [existingAuthors] = await connection.query('SELECT id FROM authors WHERE user_id = ?', [userId]);
      if (existingAuthors.length === 0) {
        const [authorResult] = await connection.query(
          'INSERT INTO authors (user_id, bio) VALUES (?, ?)',
          [userId, 'SaaS writer, digital marketer, and software reviewer.']
        );
        authorId = authorResult.insertId;
      } else {
        authorId = existingAuthors[0].id;
      }
      console.log('Author profile for A Zadid already exists.');
    }

    // 2. Seed Categories
    console.log('Seeding categories...');
    const categoriesToSeed = [
      { name: 'AI', slug: 'ai', description: 'Artificial Intelligence and machine learning news.' },
      { name: 'All', slug: 'all', description: 'All categories list.' },
      { name: 'Animal', slug: 'animal', description: 'Wildlife and pet tech news.' },
      { name: 'Auto', slug: 'auto', description: 'Autonomous vehicles and electric car news.' },
      { name: 'Bitcoin', slug: 'bitcoin', description: 'Cryptocurrency and blockchain insights.' },
      { name: 'Business', slug: 'business', description: 'Business strategy and startup scaling.' },
      { name: 'Fashion', slug: 'fashion', description: 'E-commerce fashion and design trends.' },
      { name: 'Food', slug: 'food', description: 'Food delivery tech and agricultural tech.' },
      { name: 'Gadgets', slug: 'gadgets', description: 'Smartphones, wearables, and hardware reviews.' },
      { name: 'Health', slug: 'health', description: 'Health technology, biohacking, and wellness.' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Digital lifestyle and modern workplace.' },
      { name: 'News', slug: 'news', description: 'Tech news from around the world.' },
      { name: 'Sports', slug: 'sports', description: 'Sports tech and analytical performance.' },
      { name: 'Technology', slug: 'technology', description: 'Latest developments in software, hardware, and networks.' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Streaming services, gaming, and digital entertainment.' },
      { name: 'Home Improvement', slug: 'home-improvement', description: 'Smart home gadgets and automation.' },
      { name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, PPC, copy, and growth hacking strategies.' },
      { name: 'Marketing', slug: 'marketing', description: 'General brand marketing and growth strategies.' },
      { name: 'Social Media', slug: 'social-media', description: 'Social media growth and SMM panel optimization.' },
      { name: 'Wedding', slug: 'wedding', description: 'Wedding tech and planning directories.' }
    ];

    const categoryMap = {}; // name -> id

    for (const cat of categoriesToSeed) {
      const [existing] = await connection.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
      if (existing.length === 0) {
        const [res] = await connection.query(
          'INSERT INTO categories (name, slug, description, language_code) VALUES (?, ?, ?, ?)',
          [cat.name, cat.slug, cat.description, 'en']
        );
        categoryMap[cat.name] = res.insertId;
        console.log(`Category '${cat.name}' created.`);
      } else {
        categoryMap[cat.name] = existing[0].id;
        console.log(`Category '${cat.name}' already exists.`);
      }
    }

    // 3. Seed Media paths (images for posts)
    console.log('Seeding media assets...');
    const mediaToSeed = [
      { filename: 'digital_marketing_matters.jpg', path: '/uploads/digital_marketing_matters.jpg' },
      { filename: 'digital_convenience.jpg', path: '/uploads/digital_convenience.jpg' },
      { filename: 'smm_panel_ads.jpg', path: '/uploads/smm_panel_ads.jpg' },
      { filename: 'social_media_growth.jpg', path: '/uploads/social_media_growth.jpg' },
      { filename: 'web_design_dev.jpg', path: '/uploads/web_design_dev.jpg' },
      { filename: 'safe_smm_panel.jpg', path: '/uploads/safe_smm_panel.jpg' }
    ];

    const mediaMap = {}; // path -> id

    for (const m of mediaToSeed) {
      const [existing] = await connection.query('SELECT id FROM media WHERE file_path = ?', [m.path]);
      if (existing.length === 0) {
        const [res] = await connection.query(
          'INSERT INTO media (filename, file_path, file_size, mime_type, alt_text) VALUES (?, ?, ?, ?, ?)',
          [m.filename, m.path, 102400, 'image/jpeg', m.filename.replace('.jpg', '').replace(/_/g, ' ')]
        );
        mediaMap[m.path] = res.insertId;
      } else {
        mediaMap[m.path] = existing[0].id;
      }
    }

    // 4. Seed Posts
    console.log('Seeding dummy posts...');
    const postsToSeed = [
      {
        title: 'Why Affordable Digital Marketing Matters for Growing Businesses',
        slug: 'why-affordable-digital-marketing-matters-for-growing-businesses',
        categoryName: 'Marketing',
        summary: 'Every business wants to reach more customers, increase brand awareness, and stay competitive in today\'s digital landscape.',
        content: `Digital marketing has changed the way businesses connect with their audience. Affordable digital marketing strategies, such as SEO, social media, and content marketing, allow small and medium-sized businesses to compete with larger brands on a budget.\n\nEstablishing a strong online presence lets businesses target their ideal audience, track conversion rates in real-time, and drive sustainable growth without spending a fortune on traditional advertising channels.\n\nInvesting in digital marketing yields high ROI, provides direct access to customer analytics, and facilitates instant community feedback. Small brands can utilize hyper-localized SEO tactics and organic social media reach to quickly gain ground and build digital brand authority.`,
        status: 'published',
        publishedAt: '2026-06-11 09:00:00',
        views: 1540,
        readTime: 5,
        imagePath: '/uploads/digital_marketing_matters.jpg'
      },
      {
        title: 'The Impact of Digital Convenience on Modern Consumers',
        slug: 'the-impact-of-digital-convenience-on-modern-consumers',
        categoryName: 'Digital Marketing',
        summary: 'Digital convenience has transformed modern consumer behavior, driving expectations for instant gratification and seamless online transactions.',
        content: `Today's consumers expect everything to be fast, reliable, and accessible on their mobile devices. From e-commerce shopping to instant customer support, digital convenience has become a major differentiator for successful brands.\n\nBusinesses that optimize their websites for speed, simplify checkout processes, and offer personalized digital experiences are winning customer loyalty and driving higher retention rates.\n\nConsumers no longer compare their shopping experiences to direct competitors; instead, they compare them to the best-in-class experiences provided by global tech giants. Reducing frictional touchpoints in the digital checkout journey is now mandatory for modern marketing success.`,
        status: 'published',
        publishedAt: '2026-06-11 10:15:00',
        views: 890,
        readTime: 4,
        imagePath: '/uploads/digital_convenience.jpg'
      },
      {
        title: 'Why SMM Panel Services Are Cheaper Than Social Media Ads',
        slug: 'why-smm-panel-services-are-cheaper-than-social-media-ads',
        categoryName: 'Social Media',
        summary: 'SMM panels provide cost-effective marketing options compared to traditional platform advertising, helping small brands scale up on a budget.',
        content: `Social media marketing (SMM) is crucial for brand awareness, but running paid ads on platforms like Facebook or Instagram can quickly become expensive. SMM panels offer bulk services like followers, likes, views, and shares at a fraction of the cost.\n\nWhile paid advertising relies on complex bidding strategies and ongoing optimization, SMM panels provide immediate, predictable metrics to help bootstrap new social channels and establish social proof.\n\nBy building social proof rapidly, brands can increase organic conversion rates, attract genuine followers, and establish immediate market credibility. However, SMM panels must be used strategically alongside high-quality organic content.`,
        status: 'published',
        publishedAt: '2026-06-11 11:30:00',
        views: 1210,
        readTime: 6,
        imagePath: '/uploads/smm_panel_ads.jpg'
      },
      {
        title: 'Why Social Media Marketing Matters for Modern Business Growth',
        slug: 'why-social-media-marketing-matters-for-modern-business-growth',
        categoryName: 'Business',
        summary: 'Social media marketing is essential for growing customer base, building loyalty, and increasing brand authority in the modern economy.',
        content: `With billions of active users worldwide, social media platforms are the best channels for reaching potential customers. Social media marketing allows brands to engage with their audience directly, build community around their products, and receive instant feedback.\n\nModern businesses must leverage social channels to share high-quality content, run targeted campaigns, and drive organic traffic to their main web properties.\n\nA solid social strategy boosts search rankings, improves customer trust, and exposes your company to a global audience with very low entry costs. Building brand ambassadors via active social discussion boards is a powerful growth engine.`,
        status: 'published',
        publishedAt: '2026-06-11 12:45:00',
        views: 2130,
        readTime: 8,
        imagePath: '/uploads/social_media_growth.jpg'
      },
      {
        title: 'Web Design vs Web Development: Understanding the Real Difference',
        slug: 'web-design-vs-web-development-understanding-the-real-difference',
        categoryName: 'Technology',
        summary: 'Learn the fundamental differences between design aesthetics and back-end development in building high-performance websites.',
        content: `Web design and web development are two sides of the same coin, but they require entirely different skill sets. Web design focuses on the visual aesthetics, layout, typography, and user experience (UX) of a website.\n\nWeb developers, on the other hand, build the underlying codebase using HTML, CSS, JavaScript, and backend languages to make the design functional, secure, responsive, and fast.\n\nUnderstanding this difference is key to hiring the right talent for your digital projects. A successful launch requires collaboration between designers who build the visuals and developers who bring the code to life with robust data integrations.`,
        status: 'published',
        publishedAt: '2026-06-11 14:00:00',
        views: 750,
        readTime: 5,
        imagePath: '/uploads/web_design_dev.jpg'
      },
      {
        title: 'How to Choose a Safe SMM Panel: A Complete Beginner\'s Guide',
        slug: 'how-to-choose-a-safe-smm-panel-a-complete-beginners-guide',
        categoryName: 'Technology',
        summary: 'In today\'s digital marketing world, SMM panels have become a popular tool for quickly boosting social metrics. Here is a guide to choosing one safely.',
        content: `Not all SMM panels are created equal. Using low-quality or untrustworthy panels can result in account suspensions, lost funds, or fake engagement that hurts your brand's reputation.\n\nA safe SMM panel should offer secure payment methods, realistic delivery speeds, active customer support, and high-quality profiles.\n\nBeginners should start with small trial orders, read reviews, and verify the panel's security certificates before committing to larger campaigns. Make sure to choose providers that offer drop protection and lifetime guarantee options.`,
        status: 'published',
        publishedAt: '2026-06-11 15:15:00',
        views: 1980,
        readTime: 7,
        imagePath: '/uploads/safe_smm_panel.jpg'
      }
    ];

    for (const post of postsToSeed) {
      const [existing] = await connection.query('SELECT id FROM posts WHERE slug = ?', [post.slug]);
      const categoryId = categoryMap[post.categoryName] || null;
      const featuredImageId = mediaMap[post.imagePath] || null;

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO posts (title, slug, content, summary, status, published_at, author_id, category_id, featured_image_id, read_time, views, language_code) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            post.title,
            post.slug,
            post.content,
            post.summary,
            post.status,
            post.publishedAt,
            authorId,
            categoryId,
            featuredImageId,
            post.readTime,
            post.views,
            'en'
          ]
        );
        console.log(`Post '${post.title}' seeded successfully.`);
      } else {
        console.log(`Post '${post.title}' already exists.`);
      }
    }

    console.log('Database seeding complete!');
  } catch (err) {
    console.error('Error during database seeding:', err.stack);
  } finally {
    await connection.end();
  }
}

main();
