// const model = require("../Models/Register");
// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");







// router.post("/register", async (req, res) => {
//   try {
//     const { email, password, confirmPassword } = req.body;

//     if (!email || !password || !confirmPassword) {
//       return res
//         .status(400)
//         .json({ msg: "Email, password, and confirm password are required" });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ msg: "Passwords do not match" });
//     }

//     const existingUser = await model.findOne({ email });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ msg: "User with this email already exists" });
//     }

//     bcrypt.genSalt(10, function (err, salt) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ msg: "Error generating salt", error: err.message });
//       }

//       bcrypt.hash(password, salt, async function (err, hash) {
//         if (err) {
//           return res
//             .status(500)
//             .json({ msg: "Error hashing password", error: err.message });
//         }

//         const userdata = await model.create({
//           email,
//           password: hash,
//           confirmPassword: hash,
//         });

//         // JWT expires in 5 minutes
//         const token = jwt.sign(
//           { email },
//           process.env.JWT_SECRET || "defaultSecretKey",
//           { expiresIn: "5m" }
//         );

//         res.cookie("token", token, {
//           httpOnly: true,
//           maxAge: 5 * 60 * 1000, // optional: cookie expiry also set to 5 minutes
//         });

//         res.status(201).json({ msg: "User registered successfully", userdata });
//       });
//     });
//   } catch (error) {
//     res.status(500).json({ msg: "Error saving user", error: error.message });
//   }
// });

// // LOGIN

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ msg: "Email and password are required" });
//     }

//     const userdata = await model.findOne({ email });
//     if (!userdata) {
//       return res.status(404).json({ msg: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, userdata.password);
//     if (!isMatch) {
//       return res.status(401).json({ msg: "Invalid password" });
//     }

//     // JWT token expires in 5 minutes
//     const token = jwt.sign(
//       { email },
//       process.env.JWT_SECRET || "defaultSecretKey",
//       { expiresIn: "5m" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
//     });

//     res.status(200).json({ msg: "Login successful", userdata });
//     console.log(userdata);
//   } catch (error) {
//     res.status(500).json({ msg: "Server error", error: error.message });
//   }
// });

// // LOGOUT ROUTE

// router.post("/logout", (req, res) => {
//   try {
//     res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
//     res.status(200).json({ success: true, message: "Logout successful" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });

// // Auth User Route
// router.get("/authuser", async (req, res) => {
//   try {
//     const token = req.cookies.token;
//     if (!token) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Unauthorized: Access Denied" });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecretKey");
//     } catch (err) {
//       return res.status(401).json({ success: false, message: "Invalid token" });
//     }

//     const userdata = await model.findOne({ email: decoded.email });
//     if (!userdata) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     res.status(200).json({ success: true, data: userdata });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });





// // forget password

// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   if (!email) return res.status(400).json({ message: "Email is required" });

//   const user = await User.findOne({ email });
//   if (!user)
//     return res.status(404).json({ message: "No user found with this email." });

//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//     expiresIn: "1h",
//   });

//   const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

//   // Send email
//   const transporter = nodemailer.createTransport({
//     service: "gmail", // or your SMTP provider
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: `"Support" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Password Reset Request",
//     html: `
//       <p>Hello,</p>
//       <p>You requested to reset your password.</p>
//       <p>Click the link below to reset:</p>
//       <a href="${resetLink}">${resetLink}</a>
//       <p>This link will expire in 1 hour.</p>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "Reset link sent to email." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to send email." });
//   }
// });


// router.post("/verify-otp", async (req, res) => {
//   const { email, otp } = req.body;
//   try {
//     const user = await model.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, msg: "User not found" });
//     }

//     if (user.otp !== otp || user.otpExpires < Date.now()) {
//       return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
//     }

//     res.json({ success: true, msg: "OTP verified" });
//   } catch (error) {
//     res.status(500).json({ success: false, msg: "Server error", error: error.message });
//   }
// });
// router.post("/reset-password", async (req, res) => {
//   const { email, otp, newPassword, confirmPassword } = req.body;
//   try {
//     const user = await model.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, msg: "User not found" });
//     }

//     if (user.otp !== otp || user.otpExpires < Date.now()) {
//       return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
//     }

//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({ success: false, msg: "Passwords do not match" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);

//     user.password = hashedPassword;
//     user.confirmPassword = hashedPassword;
//     user.otp = null;
//     user.otpExpires = null;

//     await user.save();
//     res.json({ success: true, msg: "Password reset successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, msg: "Server error", error: error.message });
//   }
// });


// module.exports = router;





const model = require("../Models/Register");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// REGISTER ROUTE
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ msg: "Email, password, and confirm password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const existingUser = await model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const userdata = await model.create({
      email,
      password: hash,
      confirmPassword: hash,
    });

    // JWT token generate karein (7 days ke liye)
    const token = jwt.sign(
      { 
        email: userdata.email,
        id: userdata._id 
      },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "7d" } // 7 days
    );

    // Cookie set karein
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // ✅ Response mein token bhi bhejein
    res.status(201).json({ 
      msg: "User registered successfully", 
      userdata: {
        _id: userdata._id,
        email: userdata.email
      },
      token: token, // ✅ Token frontend ko bhej rahe hain
      expiresIn: "7d"
    });

  } catch (error) {
    res.status(500).json({ msg: "Error saving user", error: error.message });
  }
});

// LOGIN ROUTE - FIXED
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const userdata = await model.findOne({ email });
    if (!userdata) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userdata.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    // JWT token expires in 7 days
    const token = jwt.sign(
      { 
        email: userdata.email,
        id: userdata._id 
      },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "7d" } // 7 days instead of 5 minutes
    );

    // Cookie set karein
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // ✅ IMPORTANT: Response mein token bhi bhejein
    res.status(200).json({ 
      msg: "Login successful", 
      userdata: {
        _id: userdata._id,
        email: userdata.email
      },
      token: token, // ✅ Token frontend ko bhej rahe hain
      expiresIn: "7d"
    });
    
    console.log("Login successful for:", email);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// LOGOUT ROUTE
router.post("/logout", (req, res) => {
  try {
    res.cookie("token", "", { 
      httpOnly: true, 
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// AUTH USER ROUTE
router.get("/authuser", async (req, res) => {
  try {
    // Pehle cookies se token check karein
    let token = req.cookies.token;
    
    // Agar cookie mein nahi hai to authorization header se check karein
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecretKey");
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const userdata = await model.findOne({ email: decoded.email }).select('-password -confirmPassword');
    if (!userdata) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      user: userdata,
      token: token // Optional: new token send karein
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await model.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "defaultSecretKey", {
      expiresIn: "1h",
    });

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset link sent to email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await model.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }

    res.json({ success: true, msg: "OTP verified" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const user = await model.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, msg: "Passwords do not match" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.confirmPassword = hashedPassword;
    user.otp = null;
    user.otpExpires = null;

    await user.save();
    res.json({ success: true, msg: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

module.exports = router;
