const express = require('express');
const { SANITIZE_OPTS } = require('../controllers/blogController');
const { renderPostPage, renderListingPage, renderNotFound, PAGE_SIZE, SITE } = require('../utils/blogSeo');
const { relatedPosts } = require('../utils/blogQueries');

// Server-rendered blog HTML for crawlers (audit A1-A3, B1-B4). nginx proxies /blog/<slug> and
// /blog/page/<n> here because those pages are not prerendered. `readShell()` returns the neutral
// pre-prerender SPA shell (dist/shell.html) or null if it isn't available.
module.exports = function blogPages({ readShell }) {
  const router = express.Router();

  function sendHtml(res, status, html) {
    // Served by nginx everywhere else with no CSP header; match that here so this passthrough doesn't
    // behave differently (e.g. block the Elfsight widget's inline bootstrap script) from every other page.
    res.removeHeader('Content-Security-Policy');
    res.status(status).type('html').send(html);
  }

  // /blog/page/<n> (n >= 2): crawlable pagination. Page 1 is the prerendered /blog, so /blog/page/1
  // redirects there; a page past the end is a real 404.
  router.get('/blog/page/:n', async (req, res, next) => {
    try {
      const shell = readShell();
      if (!shell) return next();
      if (!/^\d{1,4}$/.test(req.params.n)) return sendHtml(res, 404, renderNotFound(shell, `${SITE}/blog`));
      const pageNum = parseInt(req.params.n, 10);
      if (pageNum === 1) return res.redirect(301, '/blog');

      const Blog = require('../models/Blog');
      const filter = { status: 'published' };
      const total = await Blog.countDocuments(filter);
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (pageNum < 1 || pageNum > pages) return sendHtml(res, 404, renderNotFound(shell, `${SITE}/blog/page/${pageNum}`));

      const blogs = await Blog.find(filter)
        .select('title slug shortDescription')
        .sort({ publishedAt: -1 })
        .skip((pageNum - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean();
      sendHtml(res, 200, renderListingPage(shell, { pageNum, pages, blogs }));
    } catch (err) {
      next(err);
    }
  });

  // /blog/<slug>: the server renders each article's SEO (title, description, canonical, Open Graph,
  // BlogPosting + BreadcrumbList JSON-LD) and its real content into the shell. A bad slug is still a
  // real 404 (and noindex).
  //
  // IMPORTANT: this must be the neutral pre-prerender shell (shell.html), not dist/index.html — the
  // prerender script overwrites index.html with the *home page's* own rendered content.
  router.get('/blog/:slug', async (req, res, next) => {
    try {
      const shell = readShell();
      if (!shell) return next();
      const Blog = require('../models/Blog');
      const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' }).lean();
      if (!blog) return sendHtml(res, 404, renderNotFound(shell, `${SITE}/blog/${encodeURIComponent(req.params.slug)}`));

      const related = await relatedPosts(Blog, blog);
      sendHtml(res, 200, renderPostPage(shell, blog, related, SANITIZE_OPTS));
    } catch (err) {
      next(err);
    }
  });

  return router;
};
