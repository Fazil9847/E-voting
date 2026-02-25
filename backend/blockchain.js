const { ethers } = require("ethers");
require("dotenv").config();

/* =====================================================
   🔵 STABLE RPC PROVIDER (No ECONNRESET / No timeout)
===================================================== */

const provider = new ethers.JsonRpcProvider(
  process.env.POLYGON_RPC_URL,
  undefined,
  {
    staticNetwork: true,      // prevents network detection crash
    polling: true,
    pollingInterval: 4000,    // stable polling
    timeout: 60000            // 60s timeout
  }
);

// 🔁 Log RPC issues (does not crash server)
provider.on("error", (err) => {
  console.log("⚠️ RPC Error:", err.code || err.message);
});

/* =====================================================
   🔵 WALLET (Admin signs transaction)
===================================================== */

const wallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  provider
);

/* =====================================================
   🔵 CONTRACT ABI (MUST match deployed contract)
===================================================== */
const votingAbi = [
  "event VoteCast(bytes32 indexed voterHash, string electionId, string candidateId)",
  "event ElectionStarted(string electionId)",
  "event ElectionEnded(string electionId)",

  "function castVote(bytes32 voterHash, string electionId, string candidateId)",
  "function startElection(string electionId)",
  "function endElection(string electionId)",

  "function getVoteCount(string electionId, string candidateId) view returns (uint256)",
  "function isElectionActive(string electionId) view returns (bool)",
  "function hasUserVoted(string electionId, bytes32 voterHash) view returns (bool)"
];
/* =====================================================
   🔵 CONTRACT INSTANCE
===================================================== */

const contract = new ethers.Contract(
  process.env.VOTING_CONTRACT_ADDRESS,
  votingAbi,
  wallet
);

/* =====================================================
   🔵 LOG INFO
===================================================== */

console.log("Wallet:", wallet.address);
console.log("Blockchain connected:", process.env.VOTING_CONTRACT_ADDRESS);

/* =====================================================
   🔵 EXPORT
===================================================== */

module.exports = {
  provider,
  contract,
  votingAbi
};
