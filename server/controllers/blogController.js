const sanitizeHtml = require('sanitize-html');
const path = require('path');
const { Blog, toRow, toRows } = require('../models');
const { uploadToS3, deleteFromS3 } = require('../config/s3');

/* ── Helpers ── */

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calcReadingTime(html) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

const SANITIZE_OPTS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code',
    'span', 'div', 'br', 'hr', 'iframe', 'video', 'source', 'sup', 'sub'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'style', 'id'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    a: ['href', 'target', 'rel'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan']
  },
  allowedSchemes: ['http', 'https', 'data', 'mailto']
};

/* ── ADMIN ENDPOINTS ── */

exports.createBlog = async (req, res) => {
  console.log('[createBlog] Starting blog creation handler. Body keys:', Object.keys(req.body));
  try {
    const { title, shortDescription, content, metaTitle, metaDescription, tags, category, author, featured, status } = req.body;

    if (!title || !title.trim()) {
      console.warn('[createBlog] Validation failed: missing title');
      return res.status(400).json({ error: 'Title is required' });
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }
    console.log('[createBlog] Generated slug:', slug);

    // Handle thumbnail upload to S3
    let thumbnailUrl = null;
    if (req.file) {
      console.log('[createBlog] File found in request. Starting S3 upload...');
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      thumbnailUrl = await uploadToS3(req.file.buffer, 'blogs/thumbnails', req.file.mimetype, ext);
      console.log('[createBlog] S3 upload successful. URL:', thumbnailUrl);
    } else {
      console.log('[createBlog] No file found in request.');
    }

    const sanitizedContent = sanitizeHtml(content || '', SANITIZE_OPTS);

    const blog = new Blog({
      title: title.trim(),
      slug,
      thumbnail: thumbnailUrl,
      shortDescription: (shortDescription || '').trim(),
      content: sanitizedContent,
      metaTitle: (metaTitle || title).trim(),
      metaDescription: (metaDescription || shortDescription || '').trim(),
      tags: parseTags(tags),
      category: (category || 'General').trim(),
      author: (author || 'BAAS Team').trim(),
      readingTime: calcReadingTime(sanitizedContent),
      featured: featured === 'true' || featured === true,
      status: status === 'published' ? 'published' : 'draft',
      publishedAt: status === 'published' ? new Date() : null
    });

    console.log('[createBlog] Saving blog to MongoDB...');
    await blog.save();
    console.log('[createBlog] Blog saved successfully. ID:', blog._id);
    res.status(201).json({ blog: toRow(blog) });
  } catch (err) {
    console.error('[createBlog] Exception caught:', err);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

exports.listBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status: filterStatus, tag, sort = 'latest' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (filterStatus) filter.status = filterStatus;
    if (tag) filter.tags = tag;

    let sortObj = { created_at: -1 };
    if (sort === 'oldest') sortObj = { created_at: 1 };
    if (sort === 'featured') sortObj = { featured: -1, created_at: -1 };

    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      blogs: toRows(blogs),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('listBlogs error:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json({ blog: toRow(blog) });
  } catch (err) {
    console.error('getBlog error:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

exports.updateBlog = async (req, res) => {
  console.log('[updateBlog] Starting blog update handler. ID:', req.params.id, 'Body keys:', Object.keys(req.body));
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      console.warn('[updateBlog] Blog not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Blog not found' });
    }

    const { title, slug: newSlug, shortDescription, content, metaTitle, metaDescription, tags, category, author, featured, status } = req.body;

    // Handle slug update
    if (newSlug && newSlug !== blog.slug) {
      const slugified = slugify(newSlug);
      const existing = await Blog.findOne({ slug: slugified, _id: { $ne: blog._id } });
      if (existing) {
        console.warn('[updateBlog] Slug already in use:', slugified);
        return res.status(409).json({ error: 'Slug already in use' });
      }
      blog.slug = slugified;
    } else if (title && title !== blog.title && !newSlug) {
      // Auto-update slug if title changed and no explicit slug provided
      let baseSlug = slugify(title);
      let slug = baseSlug;
      let counter = 1;
      while (await Blog.findOne({ slug, _id: { $ne: blog._id } })) {
        slug = `${baseSlug}-${counter++}`;
      }
      blog.slug = slug;
    }
    console.log('[updateBlog] Slug set to:', blog.slug);

    // Handle thumbnail replacement
    if (req.file) {
      console.log('[updateBlog] New file found. Old thumbnail URL:', blog.thumbnail);
      if (blog.thumbnail) {
        console.log('[updateBlog] Deleting old thumbnail from S3...');
        await deleteFromS3(blog.thumbnail);
      }
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      blog.thumbnail = await uploadToS3(req.file.buffer, 'blogs/thumbnails', req.file.mimetype, ext);
      console.log('[updateBlog] S3 upload successful. New URL:', blog.thumbnail);
    }

    if (title !== undefined)            blog.title = title.trim();
    if (shortDescription !== undefined) blog.shortDescription = shortDescription.trim();
    if (content !== undefined) {
      blog.content = sanitizeHtml(content, SANITIZE_OPTS);
      blog.readingTime = calcReadingTime(blog.content);
    }
    if (metaTitle !== undefined)        blog.metaTitle = metaTitle.trim();
    if (metaDescription !== undefined)  blog.metaDescription = metaDescription.trim();
    if (tags !== undefined)             blog.tags = parseTags(tags);
    if (category !== undefined)         blog.category = category.trim();
    if (author !== undefined)           blog.author = author.trim();
    if (featured !== undefined)         blog.featured = featured === 'true' || featured === true;
    if (status !== undefined) {
      blog.status = status;
      if (status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
      if (status === 'draft') blog.publishedAt = null;
    }

    blog.updated_at = new Date();
    console.log('[updateBlog] Saving changes to MongoDB...');
    await blog.save();
    console.log('[updateBlog] Blog updated successfully.');

    res.json({ blog: toRow(blog) });
  } catch (err) {
    console.error('[updateBlog] Exception caught:', err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    // Delete thumbnail from S3
    if (blog.thumbnail) {
      await deleteFromS3(blog.thumbnail);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('deleteBlog error:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

exports.publishBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    blog.status = 'published';
    if (!blog.publishedAt) blog.publishedAt = new Date();
    blog.updated_at = new Date();
    await blog.save();

    res.json({ blog: toRow(blog) });
  } catch (err) {
    console.error('publishBlog error:', err);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
};

exports.unpublishBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    blog.status = 'draft';
    blog.publishedAt = null;
    blog.updated_at = new Date();
    await blog.save();

    res.json({ blog: toRow(blog) });
  } catch (err) {
    console.error('unpublishBlog error:', err);
    res.status(500).json({ error: 'Failed to unpublish blog' });
  }
};

/* ── PUBLIC ENDPOINTS ── */

exports.getPublishedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, tag, sort = 'latest' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const filter = { status: 'published' };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (category && category !== 'All') filter.category = category;
    if (tag) filter.tags = tag;

    let sortObj = { publishedAt: -1 };
    if (sort === 'oldest') sortObj = { publishedAt: 1 };

    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .select('-content')
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Collect distinct categories from published blogs
    const categories = await Blog.distinct('category', { status: 'published' });

    res.json({
      blogs: toRows(blogs),
      categories,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    console.error('getPublishedBlogs error:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    // Fetch related blogs (same category, exclude current)
    const related = await Blog.find({ status: 'published', category: blog.category, _id: { $ne: blog._id } })
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(3);

    res.json({ blog: toRow(blog), related: toRows(related) });
  } catch (err) {
    console.error('getBlogBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

exports.getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published', featured: true })
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(6);
    res.json({ blogs: toRows(blogs) });
  } catch (err) {
    console.error('getFeaturedBlogs error:', err);
    res.status(500).json({ error: 'Failed to fetch featured blogs' });
  }
};

exports.getLatestBlogs = async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 6);
    const blogs = await Blog.find({ status: 'published' })
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(limit);
    res.json({ blogs: toRows(blogs) });
  } catch (err) {
    console.error('getLatestBlogs error:', err);
    res.status(500).json({ error: 'Failed to fetch latest blogs' });
  }
};

/* ── Utility ── */

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}
