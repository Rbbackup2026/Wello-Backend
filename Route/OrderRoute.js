const express = require("express");
const router = express.Router();
const Order = require("../Models/Order");
const User = require("../Models/Register");
const {
  processWalletOnOrder,
  previewWalletApply,
} = require("./WalletService"); // ✅ path apne folder structure ke hisaab se adjust karo

// ✅ Create Order
router.post("/create-order", async (req, res) => {
  try {
    const {
      userId,
      items,
      prefix,
      firstName,
      lastName,
      patientName,
      gender,
      mobileNumber,
      dateOfBirth,
      relation,
      address,
      state,
      city,
      area,
      pincode,
      slotDate,
      slotTime,
      subtotal,
      discount,
      totalAmount,
      walletCoinsUsed, // ✅ frontend se aayega
    } = req.body;

    // ✅ Validation
    if (!userId || !items?.length || !patientName || !address || !slotDate || !slotTime || !totalAmount) {
      return res.status(400).json({ message: "All fields are required. Please ensure userId and totalAmount are present." });
    }

    if (mobileNumber && !/^\d+$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Mobile number must contain only numbers." });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: "Pincode must be exactly 6 digits." });
    }

    // ✅ Wallet preview - actual coins & discount calculate karo
    let appliedCoins = 0;
    let walletDiscount = 0;

    if (walletCoinsUsed && Number(walletCoinsUsed) > 0) {
      try {
        const walletPreview = await previewWalletApply({
          userId,
          payableAmount: Number(totalAmount),
          coinsToUse: Number(walletCoinsUsed),
        });
        appliedCoins = walletPreview.appliedCoins || 0;
        walletDiscount = walletPreview.walletDiscount || 0;
      } catch (previewError) {
        console.error("Wallet preview error:", previewError.message);
        // Preview fail ho toh bhi order place hoga, wallet use nahi hoga
      }
    }

    // ✅ Order create karo
    const order = await Order.create({
      userId,
      items,
      prefix,
      firstName,
      lastName,
      patientName,
      gender,
      mobileNumber,
      dateOfBirth,
      relation,
      address,
      state,
      city,
      area,
      pincode,
      slotDate,
      slotTime,
      amount: subtotal || totalAmount,
      discount: discount || 0,
      totalAmount,
      walletCoinsUsed: appliedCoins,     // ✅ verified coins
      walletDiscount: walletDiscount,    // ✅ rupee discount
      status: "Pending",
      paymentStatus: "Unpaid",
    });

    // ✅ Address save karo
    if (userId && address) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { savedAddresses: address },
      });
    }

    // ✅ Wallet process karo - debit used coins + credit earned coins
    try {
      await processWalletOnOrder({
        userId,
        orderId: order._id,
        orderSubtotal: totalAmount,
        walletCoinsUsed: appliedCoins,
      });
    } catch (walletError) {
      // Wallet error se order cancel nahi hoga
      console.error("Wallet processing error:", walletError.message);
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

// ✅ Get all orders of a user
router.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

// ✅ Get single order by ID
router.get("/order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
});

// ✅ Update order status (Admin use)
router.put("/order-status/:id", async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, paymentStatus },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order updated", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
});

module.exports = router;