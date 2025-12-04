require("dotenv").config(); // Must be before accessing process.env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();
// const port = 3000;

// Middlewares
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors({ origin: "*" }));

// Serve uploads statically 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

  app.get('/', (req, res) => {
  res.send('🟢 MDRC Backend API is running!');
});

// ✅ Add body parsers ONLY for routes that need JSON (e.g. register/login)
const registerRoute = require("./Route/RegisterRoute");
app.use("/v1/api", express.json(), express.urlencoded({ extended: true }), registerRoute);

// ✅ Multer routes — don't use express.json() globally here
const categoryRoute = require("./Route/CategoryRoute");
app.use("/v1/api", categoryRoute);

const departmentRoute = require("./Route/DepartmentRoute");
app.use("/v1/api", departmentRoute);

const keyFeatureRoute = require("./Route/KeyFeaturesRoute");
app.use("/v1/api", keyFeatureRoute);

const CartRoute = require("./Route/CartRoute");
app.use("/v1/api", CartRoute);

const ListingRoute = require("./Route/ListingRoute");
app.use("/v1/api",  ListingRoute);

const CustomerRoute = require("./Route/CustomerRoute");
app.use("/v1/api",  CustomerRoute);

const HomeBannerRoute = require("./Route/HomeBannerRoute");
app.use("/v1/api",  HomeBannerRoute);


const carouselRoute = require("./Route/carouselRoute");
app.use("/v1/api",  carouselRoute);

const DiseaseRoute = require("./Route/DiseaseRoute");
app.use("/v1/api",  DiseaseRoute);

const TypeRoutes = require("./Route/TypeRoutes");
app.use("/v1/api",  TypeRoutes);

const CertificateRoutes = require("./Route/CertificateRoutes");
app.use("/v1/api",  CertificateRoutes);

const LabRoutes = require("./Route/LabRoutes");
app.use("/v1/api",  LabRoutes);

const BlogsRoute = require("./Route/BlogsRoute");
app.use("/v1/api",  BlogsRoute);

const BlogCatogryRoute = require("./Route/BlogCatogryRoute");
app.use("/v1/api",  BlogCatogryRoute);

const BlogTgasRoute = require("./Route/BlogTgasRoute");
app.use("/v1/api",  BlogTgasRoute);

const CouponCreateRoute = require("./Route/CouponCreateRoute");
app.use("/v1/api",  CouponCreateRoute);







const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const morgan = require("morgan");
// const cookieParser = require("cookie-parser");

// const app = express();
// const port = 9000;

// // Middlewares  
// app.use(morgan("dev"));
// app.use(cookieParser());
// app.use(cors({ origin: "*" }));

// // Serve uploads statically
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // MongoDB connection
// require("dotenv").config();



// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ Connected to MongoDB Atlas"))
//   .catch(err => console.error("❌ MongoDB connection error:", err));

// // ✅ Add body parsers ONLY for routes that need JSON (e.g. register/login)
// const registerRoute = require("./Route/RegisterRoute");
// app.use("/v1/api", express.json(), express.urlencoded({ extended: true }), registerRoute);

// // ✅ Multer routes — don't use express.json() globally here
// const categoryRoute = require("./Route/CategoryRoute");
// app.use("/v1/api", categoryRoute);

// const departmentRoute = require("./Route/DepartmentRoute");
// app.use("/v1/api", departmentRoute);

// const keyFeatureRoute = require("./Route/KeyFeaturesRoute");
// app.use("/v1/api", keyFeatureRoute);

// const CartRoute = require("./Route/CartRoute");
// app.use("/v1/api", CartRoute);

// const ListingRoute = require("./Route/ListingRoute");
// app.use("/v1/api",  ListingRoute);

// const CustomerRoute = require("./Route/CustomerRoute");
// app.use("/v1/api",  CustomerRoute);





// // Start server
// app.listen(port, () => {
//   console.log(`Server working on ${port}`);
// });
