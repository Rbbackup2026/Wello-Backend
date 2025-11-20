const express = require('express');
const router = express.Router();
const Pincode = require('../Models/Pincode.js');

// ✅ Get all pincodes (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const pincodes = await Pincode.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Pincode.countDocuments();
    res.status(200).json({ total, page: Number(page), pincodes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Search pincodes by query (pincode, district, state, or office name)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Please provide a search query (q)' });
    }

    const results = await Pincode.find({
      $or: [
        { pincode: { $regex: q, $options: 'i' } },
        { officeName: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } }
      ]
    }).limit(100);

    res.status(200).json({ count: results.length, results });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// ✅ Get pincodes by state
router.get('/state/:stateName', async (req, res) => {
  try {
    const { stateName } = req.params;
    const pincodes = await Pincode.find({ state: { $regex: stateName, $options: 'i' } }).limit(500);
    res.status(200).json({ count: pincodes.length, pincodes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching state pincodes', error: err.message });
  }
});

// ✅ Get pincodes by district
router.get('/district/:districtName', async (req, res) => {
  try {
    const { districtName } = req.params;
    const pincodes = await Pincode.find({ district: { $regex: districtName, $options: 'i' } }).limit(500);
    res.status(200).json({ count: pincodes.length, pincodes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching district pincodes', error: err.message });
  }
});

// ✅ Get pincode details by exact number
router.get('/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const data = await Pincode.findOne({ pincode });
    if (!data) return res.status(404).json({ message: 'Pincode not found' });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pincode', error: err.message });
  }
});

module.exports = router;
