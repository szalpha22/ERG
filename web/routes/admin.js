const express = require('express');
const router = express.Router();
const { db } = require('../../src/database/init');

router.get('/', (req, res) => {
  const stats = {
    campaigns: db.prepare('SELECT COUNT(*) as count FROM campaigns').get(),
    submissions: db.prepare('SELECT COUNT(*) as count FROM submissions').get(),
    payouts: db.prepare('SELECT COUNT(*) as count FROM payouts WHERE status = "pending"').get()
  };
  
  res.render('pages/admin', { user: req.user, stats });
});

router.post('/campaigns/add', async (req, res) => {
  try {
    const { name, description, type, platforms, rate_per_1k } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO campaigns (name, description, type, platforms, rate_per_1k, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    stmt.run(name, description, type, JSON.stringify(platforms.split(',')), rate_per_1k);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/payouts/approve/:id', async (req, res) => {
  try {
    const stmt = db.prepare('UPDATE payouts SET status = "approved" WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/payouts/reject/:id', async (req, res) => {
  try {
    const stmt = db.prepare('UPDATE payouts SET status = "rejected" WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
