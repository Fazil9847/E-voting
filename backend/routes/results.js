const express = require("express");
const { ethers } = require("ethers");
const { provider, votingAbi, safeGetBlockNumber } = require("../blockchain");
const requireAdmin = require("../middleware/requireAdmin");
const mongoose = require("mongoose");

const Candidate = mongoose.model("Candidate");
const Election = mongoose.model("Election");

const router = express.Router();

/* =======================================================
   🔵 ADMIN → PUBLISH RESULTS SNAPSHOT
======================================================= */

router.post("/publish/:electionId", requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;
    const force = req.query.force === "true";

    const election = await Election.findOne({ electionId });
    if (!election)
      return res.status(404).json({ message: "Election not found" });

    if (election.isActive)
      return res.status(400).json({ message: "Election still active" });

    const latestBlock = await safeGetBlockNumber();

    if (!latestBlock || isNaN(latestBlock)) {
      return res.status(500).json({ message: "Blockchain not reachable" });
    }

    const lastBlock = Number(election.lastCountedBlock || 0);

    // Skip if no new votes
    if (!force && lastBlock >= latestBlock) {
      return res.json({
        message: "No new votes since last publish",
        snapshot: election.resultsSnapshot
      });
    }

    const fromBlock = force
      ? Number(process.env.DEPLOYMENT_BLOCK)
      : lastBlock + 1;

    console.log(`📊 Counting votes from ${fromBlock} → ${latestBlock}`);

    const address = process.env.VOTING_CONTRACT_ADDRESS;
    let allLogs = [];
    let from = fromBlock;

    let scanned = 0;
    let totalLogs = 0;

    // Scan blockchain in chunks
    while (from <= latestBlock) {
      const to = Math.min(from + 2000, latestBlock);

      try {
        console.log(`🔍 Scanning blocks ${from} → ${to}`);

        const part = await provider.getLogs({
          address,
          fromBlock: from,
          toBlock: to
        });

        console.log(`   → Found ${part.length} logs`);

        totalLogs += part.length;
        scanned++;

        allLogs.push(...part);
      } catch (e) {
        console.log(`❌ Chunk failed ${from}-${to}`);
      }

      from = to + 1;
    }

    console.log(
      `✅ Scan complete | Chunks: ${scanned} | Total logs: ${totalLogs}`
    );

    const logs = allLogs;
    const iface = new ethers.Interface(votingAbi);

    const counts = {};

    for (const log of logs) {
      let parsed;
      try {
        parsed = iface.parseLog(log);
      } catch {
        continue;
      }

      if (parsed.name !== "VoteCast") continue;
      if (String(parsed.args.electionId) !== String(electionId)) continue;

      const cid = String(parsed.args.candidateId);
      counts[cid] = (counts[cid] || 0) + 1;
    }

    // Build snapshot
    const candidates = await Candidate.find({ electionId });

    const oldMap = {};
    for (const s of election.resultsSnapshot || []) {
      oldMap[String(s.candidateId)] = s.votes;
    }

    const snapshot = candidates.map(c => {
      const cid = String(c.candidateId);
      const oldVotes = force ? 0 : (oldMap[cid] || 0);
      const newVotes = counts[cid] || 0;

      return {
        candidateId: cid,
        name: c.name,
        party: c.party,
        votes: oldVotes + newVotes
      };
    });

    election.resultsSnapshot = snapshot;
    election.resultsPublished = true;
    election.publishedAt = new Date();
    election.publishedBlock = latestBlock;
    election.lastCountedBlock = latestBlock;

    await election.save();

    res.json({
      message: force
        ? "Full recount completed"
        : "Results updated successfully",
      snapshot
    });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ message: "Failed to publish results" });
  }
});

/* =======================================================
   🌐 PUBLIC → LIST PUBLISHED ELECTIONS
======================================================= */

router.get("/public-elections", async (req, res) => {
  try {
    const elections = await Election.find({
      isActive: false,
      resultsPublished: true
    }).select("electionId title endedAt");

    res.json(elections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch elections" });
  }
});


/* =======================================================
   🌐 PUBLIC → GET RESULTS BY ELECTION
======================================================= */

router.get("/public/:electionId", async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOne({ electionId });

    if (!election)
      return res.status(404).json({ message: "Election not found" });

    if (!election.resultsPublished)
      return res.status(403).json({ message: "Results not published yet" });

    res.json({
      electionId: election.electionId,
      publishedAt: election.publishedAt,
      publishedBlock: election.publishedBlock,
      results: election.resultsSnapshot || []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load results" });
  }
});

/* =======================================================
   🔵 ADMIN → GET RESULTS
======================================================= */

router.get("/:electionId", requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOne({ electionId });
    if (!election)
      return res.status(404).json({ message: "Election not found" });

    if (election.isActive)
      return res.status(403).json({ message: "Election still active" });

    // FAST → use snapshot if published
    if (election.resultsPublished) {
      return res.json({
        electionId,
        endedAt: election.endedAt,
        source: "Snapshot",
        results: election.resultsSnapshot
      });
    }

    // If not published → read blockchain
    const latestBlock = await safeGetBlockNumber();

    const logs = await provider.getLogs({
      address: process.env.VOTING_CONTRACT_ADDRESS,
      fromBlock: Number(process.env.DEPLOYMENT_BLOCK),
      toBlock: latestBlock
    });

    const iface = new ethers.Interface(votingAbi);
    const counts = {};

    for (const log of logs) {
      let parsed;
      try {
        parsed = iface.parseLog(log);
      } catch {
        continue;
      }

      if (parsed.name !== "VoteCast") continue;
      if (String(parsed.args.electionId) !== String(electionId)) continue;

      const cid = String(parsed.args.candidateId);
      counts[cid] = (counts[cid] || 0) + 1;
    }

    const candidates = await Candidate.find({ electionId });

    const results = candidates.map(c => ({
      candidateId: c.candidateId,
      name: c.name,
      party: c.party,
      votes: counts[c.candidateId] || 0
    }));

    res.json({
      electionId,
      endedAt: election.endedAt,
      source: "Blockchain Verified",
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Result calculation failed" });
  }
});

module.exports = router;
