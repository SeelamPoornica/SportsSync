// Auth guard middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please sign in to continue.');
  res.redirect('/auth/signin');
};

const ensureAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Please sign in to continue.');
    return res.redirect('/auth/signin');
  }
  if (req.user.role === 'admin') return next();
  req.flash('error', 'Access denied. Admins only.');
  res.redirect('/dashboard');
};

const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.redirect('/dashboard');
};

module.exports = { ensureAuthenticated, ensureAdmin, ensureGuest };
