const { Order, Document, toRow, toRows } = require('../models');
const path = require('path');
const fs   = require('fs');

exports.listDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ client_id: req.user.id })
      .populate('order_id', 'order_number')
      .sort({ created_at: -1 });

    const rows = docs.map(doc => {
      const row = toRow(doc);
      row.order_number = doc.order_id ? doc.order_id.order_number : null;
      row.order_id = doc.order_id ? doc.order_id.id : null;
      return row;
    });

    res.json({ documents: rows });
  } catch (err) {
    console.error('listDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

exports.listOrderDocuments = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, client_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const docs = await Document.find({ order_id: req.params.orderId }).sort({ created_at: -1 });
    res.json({ documents: toRows(docs) });
  } catch (err) {
    console.error('listOrderDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

exports.uploadDocument = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const order = await Order.findOne({ _id: req.params.orderId, client_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const doc = new Document({
      client_id: req.user.id,
      order_id: req.params.orderId,
      name: req.file.originalname,
      type: req.body.type || 'other',
      file_path: req.file.path,
      file_size: req.file.size,
      uploaded_by: `client:${req.user.id}`
    });
    await doc.save();

    res.status(201).json({ message: 'Document uploaded', document_id: doc.id });
  } catch (err) {
    console.error('uploadDocument error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, client_id: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.resolve(doc.file_path);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: 'File not found on disk' });

    res.download(filePath, doc.name);
  } catch (err) {
    console.error('downloadDocument error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, client_id: req.user.id, is_final: false });
    if (!doc)
      return res.status(404).json({ error: 'Document not found or cannot be deleted' });

    const filePath = path.resolve(doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};
