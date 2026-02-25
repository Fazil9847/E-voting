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
const { ethers } = require("ethers");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const multer = require("multer");
const path = require("path");


const { contract } = require("./blockchain");
const requireAdmin = require("./middleware/requireAdmin");


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
 hasVoted: [{
  electionId: String,
  votedAt: Date
}],
voteInProgress: { type: Boolean, default: false },


  otpCode: String,
  otpExpiresAt: Date
}, { timestamps: true });



const Voter = mongoose.model('Voter', voterSchema);
const Candidate = require("./models/Candidate");



const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: String,
  password: { type: String, required: true }, // hashed password
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);


const voteSchema = new mongoose.Schema({
  voterHash: { type: String, required: true },
  electionId: { type: String, required: true },
  candidateId: { type: String, required: true },
  votedAt: { type: Date, default: Date.now },

  // future blockchain fields
  txHash: String
});


const Vote = mongoose.model("Vote", voteSchema);



const electionSchema = new mongoose.Schema({
  electionId: { type: String, unique: true, required: true },
  title: String,

  isActive: { type: Boolean, default: false }, // 👈 IMPORTANT

  startedAt: Date,
  endedAt: Date,
  startedBlock: Number,
endedBlock: Number,
resultsPublished: { type: Boolean, default: false },
publishedAt: Date,


}, { timestamps: true });


const Election = mongoose.model("Election", electionSchema);





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
    const { name, party, candidateId, electionId } = req.body;

    const election = await Election.findOne({ electionId });
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
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
    res.status(400).json({ message: err.message });
  }
});


app.post("/api/elections", requireAdmin, async (req, res) => {
  try {
    const { electionId, title } = req.body;

    if (!electionId || !title) {
      return res.status(400).json({ message: "Election ID and title required" });
    }

    const exists = await Election.findOne({ electionId });
    if (exists) {
      return res.status(409).json({ message: "Election already exists" });
    }

    const election = await Election.create({
      electionId,
      title,
      isActive: false
    });

    res.status(201).json(election);
  } catch (err) {
    console.error("Create election error:", err);
    res.status(500).json({ message: "Failed to create election" });
  }
});




