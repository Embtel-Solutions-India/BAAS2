/**
 * QuickBooks Payments integration service.
 *
 * Responsibilities:
 *  - OAuth 2.0 authorize / token exchange / automatic refresh
 *  - Encrypted token storage (AES-256-GCM, key derived from JWT_SECRET)
 *  - Payments API client: tokenize card, create charge, get charge, refund
 *  - Retry with exponential backoff on transient failures, auto re-auth on 401
 *  - Webhook signature verification (HMAC-SHA256 with verifier token)
 *
 * All configuration comes from environment variables (see .env.example).
 */
const crypto = require('crypto');
const { QuickBooksToken } = require('../models');

const ENV = () => (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox').toLowerCase();

const OAUTH_AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2';
const OAUTH_TOKEN_URL     = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const OAUTH_REVOKE_URL    = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

function paymentsBaseUrl() {
  return ENV() === 'production'
    ? 'https://api.intuit.com/quickbooks/v4/payments'
    : 'https://sandbox.api.intuit.com/quickbooks/v4/payments';
}

function isConfigured() {
  return Boolean(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET);
}

/* ─────────────────────────── Token encryption ─────────────────────────── */

function encKey() {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return crypto.createHash('sha256').update(`qb-token-key:${secret}`).digest();
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

function decrypt(payload) {
  const [ivB64, tagB64, dataB64] = String(payload).split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

/* ─────────────────────────── OAuth 2.0 flow ─────────────────────────── */

function basicAuthHeader() {
  const creds = `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(creds).toString('base64')}`;
}

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.payment',
    state
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function requestToken(bodyParams) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams(bodyParams).toString()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error_description || data.error || `OAuth token request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function saveTokens(realmId, tokenData, connectedBy = null) {
  const now = Date.now();
  const doc = {
    realm_id: String(realmId),
    environment: ENV(),
    access_token_enc: encrypt(tokenData.access_token),
    refresh_token_enc: encrypt(tokenData.refresh_token),
    access_expires_at: new Date(now + (tokenData.expires_in || 3600) * 1000),
    refresh_expires_at: new Date(now + (tokenData.x_refresh_token_expires_in || 8726400) * 1000),
    updated_at: new Date()
  };
  if (connectedBy) doc.connected_by = connectedBy;
  return QuickBooksToken.findOneAndUpdate(
    { realm_id: String(realmId) },
    { $set: doc, $setOnInsert: { created_at: new Date() } },
    { new: true, upsert: true }
  );
}

async function exchangeCodeForTokens(code, realmId, connectedBy = null) {
  const data = await requestToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI
  });
  return saveTokens(realmId, data, connectedBy);
}

/**
 * Seed a connection from env vars (QUICKBOOKS_ACCESS_TOKEN / REFRESH_TOKEN / REALM_ID)
 * if the database has no stored connection yet.
 */
async function seedFromEnvIfNeeded() {
  if (!process.env.QUICKBOOKS_REFRESH_TOKEN || !process.env.QUICKBOOKS_REALM_ID) return null;
  const existing = await QuickBooksToken.findOne({ realm_id: String(process.env.QUICKBOOKS_REALM_ID) });
  if (existing) return existing;
  return saveTokens(process.env.QUICKBOOKS_REALM_ID, {
    access_token: process.env.QUICKBOOKS_ACCESS_TOKEN || 'seed',
    refresh_token: process.env.QUICKBOOKS_REFRESH_TOKEN,
    expires_in: process.env.QUICKBOOKS_ACCESS_TOKEN ? 3600 : 0
  });
}

async function getConnection() {
  await seedFromEnvIfNeeded().catch(() => null);
  return QuickBooksToken.findOne({ environment: ENV() }).sort({ updated_at: -1 });
}

/**
 * Returns a valid access token, refreshing automatically when it is
 * missing or expires within the next 2 minutes.
 */
async function getAccessToken() {
  const conn = await getConnection();
  if (!conn) {
    const err = new Error('QuickBooks is not connected. An administrator must connect QuickBooks first.');
    err.status = 503;
    err.code = 'QB_NOT_CONNECTED';
    throw err;
  }

  const expiresSoon = !conn.access_expires_at || conn.access_expires_at.getTime() - Date.now() < 120000;
  if (!expiresSoon) return { accessToken: decrypt(conn.access_token_enc), realmId: conn.realm_id };

  if (conn.refresh_expires_at && conn.refresh_expires_at.getTime() < Date.now()) {
    const err = new Error('QuickBooks connection expired. Please reconnect QuickBooks.');
    err.status = 503;
    err.code = 'QB_RECONNECT_REQUIRED';
    throw err;
  }

  const data = await requestToken({
    grant_type: 'refresh_token',
    refresh_token: decrypt(conn.refresh_token_enc)
  });
  const saved = await saveTokens(conn.realm_id, data);
  return { accessToken: decrypt(saved.access_token_enc), realmId: saved.realm_id };
}

async function revokeConnection() {
  const conn = await getConnection();
  if (!conn) return false;
  try {
    await fetch(OAUTH_REVOKE_URL, {
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ token: decrypt(conn.refresh_token_enc) })
    });
  } catch (err) {
    console.warn('QuickBooks revoke request failed:', err.message);
  }
  await QuickBooksToken.deleteOne({ _id: conn._id });
  return true;
}

/* ─────────────────────── Payments API client ─────────────────────── */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Authenticated request to the QuickBooks Payments API with:
 *  - automatic access-token refresh
 *  - one forced re-auth retry on 401
 *  - exponential backoff on transient network/5xx errors
 */
async function qbRequest(method, path, body = null, { requestId = null, maxAttempts = 3 } = {}) {
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let auth;
    try {
      auth = await getAccessToken();
    } catch (err) {
      throw err;
    }

    const headers = {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (requestId) headers['Request-Id'] = requestId;

    let res;
    try {
      res = await fetch(`${paymentsBaseUrl()}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (networkErr) {
      lastErr = networkErr;
      if (attempt < maxAttempts) { await sleep(300 * 2 ** (attempt - 1)); continue; }
      throw new Error(`QuickBooks request failed: ${networkErr.message}`);
    }

    const data = await res.json().catch(() => ({}));

    if (res.ok) return data;

    if (res.status === 401 && attempt < maxAttempts) {
      // Force refresh on next loop by expiring the stored access token
      await QuickBooksToken.updateMany({ environment: ENV() }, { $set: { access_expires_at: new Date(0) } });
      continue;
    }

    if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
      await sleep(300 * 2 ** (attempt - 1));
      continue;
    }

    const detail = (data.errors && data.errors[0]) || {};
    const err = new Error(detail.message || detail.moreInfo || `QuickBooks API error (${res.status})`);
    err.status = res.status;
    err.code = detail.code || 'QB_API_ERROR';
    err.qbErrors = data.errors || null;
    throw err;
  }

  throw lastErr || new Error('QuickBooks request failed');
}

