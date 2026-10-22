// Shared blog queries.

// Up to `limit` related posts: same category first, then topped up with the newest other posts so every
// article links to others (audit B2: orphaned posts). Used by the public API and the server-rendered page.
// `lean` returns plain objects (server-rendered page); the API passes lean=false to keep mongoose docs for toRows().
async function relatedPosts(Blog, blog, { limit = 3, lean = true } = {}) {
  const base = { status: 'published' };
  const q1 = Blog.find({ ...base, category: blog.category, _id: { $ne: blog._id } }).select('-content').sort({ publishedAt: -1 }).limit(limit);
  const same = await (lean ? q1.lean() : q1);
  if (same.length >= limit) return same;
  const exclude = [blog._id, ...same.map((r) => r._id)];
  const q2 = Blog.find({ ...base, _id: { $nin: exclude } }).select('-content').sort({ publishedAt: -1 }).limit(limit - same.length);
  const more = await (lean ? q2.lean() : q2);
  return [...same, ...more];
}

module.exports = { relatedPosts };
