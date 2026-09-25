process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Routes', () => {
  describe('GET /auth/signup', () => {
    it('should return 200 for signup page', async () => {
      const res = await request(app).get('/auth/signup');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sign Up');
    });
  });

  describe('GET /auth/signin', () => {
    it('should return 200 for signin page', async () => {
      const res = await request(app).get('/auth/signin');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sign In');
    });
  });

  describe('POST /auth/signup', () => {
    it('should register a new user and redirect to signin', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Test Player',
        email: 'player@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        _csrf: 'test-token',
      });
      expect([302, 200]).toContain(res.status);
    });

    it('should preserve the selected admin role through sign-in', async () => {
      const email = 'new-admin@test.com';
      const signup = await request(app).post('/auth/signup').send({
        name: 'New Admin',
        email,
        role: 'admin',
        password: 'password123',
        confirmPassword: 'password123',
        _csrf: 'test-token',
      });
      expect(signup.status).toBe(302);
      expect((await User.findOne({ where: { email } })).role).toBe('admin');

      const adminAgent = request.agent(app);
      await adminAgent.post('/auth/signin').send({ email, password: 'password123', _csrf: 'test-token' });
      const adminPage = await adminAgent.get('/admin/sports');
      expect(adminPage.status).toBe(200);
    });

    it('should reject mismatched passwords', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Bad User',
        email: 'bad@test.com',
        password: 'password123',
        confirmPassword: 'different',
        _csrf: 'test-token',
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signup');
    });

    it('should reject short passwords', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Short Pass',
        email: 'short@test.com',
        password: '123',
        confirmPassword: '123',
        _csrf: 'test-token',
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signup');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/auth/signup').send({
        name: 'Dup User',
        email: 'dup@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        _csrf: 'test-token',
      });
      const res = await request(app).post('/auth/signup').send({
        name: 'Dup Again',
        email: 'dup@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        _csrf: 'test-token',
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signup');
    });
  });

  describe('POST /auth/signin', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/auth/signin').send({
        email: 'noone@nowhere.com',
        password: 'wrongpass',
        _csrf: 'test-token',
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signin');
    });
  });
});

describe('Protected Routes', () => {
  it('should redirect unauthenticated users from /dashboard to signin', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/auth/signin');
  });

  it('should redirect unauthenticated users from /sessions/new to signin', async () => {
    const res = await request(app).get('/sessions/new');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/auth/signin');
  });

  it('should redirect unauthenticated users from /admin/sports to signin', async () => {
    const res = await request(app).get('/admin/sports');
    expect(res.status).toBe(302);
  });
});
