const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { PROVIDERS, isProviderConfigured, redirectUri, enabledProviders } = require('../config/oauth');
const clientAuthService = require('../services/clientAuthService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function decodeIdToken(idToken) {
  // The id_token comes directly from the provider's token endpoint over TLS
  // (not via the browser), so decoding the payload is safe for this flow.
  const payload = idToken.split('.')[1];
  return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

/** GET /api/auth/methods — which client login methods are enabled. */
exports.methods = (_req, res) => {
  res.json({ otp: true, providers: enabledProviders() });
};

/** GET /api/auth/oauth/:provider — begin the OAuth (code + PKCE) flow. */
exports.start = (req, res) => {
  const provider = req.params.provider;
  if (!isProviderConfigured(provider)) {
    return res.redirect(`${CLIENT_URL}/client-portal/login?oauth=unavailable`);
  }
  const cfg = PROVIDERS[provider];
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const nonce = b64url(crypto.randomBytes(16));
  const state = jwt.sign({ provider, verifier, nonce, purpose: 'oauth' }, JWT_SECRET, { expiresIn: '10m' });

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(provider),
    response_type: 'code',
    scope: cfg.scope,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...(cfg.extraAuthParams || {}),
  });
  res.redirect(`${cfg.authorizeUrl}?${params.toString()}`);
};

/** GET /api/auth/oauth/:provider/callback — exchange code, link/create client, session. */
exports.callback = async (req, res) => {
  const provider = req.params.provider;
  const fail = (reason) => res.redirect(`${CLIENT_URL}/client-portal/login?oauth=${reason}`);

  try {
    if (!isProviderConfigured(provider)) return fail('unavailable');
    const { code, state } = req.query;
    if (!code || !state) return fail('error');

    let decoded;
    try {
      decoded = jwt.verify(state, JWT_SECRET);
    } catch (e) {
      // Usually means `start` and this `callback` ran against different servers
      // /JWT secrets (e.g. a prod build's API started the flow but Google's
      // redirect URI points here), or the 10-min state window elapsed.
      console.error(`OAuth ${provider} state verify failed: ${e.name} ${e.message}`);
      return fail('invalid_state');
    }
    if (decoded.purpose !== 'oauth' || decoded.provider !== provider) {
      console.error(`OAuth ${provider} state mismatch (purpose=${decoded.purpose}, provider=${decoded.provider})`);
      return fail('invalid_state');
    }

    const cfg = PROVIDERS[provider];
    const body = new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(provider),
      code_verifier: decoded.verifier,
    });
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });
    const tokens = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokens.id_token) {
      console.error(`OAuth ${provider} token exchange failed:`, tokens.error || tokenRes.status);
      return fail('error');
    }

    const claims = decodeIdToken(tokens.id_token);
    if (decoded.nonce && claims.nonce && claims.nonce !== decoded.nonce) return fail('invalid_state');

    const email = (claims.email || '').toLowerCase();
    if (!email) return fail('no_email');

    const firstName = claims.given_name || (claims.name || '').split(' ')[0] || 'New';
    const lastName = claims.family_name || (claims.name || '').split(' ').slice(1).join(' ') || 'Client';

    await clientAuthService.loginClientByIdentity(res, {
      email, firstName, lastName,
      provider, providerId: claims.sub, image: claims.picture || null, method: provider,
    });

    return res.redirect(`${CLIENT_URL}/client-portal/dashboard`);
  } catch (err) {
    console.error(`OAuth ${provider} callback error:`, err.message);
    return fail('error');
  }
};
