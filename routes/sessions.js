const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { Session, Sport, User, SessionPlayer } = require('../models');
const { Op } = require('sequelize');

// GET /sessions/new — create session form
router.get('/new', ensureAdmin, async (req, res) => {
  try {
    const sports = await Sport.findAll({ order: [['name', 'ASC']] });
    if (!sports.length) {
      req.flash('error', 'No sports available. Ask an admin to create sports first.');
      return res.redirect('/dashboard');
    }
    res.render('sessions/create', { title: 'Create Session — Sports Scheduler', sports });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load session form.');
    res.redirect('/dashboard');
  }
});

// POST /sessions — create new session
router.post('/', ensureAdmin, async (req, res) => {
  const { sportId, dateTime, venue, additionalPlayersNeeded } = req.body;
  try {
    if (!sportId || !dateTime || !venue) {
      req.flash('error', 'Sport, date/time, and venue are required.');
      return res.redirect('/sessions/new');
    }
    const openSlots = Number(additionalPlayersNeeded);
    if (!Number.isInteger(openSlots) || openSlots < 1 || openSlots > 50) {
      req.flash('error', 'Choose between 1 and 50 open player slots.');
      return res.redirect('/sessions/new');
    }
    const dt = new Date(dateTime);
    if (dt <= new Date()) {
      req.flash('error', 'Session date/time must be in the future.');
      return res.redirect('/sessions/new');
    }
    await Session.create({
      sportId: parseInt(sportId),
      creatorId: req.user.id,
      dateTime: dt,
      venue: venue.trim(),
      teamAPlayers: [],
      teamBPlayers: [],
      additionalPlayersNeeded: openSlots,
    });
    req.flash('success', 'Session created successfully!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to create session.');
    res.redirect('/sessions/new');
  }
});

// GET /sessions/:id — session detail
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id, {
      include: [
        { model: Sport, as: 'sport' },
        { model: User, as: 'creator' },
        { model: SessionPlayer, as: 'sessionPlayers', include: [{ model: User, as: 'user' }] },
      ],
    });
    if (!session) {
      req.flash('error', 'Session not found.');
      return res.redirect('/dashboard');
    }
    const hasJoined = session.sessionPlayers.some((sp) => sp.userId === req.user.id);
    const isPast = new Date(session.dateTime) < new Date();
    res.render('sessions/detail', {
      title: `${session.sport?.name || 'Session'} — Sports Scheduler`,
      session,
      hasJoined,
      isPast,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load session.');
    res.redirect('/dashboard');
  }
});

// POST /sessions/:id/join — join a session
router.post('/:id/join', ensureAuthenticated, async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id, {
      include: [{ model: SessionPlayer, as: 'sessionPlayers' }],
    });
    if (!session) {
      req.flash('error', 'Session not found.');
      return res.redirect('/dashboard');
    }
    if (session.isCancelled) {
      req.flash('error', 'This session has been cancelled.');
      return res.redirect('/dashboard');
    }
    if (new Date(session.dateTime) <= new Date()) {
      req.flash('error', 'Cannot join a past session.');
      return res.redirect('/dashboard');
    }
    const alreadyJoined = session.sessionPlayers.some((sp) => sp.userId === req.user.id);
    if (alreadyJoined) {
      req.flash('error', 'You have already joined this session.');
      return res.redirect('/dashboard');
    }
    if (session.additionalPlayersNeeded <= 0) {
      req.flash('error', 'No more slots available.');
      return res.redirect('/dashboard');
    }

    // Overlapping session check
    const mySessionIds = (
      await SessionPlayer.findAll({ where: { userId: req.user.id } })
    ).map((sp) => sp.sessionId);

    const overlap = await Session.findOne({
      where: {
        [Op.or]: [
          { id: { [Op.in]: mySessionIds.length ? mySessionIds : [0] } },
          { creatorId: req.user.id, id: { [Op.ne]: session.id } },
        ],
        dateTime: session.dateTime,
        isCancelled: false,
      },
    });
    if (overlap) {
      req.flash('error', 'You already have a session at that date and time!');
      return res.redirect('/dashboard');
    }

    await SessionPlayer.create({ sessionId: session.id, userId: req.user.id });
    await session.update({ additionalPlayersNeeded: session.additionalPlayersNeeded - 1 });
    req.flash('success', 'You have joined the session!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to join session.');
    res.redirect('/dashboard');
  }
});

// POST /sessions/:id/cancel — cancel a session (creator only)
router.post('/:id/cancel', ensureAdmin, async (req, res) => {
  const { cancelReason } = req.body;
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) {
      req.flash('error', 'Session not found.');
      return res.redirect('/dashboard');
    }
    if (!cancelReason || !cancelReason.trim()) {
      req.flash('error', 'Please provide a reason for cancellation.');
      return res.redirect(`/sessions/${session.id}`);
    }
    if (session.isCancelled) {
      req.flash('error', 'Session is already cancelled.');
      return res.redirect('/dashboard');
    }
    await session.update({
      isCancelled: true,
      cancelReason: cancelReason.trim(),
    });
    req.flash('success', 'Session cancelled successfully.');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to cancel session.');
    res.redirect('/dashboard');
  }
});

module.exports = router;
