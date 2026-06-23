import { test, expect } from '@playwright/test';

test.describe('Enterprise Core Features', () => {
  
  test('Centralized Error Handler (Zod 400)', async ({ request }) => {
    // Hit the dummy auth endpoint to trigger Zod validation error bypassing authentication middleware
    const response = await request.post('/api/auth/test-zod', {
      data: {} // Empty body to trigger validation error
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    
    // Assert standardized ValidationError format returned by error-handler.ts
    expect(body.status).toBe('error');
    expect(body.statusCode).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body).toHaveProperty('errors');
    expect(Array.isArray(body.errors)).toBeTruthy();
    
    if (body.errors.length > 0) {
      expect(body.errors[0]).toHaveProperty('field');
      expect(body.errors[0]).toHaveProperty('message');
    }
  });

  test('Centralized Error Handler (Masking 500)', async ({ request }) => {
    // Hit the temporary testing endpoint that throws a generic Error
    const response = await request.get('/api/auth/test-fatal');
    
    expect(response.status()).toBe(500);
    const body = await response.json();
    
    // Assert 500 is masked from client by error-handler.ts
    expect(body.status).toBe('error');
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('An unexpected internal error occurred.');
    
    // Ensure the secret error message is NOT leaked to the client
    const bodyString = JSON.stringify(body);
    expect(bodyString).not.toContain('SECRET_DATABASE_CRASH');
  });

  test('Centralized Error Handler (401 Unauthorized)', async ({ request }) => {
    // Hit a protected endpoint without auth token
    const response = await request.get('/api/properties');
    
    expect(response.status()).toBe(401);
    
    // Must parse as JSON, not HTML
    const body = await response.json();
    
    expect(body.status).toBe('error');
    expect(body.statusCode).toBe(401);
    expect(typeof body.message).toBe('string');
  });

  test('Pagination Wrapper (Success format)', async ({ request }) => {
    // Hit a dummy paginated list endpoint that bypasses auth
    const response = await request.get('/api/auth/test-pagination?page=1&limit=10');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    
    // strictly match `{ status: 'success', statusCode: 200, data: { data: [...], meta: {...} } }`
    expect(body.status).toBe('success');
    expect(body.statusCode).toBe(200);
    expect(body).toHaveProperty('message');
    
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('data');
    expect(Array.isArray(body.data.data)).toBeTruthy();
    
    expect(body.data).toHaveProperty('meta');
    expect(body.data.meta).toHaveProperty('currentPage');
    expect(body.data.meta).toHaveProperty('totalPages');
    expect(body.data.meta).toHaveProperty('totalItems');
  });
});
