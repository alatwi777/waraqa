import { createRemoteJWKSet, jwtVerify } from 'jose';
import { handleCloudRequest } from './server/cloud-service.mjs';

const keySets = new Map();
const reply = (error, status) => Response.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
function settings(env) {
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/^https:\/\//, '').replace(/\/$/, '');
  const audience = String(env.ACCESS_AUD || '').trim();
  const emails = new Set(String(env.ALLOWED_EMAILS || '').split(/[\s,]+/).filter(Boolean).map(s => s.toLowerCase()));
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team) || !audience || !emails.size) return null;
  return { issuer: 'https://' + team, audience, emails };
}
export function createExternalHandler({ keySetFor } = {}) {
  return async function fetch(request, env) {
    const config = settings(env);
    if (!config) return reply('setup_required', 503);
    // Access headers and client-supplied identity headers are untrusted until signature verification.
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) return reply('sign_in_required', 401);
    let identity;
    try {
      let keys;
      if (keySetFor) keys = keySetFor(config.issuer);
      else {
        if (!keySets.has(config.issuer)) keySets.set(config.issuer, createRemoteJWKSet(new URL(config.issuer + '/cdn-cgi/access/certs'), { timeoutDuration: 5000 }));
        keys = keySets.get(config.issuer);
      }
      const { payload } = await jwtVerify(token, keys, { issuer: config.issuer, audience: config.audience, algorithms: ['RS256'], requiredClaims: ['sub', 'email', 'exp', 'iat'] });
      if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 250 || typeof payload.email !== 'string') return reply('sign_in_required', 401);
      const email = payload.email.toLowerCase();
      if (!config.emails.has(email)) return reply('account_not_allowed', 403);
      identity = { id: 'cf:' + payload.sub, email };
    } catch { return reply('sign_in_required', 401); }
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const headers = new Headers(request.headers);
      headers.set('oai-authenticated-user-id', identity.id);
      headers.set('oai-authenticated-user-email', identity.email);
      return handleCloudRequest(new Request(request, { headers }), env);
    }
    if (!['GET', 'HEAD'].includes(request.method)) return reply('method_not_allowed', 405);
    if (!env.ASSETS) return reply('assets_unavailable', 503);
    return env.ASSETS.fetch(request);
  };
}
export default { fetch: createExternalHandler() };
