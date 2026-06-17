const express = require("express");
const router = express.Router();
const Notification = require("../Models/Notification");

// Admin notification bhejta hai
router.post("/send-user-notification", async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId and message required" });
  }

  try {
    const notification = await Notification.create({ userId, message });
    return res.status(200).json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save notification" });
  }
});

// User apni notifications fetch karta hai (polling)
router.get("/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
      seen: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// User ne notification dekh li — mark as seen
router.patch("/notifications/:id/seen", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { seen: true });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update notification" });
  }
});

module.exports = router;