/**
 * Tokenize raw card details (server-side). Card data is never persisted.
 */
async function tokenizeCard(card) {
  const data = await qbRequest('POST', '/tokens', { card }, { requestId: crypto.randomUUID() });
  if (!data.value) throw new Error('Card tokenization failed');
  return data.value;
}

/**
 * Charge a tokenized card. Amount must be a server-derived string, e.g. "125.00".
 */
async function createCharge({ amountStr, currency = 'USD', token, description = '' }) {
  return qbRequest('POST', '/charges', {
    amount: amountStr,
    currency,
    token,
    capture: true,
    description: description.substring(0, 250),
    context: { mobile: false, isEcommerce: true }
  }, { requestId: crypto.randomUUID() });
}

async function getCharge(chargeId) {
  return qbRequest('GET', `/charges/${encodeURIComponent(chargeId)}`);
}

async function refundCharge(chargeId, amountStr, description = '') {
  return qbRequest('POST', `/charges/${encodeURIComponent(chargeId)}/refunds`, {
    amount: amountStr,
    description: description.substring(0, 250)
  }, { requestId: crypto.randomUUID() });
}

/* ─────────────────────────── Webhooks ─────────────────────────── */

/**
 * Verify the intuit-signature header: base64(HMAC-SHA256(rawBody, verifierToken)).
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const verifier = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN;
  if (!verifier || !signatureHeader || !rawBody) return false;
  const expected = crypto.createHmac('sha256', verifier).update(rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

module.exports = {
  isConfigured,
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  getConnection,
  getAccessToken,
  revokeConnection,
  tokenizeCard,
  createCharge,
  getCharge,
  refundCharge,
  verifyWebhookSignature,
  ENV
};
