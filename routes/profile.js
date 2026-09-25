const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../middleware/auth');
const { User } = require('../models');

// GET /profile/settings
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('profile/settings', { title: 'Account Settings — Sports Scheduler' });
});

// POST /profile/settings — change password
router.post('/settings', ensureAuthenticated, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  try {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/profile/settings');
    }
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/profile/settings');
    }
    if (newPassword !== confirmNewPassword) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/profile/settings');
    }
    if (newPassword.length < 6) {
      req.flash('error', 'New password must be at least 6 characters.');
      return res.redirect('/profile/settings');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });
    req.flash('success', 'Password updated successfully!');
    res.redirect('/profile/settings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update password.');
    res.redirect('/profile/settings');
  }
});

module.exports = router;
