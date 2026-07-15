/**
 * OAuth provider config — each provider activates only when its client
 * id/secret env vars are present. Uses standard OIDC endpoints (Google,
 * Microsoft) with the authorization-code + PKCE flow. No secrets hardcoded.
 */
const SERVER_BASE = process.env.OAUTH_REDIRECT_BASE || `http://localhost:${process.env.PORT || 4000}`;
const MS_TENANT = process.env.MICROSOFT_TENANT || 'common';

const PROVIDERS = {
  google: {
    clientId:     process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:     'https://oauth2.googleapis.com/token',
    scope:        'openid email profile',
    extraAuthParams: { access_type: 'offline', prompt: 'select_account' },
  },
  microsoft: {
    clientId:     process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizeUrl: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize`,
    tokenUrl:     `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
    scope:        'openid email profile',
    extraAuthParams: { prompt: 'select_account' },
  },
};

function isProviderConfigured(provider) {
  const p = PROVIDERS[provider];
  return !!(p && p.clientId && p.clientSecret);
}

function redirectUri(provider) {
  return `${SERVER_BASE}/api/auth/oauth/${provider}/callback`;
}

function enabledProviders() {
  return Object.keys(PROVIDERS).reduce((acc, k) => { acc[k] = isProviderConfigured(k); return acc; }, {});
}

module.exports = { PROVIDERS, isProviderConfigured, redirectUri, enabledProviders, SERVER_BASE };
