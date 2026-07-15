const crypto = require('crypto');
const { Client, Admin, ActivityLog } = require('../models');
const authController = require('../controllers/authController');

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
const randomHash = () => crypto.randomBytes(32).toString('hex');

/**
 * Resolve a verified client identity (from OTP or OAuth), linking existing
 * users by email (no duplicates), auto-provisioning new ones, then issue the
 * app's standard JWT session cookie. Role is always 'client' and derived
 * server-side; admin emails are rejected (admins keep their own login).
 */
async function loginClientByIdentity(res, { email, firstName, lastName, provider = null, providerId = null, image = null, method }) {
  email = String(email || '').toLowerCase().trim();
  if (!email) throw httpError(400, 'Email is required');

  const admin = await Admin.findOne({ email });
  if (admin) throw httpError(403, 'This email is registered for admin access. Please use the admin login.');

  const or = [{ email }];
  if (provider && providerId) or.unshift({ oauth_provider: provider, oauth_provider_id: providerId });
  let client = await Client.findOne({ $or: or });
  const isNew = !client;

  if (!client) {
    client = await Client.create({
      first_name: firstName || 'New',
      last_name:  lastName || 'Client',
      email,
      password_hash: randomHash(),           // passwordless — unusable local password
      is_verified: true,
      is_active: true,
      email_verified: true,
      otp_verified: method === 'otp',
      oauth_provider: provider,
      oauth_provider_id: providerId,
      profile_image: image || null,
      login_method: method,
      last_login: new Date(),
    });
  } else {
    if (!client.is_active) throw httpError(403, 'Account is disabled.');
    client.email_verified = true;
    if (method === 'otp') client.otp_verified = true;
    if (provider && !client.oauth_provider) { client.oauth_provider = provider; client.oauth_provider_id = providerId; }
    if (image && !client.profile_image) client.profile_image = image;
    client.login_method = method;
    client.last_login = new Date();
    await client.save();
  }

  authController.issueToken(res, { id: client.id, email: client.email, role: 'client' });

  ActivityLog.create({
    admin_id: null, action: `client_login_${method}`, entity_type: 'client', entity_id: client.id,
    meta: { is_new: isNew, provider: provider || null },
  }).catch(err => console.error('auth audit log failed:', err.message));

  return { client, isNew };
}

module.exports = { loginClientByIdentity };
