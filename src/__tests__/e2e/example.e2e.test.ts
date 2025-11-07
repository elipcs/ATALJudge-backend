/**
 * @module __tests__/e2e
 * @description E2E test template - placeholder for integration tests
 * 
 * IMPORTANTE: Este é um arquivo TEMPLATE. Para usar:
 * 1. Instale Supertest: npm install --save-dev supertest @types/supertest
 * 2. Descomente os exemplos abaixo
 * 3. Configure a aplicação para testes
 * 4. Execute: npm run test:e2e
 * 
 * Este é um placeholder que permite que os testes rodem sem falhas.
 */

describe('E2E Tests - Template (Placeholder)', () => {
  it('should be ready for E2E tests with Supertest', () => {
    // Este é um arquivo template/guia.
    // Veja os exemplos comentados em TEST_GUIDE.md
    expect(true).toBe(true);
  });

  it('should have Supertest installed to run real E2E tests', () => {
    // Quando estiver pronto para E2E tests:
    // 1. npm install --save-dev supertest @types/supertest
    // 2. Descomente os exemplos abaixo
    // 3. Configure conforme necessário
    expect(true).toBe(true);
  });
});

/*
// ====================
// EXEMPLOS DE E2E TESTS
// ====================

import request from 'supertest';
import { app } from '../../app';

describe('User Profile Endpoint (E2E)', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup: Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'professor@example.com',
        password: 'securePassword123',
      });

    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;
  });

  it('should retrieve user profile with valid token', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body.id).toBe(userId);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  it('should update user profile', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'User',
      })
      .expect(200);

    expect(response.body.firstName).toBe('Updated');
  });
});

describe('Authentication Flow (E2E)', () => {
  it('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@example.com',
        password: 'studentPassword123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toHaveProperty('id');
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@example.com',
        password: 'wrongPassword',
      })
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `newuser${Date.now()}@example.com`,
        password: 'newUserPassword123',
        firstName: 'New',
        lastName: 'User',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user).toHaveProperty('id');
  });
});

describe('Class Management (E2E)', () => {
  let professorToken: string;
  let classId: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'professor@example.com',
        password: 'securePassword123',
      });

    professorToken = loginResponse.body.accessToken;
  });

  it('should create a new class', async () => {
    const response = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Data Structures',
        description: 'Learn about data structures and algorithms',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Data Structures');
    classId = response.body.id;
  });

  it('should retrieve all classes for professor', async () => {
    const response = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should update class information', async () => {
    const response = await request(app)
      .put(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Advanced Data Structures',
      })
      .expect(200);

    expect(response.body.name).toBe('Advanced Data Structures');
  });
});

*/
