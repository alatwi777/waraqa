import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { createExternalHandler } from '../worker.mjs';

const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256' };
const keys = createLocalJWKSet({ keys: [jwk] });
const handle = createExternalHandler({ keySetFor: () => keys });
const config = { ACCESS_TEAM_DOMAIN: 'test-team.cloudflareaccess.com', ACCESS_AUD: 'test-audience', ALLOWED_EMAILS: 'teacher@example.test' };
let assetCalls = 0, observedId;
const env = { ...config, ASSETS: { fetch: async () => { assetCalls++; return new Response('asset'); } }, DB: { prepare() { return { bind(id) { observedId = id; return { first: async () => null }; } }; } } };
async function token({ email = 'teacher@example.test', subject = 'teacher-id', audience = config.ACCESS_AUD, issuer = 'https://' + config.ACCESS_TEAM_DOMAIN, expiry = '1h', signingKey = privateKey } = {}) {
  return new SignJWT({ email }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setSubject(subject).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(expiry).sign(signingKey);
}
const request = (path = '/', jwt = null, headers = {}) => new Request('https://waraqa.example.test' + path, { headers: { ...(jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}), ...headers } });
assert.equal((await handle(request(), env)).status, 401);
assert.equal((await handle(request('/', null, { 'oai-authenticated-user-id': 'forged', 'oai-authenticated-user-email': 'teacher@example.test' }), env)).status, 401);
assert.equal(assetCalls, 0);
assert.equal((await handle(request('/', await token()), {})).status, 503);
assert.equal((await handle(request('/', 'unsigned.jwt.value'), env)).status, 401);
assert.equal((await handle(request('/', await token({ expiry: '-1m' })), env)).status, 401);
assert.equal((await handle(request('/', await token({ issuer: 'https://attacker.example.test' })), env)).status, 401);
assert.equal((await handle(request('/', await token({ audience: 'different-app' })), env)).status, 401);
assert.equal((await handle(request('/', await token({ email: 'other@example.test' })), env)).status, 403);
const other = await generateKeyPair('RS256');
assert.equal((await handle(request('/', await token({ signingKey: other.privateKey })), env)).status, 401);
const jwt = await token();
assert.equal((await handle(request('/', jwt), env)).status, 200);
assert.equal(assetCalls, 1);
const response = await handle(request('/api/state', jwt, { 'oai-authenticated-user-id': 'forged' }), env);
assert.equal(response.status, 200);
assert.equal((await response.json()).user.id, 'cf:teacher-id');
assert.equal(observedId, 'cf:teacher-id');
assert.equal((await handle(request('/api/state', jwt, { 'x-waraqa-account': 'different-user' }), env)).status, 401);
assert.equal((await handle(new Request('https://waraqa.example.test/api/state', { method: 'PUT', headers: { 'Cf-Access-Jwt-Assertion': jwt, 'x-waraqa-account': 'cf:teacher-id', origin: 'https://attacker.example.test' }, body: '{}' }), env)).status, 403);
console.log('PASS: external Access signature/issuer/audience/expiry/email enforcement; deny-before-assets; setup guard; forged identity overwritten; account isolation and same-origin writes.');
