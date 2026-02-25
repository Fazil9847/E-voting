const express = require("express");
const { contract } = require("../blockchain");
const requireAdmin = require("../middleware/requireAdmin");
const mongoose = require("mongoose");

const Candidate = mongoose.model("Candidate");
const Election = mongoose.model("Election");

const router = express.Router();

router.post("/publish/:electionId", requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;
    const force = req.query.force === "true";   // ⭐ ADD THIS

    const election = await Election.findOne({ electionId });
    if (!election)
      return res.status(404).json({ message: "Election not found" });

    if (election.isActive)
      return res.status(400).json({ message: "Election still active" });

    // 🔒 Only block if NOT force
    if (!force && election.resultsPublished)
      return res.status(400).json({ message: "Already published" });

    // ⭐ If normal publish
    if (!force) {
      election.resultsPublished = true;
      election.publishedAt = new Date();
      await election.save();

      return res.json({ message: "Results published successfully" });
    }

    // ⭐ If force recount
    return res.json({ message: "Force recount allowed" });

  } catch (err) {
    res.status(500).json({ message: "Publish failed" });
  }
});






router.get("/public-elections", async (req, res) => {
  try {
    const elections = await Election.find({
      resultsPublished: true,
      isActive: false
    }).sort({ endedAt: -1 });
    res.json(elections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load elections" });
  }
});

/* =======================================================
   🌐 PUBLIC → GET RESULTS (NO JWT)
======================================================= */
router.get("/public/:electionId", async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOne({ electionId });

    if (!election)
      return res.status(404).json({ message: "Election not found" });

    // 🔒 1️⃣ Must not be active
    if (election.isActive)
      return res.status(403).json({ message: "Election still active" });

    // 🔒 2️⃣ Must be published
    if (!election.resultsPublished)
      return res.status(403).json({ message: "Results not published yet" });

    const candidates = await Candidate.find({ electionId });

    const results = [];

    for (const candidate of candidates) {
      const votes = await contract.getVoteCount(
        electionId,
        candidate.candidateId
      );

      results.push({
        candidateId: candidate.candidateId,
        name: candidate.name,
        party: candidate.party,
        votes: Number(votes)
      });
    }

    res.json({
      electionId,
      publishedAt: election.publishedAt,
      results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load results" });
  }
});


/* =======================================================
   🔵 ADMIN → GET RESULTS (JWT REQUIRED)
======================================================= */

router.get("/:electionId", requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;
    const mode = req.query.mode || "normal";

    const election = await Election.findOne({ electionId });
    if (!election)
      return res.status(404).json({ message: "Election not found" });

    if (election.isActive)
      return res.status(400).json({ message: "Election still active" });
    if (!election.startedBlock || !election.endedBlock) {
  return res.status(400).json({ message: "Block range missing" });
}

    const candidates = await Candidate.find({ electionId });

    // 🟢 NORMAL MODE
    if (mode === "normal") {
      const results = [];

      for (const candidate of candidates) {
        const votes = await contract.getVoteCount(
          electionId,
          candidate.candidateId
        );

        results.push({
          candidateId: candidate.candidateId,
          name: candidate.name,
          party: candidate.party,
          votes: Number(votes)
        });
      }

      return res.json({
        electionId,
        source: "On-chain voteCounts",
        results
      });
    }

    // 🔵 AUDIT MODE
   if (mode === "audit") {
  console.log("🔵 FORCE RECOUNT STARTED");
  console.log("Election:", electionId);
  console.log("Block range:", election.startedBlock, "→", election.endedBlock);

  const filter = contract.filters.VoteCast();
  const logs = await contract.queryFilter(
    filter,
    election.startedBlock,
    election.endedBlock
  );

  console.log("Total logs found:", logs.length);

  const counts = {};

  for (const log of logs) {
    if (String(log.args.electionId) !== String(electionId)) continue;

    const cid = String(log.args.candidateId);
    counts[cid] = (counts[cid] || 0) + 1;

    console.log("Vote counted for:", cid);
  }

  console.log("Final counts:", counts);

  const results = candidates.map(c => ({
    candidateId: c.candidateId,
    name: c.name,
    party: c.party,
    votes: counts[c.candidateId] || 0
  }));

  console.log("🔵 FORCE RECOUNT COMPLETED");

  return res.json({
    electionId,
    source: "Audit from logs",
    results
  });
}

    return res.status(400).json({ message: "Invalid mode" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Result calculation failed" });
  }
});


module.exports = router;