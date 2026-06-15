const express = require("express");
const WalletSettings = require("../Models/WalletSettings");
const UserWallet = require("../Models/UserWallet");
const {
  getWalletSettings,
  getOrCreateWallet,
  previewWalletApply,
} = require("./WalletService");

const router = express.Router();

router.get("/settings", async (req, res) => {
  try {
    const settings = await getWalletSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const settings = await getWalletSettings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, message: "Wallet settings updated", settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/balance/:userId", async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.params.userId);
    const settings = await getWalletSettings();
    res.json({
      success: true,
      balance: wallet.balance,
      coinValue: settings.coinValue || 1,
      settings,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/preview-apply", async (req, res) => {
  try {
    const { userId, payableAmount, coinsToUse } = req.body;
    if (!userId || payableAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId and payableAmount are required",
      });
    }

    const preview = await previewWalletApply({
      userId,
      payableAmount: Number(payableAmount),
      coinsToUse: Number(coinsToUse || 0),
    });

    res.json({ success: true, ...preview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/transactions/:userId", async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.params.userId);
    const transactions = [...(wallet.transactions || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.json({
      success: true,
      balance: wallet.balance,
      transactions,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
