const express = require("express");
const router = express.Router();
const Product = require("../Models/ListingItems");
const Category = require("../Models/Category");
const Blog = require("../Models/Blog");

router.get("/sitemap.xml", async (req, res) => {
  try {
    // ✅ Frontend ka URL — backend ka nahi!
    const baseUrl = process.env.CLIENT_URL || "http://localhost:3001";

    const [products, categories, blogs] = await Promise.all([
      Product.find({ status: true }).select("_id city name updatedAt"),
      Category.find({ status: true }).select("_id name updatedAt"),
      Blog.find({ status: "active" }).select("_id updatedAt")
    ]);

    // Products se unique cities nikalo
const uniqueCities = [...new Set(
  products
    .map(p => p.city)
    .filter(Boolean)
    .map(city => city.trim().toLowerCase().replace(/\s+/g, '-'))
)];

 const cityTestCombos = products
      .filter(p => p.city && p.name)
      .map(p => ({
        city: p.city.trim().toLowerCase().replace(/\s+/g, '-'),
        testName: p.name.trim().toLowerCase().replace(/\s+/g, '-'),
        updatedAt: p.updatedAt
      }));

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Static Routes -->
  <url>
    <loc>${baseUrl}/home</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/lab-tests</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/full-body-health-checkup</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/download-report</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/cart_section</loc>
    <priority>0.3</priority>
  </url>`;

    // ✅ Products — /product/:id
    products.forEach(p => {
      xml += `
  <url>
    <loc>${baseUrl}/product/${p._id}</loc>
    <lastmod>${(p.updatedAt || new Date()).toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>`;
    });

    // ✅ Categories — /lab-tests?category=name
    categories.forEach(c => {
      xml += `
  <url>
    <loc>${baseUrl}/lab-tests?category=${encodeURIComponent(c.name)}</loc>
    <lastmod>${(c.updatedAt || new Date()).toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>`;
    });

    // ✅ Blogs — /blog/:id
    blogs.forEach(b => {
      xml += `
  <url>
    <loc>${baseUrl}/blog/${b._id}</loc>
    <lastmod>${(b.updatedAt || new Date()).toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>`;
    });

    // ✅ Cities — /labs/city/:citySlug
    uniqueCities.forEach(citySlug => {
      xml += `
  <url>
    <loc>${baseUrl}/labs/city/${citySlug}</loc>
    <priority>0.7</priority>
  </url>`;
    });

    // ✅ City + Test — /lab-tests/:city/:testName
    cityTestCombos.forEach(combo => {
      xml += `
  <url>
    <loc>${baseUrl}/lab-tests/${combo.city}/${encodeURIComponent(combo.testName)}</loc>
    <lastmod>${(combo.updatedAt || new Date()).toISOString().split('T')[0]}</lastmod>
    <priority>0.75</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);

  } catch (error) {
    console.error("Sitemap Error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;