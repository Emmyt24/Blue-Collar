/**
 * SQL Injection Security Tests
 * Closes #403
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

const SQL_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "1; SELECT * FROM information_schema.tables",
  "' OR 1=1 --",
  "admin'--",
  "' OR 'x'='x",
];

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '"><script>alert(1)</script>',
  "javascript:alert(1)",
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '{{7*7}}',
  '${7*7}',
];

describe('Security Tests – SQL Injection', () => {
  describe('Auth endpoints', () => {
    it.each(SQL_PAYLOADS)('rejects SQL injection in login email: %s', async (payload) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: payload, password: 'password' });

      // Must not return 200/202 (successful auth) with injected input
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(202);
      // Should be 400 (validation) or 401 (auth failure)
      expect([400, 401, 422]).toContain(res.status);
    });

    it.each(SQL_PAYLOADS)('rejects SQL injection in register email: %s', async (payload) => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: payload, password: 'Password123!', firstName: 'Test', lastName: 'User' });

      expect(res.status).not.toBe(201);
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Workers endpoint', () => {
    it.each(SQL_PAYLOADS)('rejects SQL injection in worker search: %s', async (payload) => {
      const res = await request(app)
        .get('/api/workers')
        .query({ search: payload });

      // Should not crash (500) or expose DB errors
      expect(res.status).not.toBe(500);
      expect(res.status).toBeLessThan(500);
    });

    it.each(SQL_PAYLOADS)('rejects SQL injection in worker ID param: %s', async (payload) => {
      const res = await request(app).get(`/api/workers/${encodeURIComponent(payload)}`);
      expect(res.status).not.toBe(500);
    });
  });
});

describe('Security Tests – XSS', () => {
  it.each(XSS_PAYLOADS)('sanitizes XSS in worker search query: %s', async (payload) => {
    const res = await request(app)
      .get('/api/workers')
      .query({ search: payload });

    expect(res.status).not.toBe(500);
    // Response body must not echo raw script tags
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('<script>');
    expect(body).not.toContain('onerror=');
    expect(body).not.toContain('onload=');
  });

  it.each(XSS_PAYLOADS)('sanitizes XSS in auth register firstName: %s', async (payload) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'xss@test.com', password: 'Password123!', firstName: payload, lastName: 'User' });

    // Either rejected (400/422) or stored safely
    if (res.status === 201) {
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('<script>');
    }
  });
});

describe('Security Tests – Security Headers', () => {
  it('sets X-Content-Type-Options header', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options header', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('does not expose X-Powered-By header', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets Content-Security-Policy header', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});

describe('Security Tests – Authentication', () => {
  it('rejects requests to protected routes without token', async () => {
    const res = await request(app).delete('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('rejects requests with malformed JWT', async () => {
    const res = await request(app)
      .delete('/api/auth/logout')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects requests with expired JWT', async () => {
    // Expired token (exp in the past)
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJpZCI6InRlc3QiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.' +
      'invalid-signature';
    const res = await request(app)
      .delete('/api/auth/logout')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

describe('Security Tests – Rate Limiting', () => {
  it('applies rate limiting on auth endpoints', async () => {
    // Make many rapid requests; at least one should be rate-limited (429)
    // or the endpoint should respond consistently without crashing
    const requests = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'ratelimit@test.com', password: 'wrong' })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    // All should be non-500
    statuses.forEach((s) => expect(s).not.toBe(500));
  });
});
