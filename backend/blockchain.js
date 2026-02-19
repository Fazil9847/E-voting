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
  "event VoteCast(bytes32 voterHash, string electionId, string candidateId)",
  "function castVote(bytes32 voterHash, string electionId, string candidateId)"
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
   🔵 SAFE BLOCK NUMBER (Auto retry)
===================================================== */

async function safeGetBlockNumber(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await provider.getBlockNumber();
    } catch (e) {
      console.log("Retrying RPC blockNumber...");
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("RPC unreachable");
}

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
  votingAbi,
  safeGetBlockNumber
};
