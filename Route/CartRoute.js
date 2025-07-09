const express = require("express");
const router = express.Router();
const Cart = require("../Models/Cart");

router.post("/add", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Check if product already exists
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists in cart, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Product does not exist in cart, add new item
        cart.items.push({ productId, quantity });
      }

      await cart.save();
    } else {
      // No cart for user, create new
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
      });
      await cart.save();
    }

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (err) {
    console.error("Cart add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
