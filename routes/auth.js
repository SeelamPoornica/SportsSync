const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ensureGuest } = require('../middleware/auth');

// GET Sign Up
router.get('/signup', ensureGuest, (req, res) => {
  res.render('auth/signup', { title: 'Sign Up — Sports Scheduler' });
});

// POST Sign Up
router.post('/signup', ensureGuest, async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const role = req.body.role || 'player';
  try {
    if (!name || !email || !password) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/auth/signup');
    }
    if (!['admin', 'player'].includes(role)) {
      req.flash('error', 'Please choose Admin or Player.');
      return res.redirect('/auth/signup');
    }
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/signup');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/auth/signup');
    }
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      req.flash('error', 'An account with that email already exists.');
      return res.redirect('/auth/signup');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash, role });
    req.flash('success', 'Account created! Please sign in.');
    res.redirect('/auth/signin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/signup');
  }
});

// GET Sign In
router.get('/signin', ensureGuest, (req, res) => {
  res.render('auth/signin', { title: 'Sign In — Sports Scheduler' });
});

// POST Sign In
router.post('/signin', ensureGuest, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info?.message || 'Invalid credentials.');
      return res.redirect('/auth/signin');
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.flash('success', `Welcome back, ${user.name}!`);
      res.redirect('/dashboard');
    });
  })(req, res, next);
});

// POST Sign Out
router.post('/signout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been signed out.');
    res.redirect('/');
  });
});

// GET Sign Out (for convenience)
router.get('/signout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
