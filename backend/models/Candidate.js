const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: String,
  candidateId: { type: String, required: true },
  electionId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);
