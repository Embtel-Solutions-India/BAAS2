const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const blogSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, trim: true, lowercase: true },
  thumbnail:        { type: String, default: null },
  shortDescription: { type: String, default: '', trim: true },
  content:          { type: String, default: '' },
  metaTitle:        { type: String, default: '', trim: true },
  metaDescription:  { type: String, default: '', trim: true },
  tags:             [{ type: String, trim: true }],
  category:         { type: String, default: 'General', trim: true },
  author:           { type: String, default: 'BAAS Team', trim: true },
  readingTime:      { type: String, default: '' },
  featured:         { type: Boolean, default: false },
  status:           { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt:      { type: Date, default: null },
  created_at:       { type: Date, default: Date.now },
  updated_at:       { type: Date, default: Date.now }
}, schemaOptions);

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ featured: 1, status: 1 });

blogSchema.plugin(autoIncrement, { modelName: 'Blog' });

module.exports = mongoose.model('Blog', blogSchema);
