// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const QRCode = require('qrcode');

// --- Email / OTP setup ---
const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const multer = require("multer");
const path = require("path");


// --- requireAdmin middleware (protect admin-only routes) ---
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Not authenticated' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid auth format' });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.admin = payload; // { adminId, name, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

let mailer = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for SSL
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  console.log("SMTP mailer configured");
} else {
  console.warn("⚠️ SMTP not configured — OTP emails will NOT be sent");
}


const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies


// ✅ CREATE uploads folder access
app.use("/uploads", express.static("uploads"));

/* ========= MULTER CONFIG (ADD HERE) ========= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/voters");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.voterId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  }
});

/* ========= END MULTER CONFIG ========= */


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- Mongoose models ---
const voterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  age: Number,
  voterId: { type: String, unique: true, required: true },

  department: String,        // ✅ ADD
  photo: String,             // ✅ ADD (URL or filename)

  qrToken: { type: String, unique: true, sparse: true },
  qrUsed: { type: Boolean, default: false },

  otpCode: String,
  otpExpiresAt: Date
}, { timestamps: true });


const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: String,

  candidateId: { type: String, unique: true, required: true },
  electionId: { type: String, required: true } // ✅ ADD THIS
}, { timestamps: true });

const Voter = mongoose.model('Voter', voterSchema);
const Candidate = mongoose.model('Candidate', candidateSchema);

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: String,
  password: { type: String, required: true }, // hashed password
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// (Optional) Route to create admin - use only once or protect it
// You can remove or comment this after creating first admin.
app.post('/api/admin/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !password) return res.status(400).json({ message: 'name and password required' });
    const exists = await Admin.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Admin already exists' });

    const hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hash });
    return res.status(201).json({ message: 'Admin created', adminId: admin._id });
  } catch (err) {
    console.error('admin register error:', err);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

// Login route
app.post('/api/admin/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ message: 'name and password required' });

    const admin = await Admin.findOne({ name });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // create a JWT
    const payload = { adminId: admin._id, name: admin.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

    return res.json({ token, admin: { name: admin.name, email: admin.email, id: admin._id } });
  } catch (err) {
    console.error('admin login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});


// --- Get authenticated admin info ---
app.get('/api/admin/me', requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ admin });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Connect to MongoDB ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Routes: Voters ---
app.get('/api/voters', async (req, res) => {
  try {
    const voters = await Voter.find().sort({ createdAt: -1 });
    res.json(voters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/voters', async (req, res) => {
  try {
    const { name, email, age, voterId } = req.body;
    const newVoter = new Voter({ name, email, age, voterId });
    await newVoter.save();
    res.status(201).json(newVoter);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate voterId or qrToken' });
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/voters/:id', async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    if (!voter) return res.status(404).json({ message: 'Voter not found' });
    res.json(voter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/voters/:id', async (req, res) => {
  try {
    const updated = await Voter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/voters/:id', async (req, res) => {
  try {
    await Voter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload voter photo
app.post("/api/voters/upload-photo", upload.single("photo"), async (req, res) => {
  try {
    const { voterId } = req.body;

    if (!voterId || !req.file) {
      return res.status(400).json({ message: "voterId and photo required" });
    }

    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // Save photo path in DB
    voter.photo = `/uploads/voters/${req.file.filename}`;
    await voter.save();

    res.json({
      message: "Photo uploaded successfully",
      photo: voter.photo
    });

  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Photo upload failed" });
  }
});


// --- Routes: Candidates ---
app.get('/api/candidates', async (req, res) => {
  try {
    const c = await Candidate.find().sort({ createdAt: -1 });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/candidates', requireAdmin, async (req, res) => {
  try {
    const { name, party, manifesto, candidateId, electionId } = req.body;

    if (!electionId) {
      return res.status(400).json({ message: "electionId is required" });
    }

    const newC = new Candidate({
      name,
      party,
      candidateId,
      electionId
    });

    await newC.save();
    res.status(201).json(newC);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});


app.get("/api/elections/:electionId/candidates", requireAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.find({ electionId: req.params.electionId });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch candidates" });
  }
});

// --- Root ---
app.get('/', (req, res) => res.send('eVote API running'));

// ---------------- Request OTP endpoint ----------------
function generateNumericOTP(length = 6) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

app.post("/api/voters/request-otp", async (req, res) => {
  try {
    const { voterId } = req.body;
    if (!voterId) return res.status(400).json({ message: "voterId is required" });

    // Find the voter
    const voter = await Voter.findOne({ voterId });
    if (!voter) return res.status(404).json({ message: "Voter not found" });

    // Simple rate-limiting: if existing OTP still valid, you may refuse/resend.
    const now = new Date();
    if (voter.otpExpiresAt && voter.otpExpiresAt > now) {
      // OPTIONAL: return 429 to prevent spamming, or allow resend.
      // return res.status(429).json({ message: "OTP already sent. Try again later." });
      // We'll allow resending (overwrite) so user can request again.
    }

    const otpLength = Number(process.env.OTP_LENGTH || 6);
    const otpExpireMin = Number(process.env.OTP_EXPIRE_MINUTES || 10);

    // Generate and save OTP + expiry
    const code = generateNumericOTP(otpLength);
    const expiresAt = new Date(Date.now() + otpExpireMin * 60 * 1000);

    voter.otpCode = code;
    voter.otpExpiresAt = expiresAt;
    await voter.save();

    // Send email (if mailer configured)
    if (mailer) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: voter.email,
        subject: `Your eVote OTP — valid ${otpExpireMin} minutes`,
        text: `Your verification code is: ${code}\n\nIt will expire in ${otpExpireMin} minutes.`,
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>It will expire in ${otpExpireMin} minutes.</p>`
      };

      mailer.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Failed to send OTP email:", err);
          // do not fail the whole flow — respond success but warn in console
        } else {
          console.log("OTP email sent:", info && info.response);
        }
      });
    } else {
      // Mailer not configured — helpful dev message (do NOT use in prod)
      console.warn("SMTP not configured. OTP (dev):", code);
    }

    return res.json({ message: "OTP requested (sent if email configured)" });
  } catch (err) {
    console.error("request-otp error:", err);
    return res.status(500).json({ message: "Failed to request OTP" });
  }
});


// ---------------- Verify OTP endpoint ----------------
/**
 * POST /api/voters/verify-otp
 * Body: { voterId: "VT101", code: "123456" }
 *
 * Behaviour:
 *  - Finds voter by voterId
 *  - Checks otpCode exists and not expired
 *  - Compares code, clears otp fields on success
 *  - Returns 200 on success, 400/404 on failure
 */
app.post("/api/voters/verify-otp", async (req, res) => {
  try {
    const { voterId, code } = req.body;
    if (!voterId || !code) return res.status(400).json({ message: "voterId and code are required" });

    const voter = await Voter.findOne({ voterId });
    if (!voter) return res.status(404).json({ message: "Voter not found" });

    // No OTP requested
    if (!voter.otpCode || !voter.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP requested for this voter" });
    }

    // Check expiry
    if (new Date() > voter.otpExpiresAt) {
      // Clear expired OTP to avoid reuse
      voter.otpCode = null;
      voter.otpExpiresAt = null;
      await voter.save();
      return res.status(400).json({ message: "OTP expired" });
    }

    // Compare codes (plain comparison). For production consider hashing.
    if (voter.otpCode !== String(code).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Success: clear OTP fields so it cannot be reused
    voter.otpCode = null;
    voter.otpExpiresAt = null;
    await voter.save();

    return res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});



/* ------------------ QR Token endpoints ------------------ */

/**
 * POST /api/voters/generate-qr
 * Body: { voterId: "VT101" }
 * Behaviour:
 *  - Finds voter by voterId
 *  - If voter has qrToken already, returns it (200)
 *  - Otherwise generates unique token, saves to voter.qrToken and returns it (201)
 */
app.post('/api/voters/generate-qr', async (req, res) => {
  try {
    const { voterId } = req.body;
    if (!voterId) return res.status(400).json({ message: 'voterId is required' });

    const voter = await Voter.findOne({ voterId });
    if (!voter) return res.status(404).json({ message: 'Voter not found' });

    if (voter.qrToken) {
      return res.status(200).json({ qrToken: voter.qrToken });
    }

    // generate token: voterId + timestamp + random
    const newToken = `${voterId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // assign and save
    voter.qrToken = newToken;
    await voter.save();

    return res.status(201).json({ qrToken: newToken });
  } catch (err) {
    console.error('generate-qr error:', err);
    return res.status(500).json({ message: 'Failed to generate QR token' });
  }
});

/**
 * GET /api/voter/qr-code/:token
 * Returns: image/png (QR code PNG buffer)
 * The token is the exact string stored in voter.qrToken.
 */
app.get('/api/voter/qr-code/:token', async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).json({ message: 'Token required' });

    // Optional: check that token exists in DB (uncomment if you want server-side validation)
    // const voter = await Voter.findOne({ qrToken: token });
    // if (!voter) return res.status(404).json({ message: 'Invalid token' });

    const buffer = await QRCode.toBuffer(token, {
      type: 'png',
      width: 500,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error('qr-code error:', err);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
});

/**
 * POST /api/voters/validate-qr
 * Body: { token: "..." , markUsed: true/false (optional, default true) }
 * Returns voter record (if token valid). If markUsed=true, sets qrUsed=true (atomic).
 * Use this when admin scans QR on voting day.
 */
app.post('/api/voters/validate-qr', async (req, res) => {
  try {
    const { token, markUsed = true } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required' });

    // Find voter by token
   const voter = await Voter.findOneAndUpdate(
  { qrToken: token, qrUsed: false },
  { $set: { qrUsed: true } },
  { new: true }
);

if (!voter) {
  return res.status(409).json({ message: "QR already used or invalid" });
}


    // Return some voter details (do not send sensitive info)
   return res.json({
  _id: voter._id,
  voterId: voter.voterId,
  name: voter.name,
  email: voter.email,
  department: voter.department || "",
  photo: voter.photo || null,
  qrUsed: voter.qrUsed
});

  } catch (err) {
    console.error('validate-qr error:', err);
    res.status(500).json({ message: 'Failed to validate token' });
  }
});

/* ------------------ End QR endpoints ------------------ */

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
