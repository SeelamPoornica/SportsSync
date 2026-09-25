process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../app');
const { sequelize, User, Sport, Session, SessionPlayer } = require('../models');
const bcrypt = require('bcryptjs');

let agent;
let adminAgent;
let testSportId;
let testPlayerId;
let testAdminId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Create a player user
  const hash = await bcrypt.hash('password123', 10);
  const player = await User.create({ name: 'Session Player', email: 'splayer@test.com', passwordHash: hash, role: 'player' });
  testPlayerId = player.id;

  // Create an admin
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await User.create({ name: 'Admin User', email: 'sadmin@test.com', passwordHash: adminHash, role: 'admin' });
  testAdminId = admin.id;

  // Create a sport as admin
  const sport = await Sport.create({ name: 'Football', createdById: admin.id });
  testSportId = sport.id;

  // Player agent
  agent = request.agent(app);
  await agent.post('/auth/signin').send({ email: 'splayer@test.com', password: 'password123', _csrf: 'test-token' });

  // Admin agent
  adminAgent = request.agent(app);
  await adminAgent.post('/auth/signin').send({ email: 'sadmin@test.com', password: 'admin123', _csrf: 'test-token' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Sessions Routes', () => {
  describe('GET /sessions/new', () => {
    it('should allow admin and deny player access to the session create form', async () => {
      expect((await adminAgent.get('/sessions/new')).status).toBe(200);
      const res = await agent.get('/sessions/new');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  describe('POST /sessions', () => {
    it('should create a new session', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const res = await adminAgent.post('/sessions').send({
        sportId: testSportId,
        dateTime: future.toISOString().slice(0, 16),
        venue: 'Test Venue',
        additionalPlayersNeeded: 2,
        _csrf: 'test-token',
      });
      expect([302, 200]).toContain(res.status);
      const created = await Session.findOne({ where: { venue: 'Test Venue' } });
      expect(created.creatorId).toBe(testAdminId);
      expect(created.teamAPlayers).toEqual([]);
      expect(created.teamBPlayers).toEqual([]);
    });

    it('should block players from creating sessions', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const res = await agent.post('/sessions').send({
        sportId: testSportId,
        dateTime: future.toISOString().slice(0, 16),
        venue: 'Player Must Not Create',
        additionalPlayersNeeded: 2,
        _csrf: 'test-token',
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
      expect(await Session.findOne({ where: { venue: 'Player Must Not Create' } })).toBeNull();
    });

    it('should reject session with past date', async () => {
      const past = new Date('2020-01-01T10:00');
      const res = await adminAgent.post('/sessions').send({
        sportId: testSportId,
        dateTime: past.toISOString().slice(0, 16),
        venue: 'Old Venue',
        additionalPlayersNeeded: 1,
        _csrf: 'test-token',
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/sessions/new');
    });
  });

  it('allows admins to cancel sessions with a reason and blocks players', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const createResponse = await adminAgent.post('/sessions').send({
      sportId: testSportId,
      dateTime: future.toISOString().slice(0, 16),
      venue: 'Player Created Venue',
      additionalPlayersNeeded: 1,
      _csrf: 'test-token',
    });
    expect(createResponse.status).toBe(302);
    const session = await Session.findOne({ where: { venue: 'Player Created Venue' } });

    const missingReason = await adminAgent.post(`/sessions/${session.id}/cancel`).send({ _csrf: 'test-token' });
    expect(missingReason.status).toBe(302);
    expect((await Session.findByPk(session.id)).isCancelled).toBe(false);

    const playerAttempt = await agent.post(`/sessions/${session.id}/cancel`).send({ cancelReason: 'Weather', _csrf: 'test-token' });
    expect(playerAttempt.status).toBe(302);
    const stillActive = await Session.findByPk(session.id);
    expect(stillActive.isCancelled).toBe(false);

    const cancelled = await adminAgent.post(`/sessions/${session.id}/cancel`).send({ cancelReason: 'Weather', _csrf: 'test-token' });
    expect(cancelled.status).toBe(302);
    const saved = await Session.findByPk(session.id);
    expect(saved.isCancelled).toBe(true);
    expect(saved.cancelReason).toBe('Weather');
  });

  it('blocks joining two sessions at the exact same time', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const dateTime = future.toISOString().slice(0, 16);
    await adminAgent.post('/sessions').send({
      sportId: testSportId, dateTime, venue: 'Overlap One', additionalPlayersNeeded: 2, _csrf: 'test-token',
    });
    await adminAgent.post('/sessions').send({
      sportId: testSportId, dateTime, venue: 'Overlap Two', additionalPlayersNeeded: 2, _csrf: 'test-token',
    });
    const first = await Session.findOne({ where: { venue: 'Overlap One' } });
    const second = await Session.findOne({ where: { venue: 'Overlap Two' } });
    expect((await agent.post(`/sessions/${first.id}/join`).send({ _csrf: 'test-token' })).status).toBe(302);
    expect((await agent.post(`/sessions/${second.id}/join`).send({ _csrf: 'test-token' })).status).toBe(302);
    expect(await SessionPlayer.count({ where: { sessionId: second.id, userId: testPlayerId } })).toBe(0);
  });

  it('shows sessions with open slots and allows the admin creator and players to join', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 4);
    await adminAgent.post('/sessions').send({
      sportId: testSportId,
      dateTime: future.toISOString().slice(0, 16),
      venue: 'Open Join Venue',
      additionalPlayersNeeded: 2,
      _csrf: 'test-token',
    });
    const session = await Session.findOne({ where: { venue: 'Open Join Venue' } });

    expect((await adminAgent.get('/dashboard')).text).toContain('Open Join Venue');
    expect((await agent.get('/dashboard')).text).toContain('Open Join Venue');
    expect((await adminAgent.post(`/sessions/${session.id}/join`).send({ _csrf: 'test-token' })).status).toBe(302);
    expect((await agent.post(`/sessions/${session.id}/join`).send({ _csrf: 'test-token' })).status).toBe(302);
    expect((await Session.findByPk(session.id)).additionalPlayersNeeded).toBe(0);
  });
});

describe('Admin Routes', () => {
  describe('GET /admin/sports', () => {
    it('should allow admin to view sports list', async () => {
      const res = await adminAgent.get('/admin/sports');
      expect(res.status).toBe(200);
    });

    it('should block player from admin sports', async () => {
      const res = await agent.get('/admin/sports');
      expect(res.status).toBe(302);
    });
  });

  describe('POST /admin/sports', () => {
    it('should allow admin to create a sport', async () => {
      const res = await adminAgent.post('/admin/sports').send({
        name: 'Basketball',
        _csrf: 'test-token',
      });
      expect([302, 200]).toContain(res.status);
    });
  });

  describe('GET /admin/reports', () => {
    it('should allow admin to view reports', async () => {
      const res = await adminAgent.get('/admin/reports');
      expect(res.status).toBe(200);
    });

    it('should block player from reports', async () => {
      const res = await agent.get('/admin/reports');
      expect(res.status).toBe(302);
    });
  });
});
