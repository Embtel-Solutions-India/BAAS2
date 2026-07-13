const bcrypt = require('bcryptjs');
const { Client, toRow } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const row = toRow(client);
    delete row.password_hash;
    res.json({ profile: row });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  if (!first_name || !last_name)
    return res.status(400).json({ error: 'First name and last name are required' });
  try {
    await Client.findByIdAndUpdate(req.user.id, {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone || null
    });
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Both current and new password are required' });
  if (new_password.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const client = await Client.findById(req.user.id);
    if (!client) return res.status(404).json({ error: 'Profile not found' });

    const match = await bcrypt.compare(current_password, client.password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    client.password_hash = hash;
    await client.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
};
