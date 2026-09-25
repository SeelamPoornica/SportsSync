const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Landing page — redirect to dashboard if logged in
router.get('/', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('index', { title: 'Sports Scheduler — Welcome' });
});

// Main dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const { Session, Sport, User, SessionPlayer } = require('../models');
    const { Op } = require('sequelize');

    const now = new Date();

    // Sessions created by me
    const createdSessions = await Session.findAll({
      where: { creatorId: req.user.id },
      include: [
        { model: Sport, as: 'sport' },
        { model: SessionPlayer, as: 'sessionPlayers', include: [{ model: User, as: 'user' }] },
      ],
      order: [['dateTime', 'DESC']],
    });

    // Sessions I joined (but didn't create)
    const joinedRecords = await SessionPlayer.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Session,
          as: 'session',
          where: { creatorId: { [Op.ne]: req.user.id } },
          include: [
            { model: Sport, as: 'sport' },
            { model: User, as: 'creator' },
            { model: SessionPlayer, as: 'sessionPlayers', include: [{ model: User, as: 'user' }] },
          ],
        },
      ],
    });
    const joinedSessions = joinedRecords.map((r) => r.session).filter((session) => session && session.creatorId !== req.user.id);

    // Available sessions (not cancelled, future, and not already joined)
    const allJoinedRecords = await SessionPlayer.findAll({
      attributes: ['sessionId'],
      where: { userId: req.user.id },
    });
    const joinedSessionIds = allJoinedRecords.map((record) => record.sessionId);
    const available = await Session.findAll({
      where: {
        isCancelled: false,
        dateTime: { [Op.gt]: now },
        id: { [Op.notIn]: joinedSessionIds.length ? joinedSessionIds : [0] },
        additionalPlayersNeeded: { [Op.gt]: 0 },
      },
      include: [
        { model: Sport, as: 'sport' },
        { model: User, as: 'creator' },
        { model: SessionPlayer, as: 'sessionPlayers', include: [{ model: User, as: 'user' }] },
      ],
      order: [['dateTime', 'ASC']],
    });

    res.render('dashboard', {
      title: 'Dashboard — Sports Scheduler',
      createdSessions,
      joinedSessions,
      available,
      now,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/');
  }
});

module.exports = router;
