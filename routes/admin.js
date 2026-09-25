const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middleware/auth');
const { Sport, Session, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// GET /admin/sports — list all sports
router.get('/sports', ensureAdmin, async (req, res) => {
  try {
    const sports = await Sport.findAll({
      include: [{ model: User, as: 'creator' }],
      order: [['createdAt', 'DESC']],
    });
    res.render('admin/sports', { title: 'Manage Sports — Admin', sports });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load sports.');
    res.redirect('/dashboard');
  }
});

// GET /admin/sports/new
router.get('/sports/new', ensureAdmin, (req, res) => {
  res.render('admin/sport-form', { title: 'Create Sport — Admin', sport: null });
});

// POST /admin/sports
router.post('/sports', ensureAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    if (!name || !name.trim()) {
      req.flash('error', 'Sport name is required.');
      return res.redirect('/admin/sports/new');
    }
    await Sport.create({ name: name.trim(), createdById: req.user.id });
    req.flash('success', `Sport "${name.trim()}" created successfully.`);
    res.redirect('/admin/sports');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      req.flash('error', 'A sport with that name already exists.');
    } else {
      req.flash('error', 'Failed to create sport.');
    }
    res.redirect('/admin/sports/new');
  }
});

// GET /admin/sports/:id/edit
router.get('/sports/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      req.flash('error', 'Sport not found.');
      return res.redirect('/admin/sports');
    }
    res.render('admin/sport-form', { title: 'Edit Sport — Admin', sport });
  } catch (err) {
    req.flash('error', 'Failed to load sport.');
    res.redirect('/admin/sports');
  }
});

// POST /admin/sports/:id/edit
router.post('/sports/:id/edit', ensureAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      req.flash('error', 'Sport not found.');
      return res.redirect('/admin/sports');
    }
    if (!name || !name.trim()) {
      req.flash('error', 'Sport name is required.');
      return res.redirect(`/admin/sports/${req.params.id}/edit`);
    }
    await sport.update({ name: name.trim() });
    req.flash('success', 'Sport updated successfully.');
    res.redirect('/admin/sports');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      req.flash('error', 'A sport with that name already exists.');
    } else {
      req.flash('error', 'Failed to update sport.');
    }
    res.redirect(`/admin/sports/${req.params.id}/edit`);
  }
});

// GET /admin/reports
router.get('/reports', ensureAdmin, async (req, res) => {
  try {
    const allowedDays = [7, 14, 30, 60, 90];
    const days = allowedDays.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const hasCustomRange = Boolean(req.query.startDate || req.query.endDate);
    let since;
    let until = new Date();
    if (hasCustomRange) {
      since = new Date(`${req.query.startDate}T00:00:00`);
      const endDate = new Date(`${req.query.endDate}T00:00:00`);
      if (!req.query.startDate || !req.query.endDate || Number.isNaN(since.getTime()) || Number.isNaN(endDate.getTime()) || since > endDate) {
        req.flash('error', 'Choose a valid start and end date for the report.');
        return res.redirect('/admin/reports');
      }
      endDate.setDate(endDate.getDate() + 1);
      until = endDate > until ? new Date() : endDate;
    } else {
      since = new Date();
      since.setDate(since.getDate() - days);
    }

    // Sessions played (not cancelled) in the time window
    const sessions = await Session.findAll({
      where: {
        isCancelled: false,
        dateTime: { [Op.gte]: since, [Op.lt]: until },
      },
      include: [{ model: Sport, as: 'sport' }],
    });

    // Group by sport
    const sportMap = {};
    for (const s of sessions) {
      const sportName = s.sport ? s.sport.name : 'Unknown';
      sportMap[sportName] = (sportMap[sportName] || 0) + 1;
    }

    const reportData = Object.entries(sportMap)
      .map(([sport, count]) => ({ sport, count }))
      .sort((a, b) => b.count - a.count);

    const total = reportData.reduce((sum, r) => sum + r.count, 0);

    res.render('admin/reports', {
      title: 'Analytics Reports — Admin',
      reportData,
      total,
      days,
      since,
      until,
      customStartDate: hasCustomRange ? req.query.startDate : '',
      customEndDate: hasCustomRange ? req.query.endDate : '',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to generate report.');
    res.redirect('/dashboard');
  }
});

module.exports = router;
