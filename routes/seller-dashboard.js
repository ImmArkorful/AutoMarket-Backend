const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

router.use(authenticateToken);

// Get dashboard stats for the authenticated seller
router.get("/", async (req, res) => {
  const sellerId = req.user.userId;

  try {
    // Get active listings count
    const activeListingsResult = await db.query(
      "SELECT COUNT(*) as count FROM cars WHERE seller_id = $1 AND status = 'active'",
      [sellerId]
    );
    const activeListings = parseInt(activeListingsResult.rows[0].count, 10);

    // Get total listings count
    const totalListingsResult = await db.query(
      "SELECT COUNT(*) as count FROM cars WHERE seller_id = $1",
      [sellerId]
    );
    const totalListings = parseInt(totalListingsResult.rows[0].count, 10);

    // Get inquiries/leads count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const leadsResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE seller_id = $1 AND created_at >= $2",
      [sellerId, thirtyDaysAgo.toISOString()]
    );
    const leads = parseInt(leadsResult.rows[0].count, 10);

    // For views, we'll use a placeholder since we don't have a views tracking table yet
    // In a real app, you'd track views in a separate table
    const views = 0; // Placeholder

    res.json({
      activeListings,
      totalListings,
      views,
      leads,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

module.exports = router;
