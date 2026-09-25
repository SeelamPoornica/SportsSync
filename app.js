require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const path = require('path');
const csrf = require('csurf');

const { sequelize } = require('./models');
const { User } = require('./models');
const configurePassport = require('./config/passport');

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const sessionsRouter = require('./routes/sessions');
const profileRouter = require('./routes/profile');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sports-scheduler-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Passport
configurePassport(passport, User);
app.use(passport.initialize());
app.use(passport.session());

// Flash
app.use(flash());

// CSRF — skip in test
const csrfProtection = csrf({ cookie: false });
if (process.env.NODE_ENV !== 'test') {
  app.use(csrfProtection);
}

// Locals available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  if (process.env.NODE_ENV !== 'test') {
    res.locals.csrfToken = req.csrfToken();
  } else {
    res.locals.csrfToken = 'test-token';
  }
  next();
});

// Mount routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/sessions', sessionsRouter);
app.use('/profile', profileRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 — Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Form expired or invalid CSRF token. Please try again.');
    return res.redirect('back');
  }
  console.error(err.stack);
  res.status(500).render('error', { title: 'Server Error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  sequelize
    .sync({ alter: process.env.NODE_ENV === 'development' })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Sports Scheduler running at http://localhost:${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch((err) => {
      console.error('Unable to connect to database:', err);
      process.exit(1);
    });
}

module.exports = app;
