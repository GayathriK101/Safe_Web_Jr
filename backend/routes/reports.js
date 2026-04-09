const express = require('express');
const router = express.Router();

router.post('/generate-summary', async (req, res) => {
  try {
    const { activityData, childName } = req.body;
    
    if (!activityData || !childName) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }
    
    const siteVisits = activityData.filter(a => 
      a.type === 'SITE_VISIT').length;
    const flagged = activityData.filter(a => 
      a.type === 'CONTENT_FLAGGED').length;
    const blocked = activityData.filter(a => 
      a.type === 'SITE_BLOCKED' || 
      a.type === 'SEARCH_BLOCKED').length;
    const panics = activityData.filter(a => 
      a.type === 'PANIC').length;

    const score = Math.max(1, Math.min(10, 
      10 - (flagged * 0.5) - (blocked * 1) - 
      (panics * 2)));
    const roundedScore = Math.round(score);

    let summary = "";
    
    if (roundedScore >= 8) {
      summary = `📊 Weekly Summary for ${childName}\n\n`;
      summary += `🌟 ${childName} had an excellent week online! `;
      summary += `They visited ${siteVisits} sites with great browsing habits.\n\n`;
      summary += `✅ No major concerns this week!\n\n`;
      summary += `🎯 Recommendations:\n`;
      summary += `1. Keep up the amazing safe browsing habits!\n`;
      summary += `2. Add more educational sites to recommended list.\n`;
      summary += `3. Consider increasing screen time as a reward.\n\n`;
      summary += `⭐ Overall Score: ${roundedScore}/10 — Outstanding! 🏆`;
    } else if (roundedScore >= 6) {
      summary = `📊 Weekly Summary for ${childName}\n\n`;
      summary += `😊 ${childName} had a good week overall! `;
      summary += `They visited ${siteVisits} sites this week.\n\n`;
      if (blocked > 0) {
        summary += `⚠️ ${blocked} inappropriate searches were blocked.\n\n`;
      }
      summary += `💪 Good effort staying safe online!\n\n`;
      summary += `🎯 Recommendations:\n`;
      summary += `1. Have a friendly chat about safe browsing.\n`;
      summary += `2. Encourage more time on educational sites.\n`;
      summary += `3. Keep monitoring screen time limits.\n\n`;
      summary += `⭐ Overall Score: ${roundedScore}/10 — Good job! 😊`;
    } else {
      summary = `📊 Weekly Summary for ${childName}\n\n`;
      summary += `💙 ${childName} had a challenging week online. `;
      summary += `They visited ${siteVisits} sites this week.\n\n`;
      if (blocked > 0) {
        summary += `⚠️ ${blocked} blocked attempts need attention.\n`;
      }
      if (flagged > 0) {
        summary += `🚨 Content was flagged ${flagged} times.\n\n`;
      }
      summary += `🌈 Every day is a new opportunity to do better!\n\n`;
      summary += `🎯 Recommendations:\n`;
      summary += `1. Have an open conversation about online safety.\n`;
      summary += `2. Consider reducing screen time temporarily.\n`;
      summary += `3. Add more supervised browsing sessions.\n\n`;
      summary += `⭐ Overall Score: ${roundedScore}/10 — Keep improving! 💪`;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({ 
      summary,
      stats: { siteVisits, flagged, blocked, panics }
    });

  } catch (error) {
    console.error('Summary error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate summary: ' + error.message 
    });
  }
});

module.exports = router;
