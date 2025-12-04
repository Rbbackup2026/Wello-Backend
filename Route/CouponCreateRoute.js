const express = require("express");
const Coupon = require("../Models/CouponCreate.js");

const router = express.Router();


// ==================== CREATE COUPON ====================
router.post("/coupon-create", async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({
      success: true,
      message: "Coupon Created Successfully",
      coupon,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


// ==================== GET ALL COUPONS ====================
router.get("/all", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==================== GET SINGLE COUPON ====================
router.get("/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


// ==================== APPLY COUPON ====================
router.post("/apply", async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    const coupon = await Coupon.findOne({ code });

    if (!coupon)
      return res.status(404).json({ success: false, message: "Invalid coupon" });

    if (!coupon.active)
      return res.status(400).json({ success: false, message: "Coupon not active" });

    if (new Date() > coupon.expiry)
      return res.status(400).json({ success: false, message: "Coupon expired" });

    if (cartTotal < coupon.minAmount)
      return res.status(400).json({
        success: false,
        message: `Minimum order amount should be Rs ${coupon.minAmount}`,
      });

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (cartTotal * coupon.discountValue) / 100;

      if (coupon.maxDiscount && discount > coupon.maxDiscount)
        discount = coupon.maxDiscount;
    } else {
      discount = coupon.discountValue;
    }

    const finalTotal = cartTotal - discount;

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      finalTotal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==================== DEACTIVATE ====================
router.put("/deactivate/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    res.json({ success: true, message: "Coupon deactivated", coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


// ==================== DELETE COUPON ====================
router.delete("/delete/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


module.exports = router;