// 📥 GET ALL ELECTIONS (ADMIN)
app.get("/api/elections", requireAdmin, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch elections" });
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
app.post("/api/votes/cast", async (req, res) => {
  let voter; // 🔑 needed for catch block

  try {
    const { voterId, candidateId, electionId } = req.body;

    if (!voterId || !candidateId || !electionId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Find voter
    voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // 🚨 HARD LOCK CHECK
    if (voter.voteInProgress) {
      return res.status(409).json({ message: "Vote already in progress" });
    }

    // ❌ Already voted in this election
    if (voter.hasVoted.some(v => v.electionId === electionId)) {
      return res.status(409).json({ message: "Already voted in this election" });
    }


 // 2️⃣ Check election (DB check)
const election = await Election.findOne({ electionId });
if (!election || !election.isActive) {
  return res.status(403).json({ message: "Election not active" });
}

// ⭐ Prevent voting after results published
if (election.resultsPublished) {
  return res.status(403).json({ message: "Results already published" });
}

// ⭐ ADD THIS (Blockchain check)
const activeOnChain = await contract.isElectionActive(electionId);
if (!activeOnChain) {
  return res.status(403).json({ 
    message: "Election not active on blockchain" 
  });
}

    const voterHash = ethers.keccak256(
  ethers.toUtf8Bytes(voterId)
);


const alreadyOnChain = await contract.hasUserVoted(electionId, voterHash);
if (alreadyOnChain) {
  return res.status(409).json({ message: "Already voted (blockchain)" });
}

    // 3️⃣ Validate candidate
    const candidate = await Candidate.findOne({ candidateId, electionId });
    if (!candidate) {
      return res.status(404).json({ message: "Invalid candidate" });
    }

    // 🔒 LOCK VOTER BEFORE BLOCKCHAIN
    voter.voteInProgress = true;
    await voter.save();

    console.log("Casting vote on chain...");


    // 5️⃣ BLOCKCHAIN TRANSACTION
    const tx = await contract.castVote(
      voterHash,
      electionId,
      candidateId
    );
    console.log("Transaction hash:", tx.hash);

const receipt = await tx.wait();

await Vote.create({
  voterHash,
  electionId,
  candidateId,
  txHash: tx.hash,
  blockNumber: receipt.blockNumber
});

    // ✅ UNLOCK + FINALIZE VOTE
    voter.voteInProgress = false;
    voter.hasVoted.push({
      electionId,
      votedAt: new Date()
    });
    voter.qrUsed = true;
    await voter.save();

    return res.json({
      message: "Vote cast successfully",
      txHash: tx.hash
    });

  } catch (err) {

    // 🔓 UNLOCK IF ANY ERROR OCCURS
    if (voter) {
      voter.voteInProgress = false;
      await voter.save();
    }

    console.error("🔥 Vote error:", err);
    return res.status(500).json({
      message: err.reason || err.message || "Blockchain error"
    });
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



app.post("/api/elections/:electionId/start", requireAdmin, async (req, res) => {
  try {

     const { electionId } = req.params;
const election = await Election.findOne({ electionId });

    if (!election)
      return res.status(404).json({ message: "Election not found" });

    // 🔒 Prevent restart after ended
    if (election.startedBlock) {
      return res.status(400).json({
        message: "Election already started once. Cannot restart."
      });
    }

    if (election.isActive)
      return res.status(400).json({ message: "Election already active" });

      // 🔥 CALL BLOCKCHAIN
    const tx = await contract.startElection(electionId);
   const receipt = await tx.wait();   // ⬅ wait until mined


election.isActive = true;
election.startedAt = new Date();
election.startedBlock = receipt.blockNumber;

election.resultsPublished = false;   // ⭐ ADD THIS
election.publishedAt = null;         // ⭐ ADD THIS

    await election.save();

    res.json({ message: "Election started successfully", txHash: tx.hash });

  } catch (err) {
    console.error("Start election error:", err);
    res.status(500).json({ message: err.reason || "Failed to start election" });
  }
});

app.post("/api/elections/:electionId/end", requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;
const election = await Election.findOne({ electionId });

    if (!election)
      return res.status(404).json({ message: "Election not found" });

    if (!election.isActive)
      return res.status(400).json({ message: "Election already ended" });



        // 🔥 CALL BLOCKCHAIN
    const tx = await contract.endElection(electionId);
 const receipt = await tx.wait();   // ⬅ wait until mined

    election.isActive = false;
    election.endedAt = new Date();
    election.endedBlock = receipt.blockNumber; 

    await election.save();

    await Voter.updateMany({}, { $set: { qrUsed: false } });


    res.json({ message: "Election ended successfully", txHash: tx.hash });

  } catch (err) {
    console.error("End election error:", err);
    res.status(500).json({ message: err.reason || "Failed to end election" });
  }
});

// app.post("/api/elections/:electionId/publish-results", requireAdmin, async (req, res) => {
//   try {
//     const election = await Election.findOne({
//       electionId: req.params.electionId
//     });

//     if (!election)
//       return res.status(404).json({ message: "Election not found" });

//     if (election.isActive)
//       return res.status(400).json({ message: "End election first" });

//     election.resultsPublished = true;
//     await election.save();

//     res.json({ message: "Results published successfully" });

//   } catch (err) {
//     res.status(500).json({ message: "Failed to publish results" });
//   }
// });



const resultRoutes = require("./routes/results");
app.use("/api/results", resultRoutes);



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
    const { token, electionId } = req.body;

    if (!token || !electionId) {
      return res.status(400).json({ message: 'token and electionId required' });
    }

    const voter = await Voter.findOne({ qrToken: token });
    if (!voter) {
      return res.status(404).json({ message: "Invalid QR" });
    }

    // ⭐ CHECK ELECTION STATUS
    const election = await Election.findOne({ electionId });
    if (!election || !election.isActive) {
      return res.status(403).json({
        message: "Election is not active"
      });
    }
    const activeOnChain = await contract.isElectionActive(electionId);
if (!activeOnChain) {
  return res.status(403).json({ message: "Election not active on blockchain" });
}

    // ⭐ CHECK IF ALREADY VOTED IN THIS ELECTION
    const alreadyVoted = voter.hasVoted?.some(
      v => v.electionId === electionId
    );

    if (alreadyVoted) {
      return res.status(409).json({
        message: "Voter already voted in this election"
      });
    }

    return res.json({
      _id: voter._id,
      voterId: voter.voterId,
      name: voter.name,
      email: voter.email,
      department: voter.department || "",
      photo: voter.photo || null
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
