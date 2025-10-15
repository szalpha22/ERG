require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const { db } = require('../src/database/init');

const app = express();
const PORT = 5000;

app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'cliphub-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const DOMAIN = process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
const CALLBACK_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/callback`
  : `http://localhost:${PORT}/auth/callback`;

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID || 'placeholder',
    clientSecret: process.env.CLIENT_SECRET || 'placeholder',
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!db) {
        return done(new Error('Database not initialized'), null);
      }
      const stmt = db.prepare('INSERT OR REPLACE INTO users (user_id, username, avatar) VALUES (?, ?, ?)');
      stmt.run(profile.id, profile.username, profile.avatar);
      
      return done(null, profile);
    } catch (error) {
      console.error('Discord auth error:', error);
      return done(error, null);
    }
  }
));

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.id === process.env.DEVELOPER_ID) {
    return next();
  }
  res.status(403).send('Unauthorized');
}

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const submissionRoutes = require('./routes/submissions');
const payoutRoutes = require('./routes/payouts');
const adminRoutes = require('./routes/admin');
const leaderboardRoutes = require('./routes/leaderboard');
const { startViewTracker } = require('../cron/viewTracker');

app.use('/auth', authRoutes);
app.use('/campaigns', isAuthenticated, campaignRoutes);
app.use('/submissions', isAuthenticated, submissionRoutes);
app.use('/payouts', isAuthenticated, payoutRoutes);
app.use('/admin', isAuthenticated, isAdmin, adminRoutes);
app.use('/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC LIMIT 6').all('active');
  res.render('pages/home', { user: req.user, campaigns });
});

app.get('/login', (req, res) => {
  res.render('pages/login', { user: null });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  const userStats = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_clips,
      SUM(CASE WHEN status = 'approved' THEN views ELSE 0 END) as total_views,
      COUNT(*) as total_submissions
    FROM submissions WHERE user_id = ?
  `).get(req.user.id);
  
  const payoutStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_earned,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payouts
    FROM payouts WHERE user_id = ?
  `).get(req.user.id);

  res.render('pages/dashboard', { user: req.user, userStats, payoutStats });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 ClipHub Website running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
  
  startViewTracker();
});

module.exports = app;
