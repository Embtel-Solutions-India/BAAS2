import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api } from '../../utils/api';

const CATEGORIES = ['General', 'Tax Planning', 'Bookkeeping', 'Business Tips', 'Payroll', 'Cash Flow', 'Business Formation', 'Compliance', 'Industry News'];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    [{ align: [] }],
    ['link', 'image'],
    [{ color: [] }, { background: [] }],
    ['clean']
  ]
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'blockquote', 'code-block',
  'align', 'link', 'image', 'color', 'background'
];

export default function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    tags: '',
    category: 'General',
    author: 'BAAS Team',
    featured: false,
    status: 'draft'
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    async function loadBlog() {
      try {
        const data = await api.get(`/admin/blogs/${id}`);
        const b = data.blog;
        setForm({
          title: b.title || '',
          slug: b.slug || '',
          shortDescription: b.shortDescription || '',
          content: b.content || '',
          metaTitle: b.metaTitle || '',
          metaDescription: b.metaDescription || '',
          tags: (b.tags || []).join(', '),
          category: b.category || 'General',
          author: b.author || 'BAAS Team',
          featured: b.featured || false,
          status: b.status || 'draft'
        });
        if (b.thumbnail) setThumbnailPreview(b.thumbnail);
      } catch (err) {
        console.error('Load blog error:', err);
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSlugify = () => {
    if (!form.slug && form.title) {
      const slug = form.title.toLowerCase().trim()
        .replace(/&/g, '-and-')
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setForm(prev => ({ ...prev, slug }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (publishOverride) => {
    setError('');
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      if (form.slug) formData.append('slug', form.slug);
      formData.append('shortDescription', form.shortDescription);
      formData.append('content', form.content);
      formData.append('metaTitle', form.metaTitle || form.title);
      formData.append('metaDescription', form.metaDescription || form.shortDescription);
      formData.append('tags', form.tags);
      formData.append('category', form.category);
      formData.append('author', form.author);
      formData.append('featured', form.featured);
      formData.append('status', publishOverride !== undefined ? publishOverride : form.status);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

      if (isEdit) {
        await api.upload(`/admin/blogs/${id}`, formData, 'PUT');
      } else {
        await api.upload('/admin/blogs', formData, 'POST');
      }
      navigate('/admin/blogs');
    } catch (err) {
      setError(err.message || 'Failed to save blog');
      setSaving(false);
    }
  };

  const readingTime = useMemo(() => {
    const text = (form.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(Boolean).length;
    const min = Math.max(1, Math.ceil(words / 200));
    return `${min} min read`;
  }, [form.content]);

  if (loading) {
    return (
      <AdminLayout title={isEdit ? 'Edit Blog' : 'New Blog'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Blog' : 'New Blog'}>
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/50 text-sm mb-5 font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Main Content Form */}
        <div className="flex flex-col gap-6">
          {/* Title & Slug */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title *</label>
              <input
                type="text"
                name="title"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-base font-semibold tracking-tight transition-all bg-white"
                placeholder="Blog post title"
                value={form.title}
                onChange={handleChange}
                onBlur={handleSlugify}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Slug</label>
              <input
                type="text"
                name="slug"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs text-gray-500 font-mono transition-all bg-white"
                placeholder="auto-generated-from-title"
                value={form.slug}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Short Description</label>
            <textarea
              name="shortDescription"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white min-h-[80px] resize-vertical"
              placeholder="Brief summary of the blog post..."
              value={form.shortDescription}
              onChange={handleChange}
            />
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Content</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#d4001f] focus-within:ring-3 focus-within:ring-[#d4001f]/10 transition-all">
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={val => setForm(prev => ({ ...prev, content: val }))}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Write your blog content here..."
                style={{ minHeight: '350px' }}
              />
            </div>
            <div className="mt-3 text-xs text-gray-400 font-semibold tracking-wide">
              Est. reading time: {readingTime}
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4">SEO Settings</div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meta Title</label>
              <input
                type="text"
                name="metaTitle"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white"
                placeholder="Falls back to blog title"
                value={form.metaTitle}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meta Description</label>
              <textarea
                name="metaDescription"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white min-h-[60px] resize-vertical"
                placeholder="Falls back to short description"
                value={form.metaDescription}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="flex flex-col gap-6">
          {/* Publish Action Panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4">Publish</div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 hover:border-gray-350 hover:bg-gray-50 text-xs font-bold text-gray-700 bg-white shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit('published')}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg shadow-xs shadow-rose-900/10 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>

          {/* Thumbnail Panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4">Thumbnail</div>
            {thumbnailPreview ? (
              <div className="relative mb-3 group rounded-lg overflow-hidden border border-gray-100 shadow-2xs">
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full object-cover max-h-[160px]" />
                <button
                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-sm font-bold border-none transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>
            ) : null}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-xs font-semibold text-gray-500 transition-all"
            >
              {thumbnailPreview ? 'Replace Image' : 'Upload Thumbnail'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleThumbnailChange} />
            <div className="text-[10px] text-gray-400 mt-2 font-medium tracking-wide">JPG, PNG, WEBP — Max 5MB</div>
          </div>

          {/* Details / Taxonomy Panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4">Details</div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
              <select
                name="category"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_14px_center] bg-no-repeat cursor-pointer"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white"
                placeholder="tax, small business, tips"
                value={form.tags}
                onChange={handleChange}
              />
              <div className="text-[10px] text-gray-400 mt-2 font-medium tracking-wide">Comma separated</div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Author</label>
              <input
                type="text"
                name="author"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white"
                value={form.author}
                onChange={handleChange}
              />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="w-4.5 h-4.5 text-[#d4001f] border-gray-300 rounded-sm focus:ring-[#d4001f] cursor-pointer accent-[#d4001f]"
              />
              <label htmlFor="featured" className="text-xs font-bold text-gray-700 cursor-pointer select-none">Featured Blog</label>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

