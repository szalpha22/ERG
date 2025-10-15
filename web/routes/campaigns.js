const express = require('express');
const router = express.Router();
const { db } = require('../../src/database/init');

router.get('/', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  res.render('pages/campaigns', { user: req.user, campaigns });
});

router.post('/join/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;
    
    const existing = db.prepare('SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
      .get(campaignId, userId);
    
    if (existing) {
      return res.json({ success: false, message: 'Already joined this campaign' });
    }
    
    const stmt = db.prepare('INSERT INTO campaign_members (campaign_id, user_id) VALUES (?, ?)');
    stmt.run(campaignId, userId);
    
    res.json({ success: true, message: 'Successfully joined campaign!' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to join campaign' });
  }
});

router.post('/leave/:id', async (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?');
    stmt.run(req.params.id, req.user.id);
    
    res.json({ success: true, message: 'Successfully left campaign' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to leave campaign' });
  }
});

module.exports = router;
