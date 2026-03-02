import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, BarChart3, ShieldCheck } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container">
      
      {/* ===== HEADER ===== */}
      <div className="header">
        <h1>CampusVote</h1>
        <p>
          Secure and transparent college elections powered by blockchain
          technology. Tamper-proof, verifiable and trusted.
        </p>
      </div>

      {/* ===== MAIN ACTION CARDS ===== */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        
        {/* VOTER CARD */}
        <Card>
          <div
            className="icon"
            style={{ background: "linear-gradient(90deg,#2563EB,#7C3AED)" }}
          >
            <Users color="white" />
          </div>

          <h3>Voter Portal</h3>
          <p>
            Login securely and cast your vote using OTP and QR authentication.
          </p>

          <div style={{ width: "100%", marginTop: "auto" }}>
            <Button
              className="w-full"
              onClick={() => navigate("/voter/login")}
            >
              Start Voting
            </Button>
          </div>
        </Card>

        {/* RESULTS CARD */}
        <Card>
          <div
            className="icon"
            style={{ background: "linear-gradient(90deg,#059669,#06B6D4)" }}
          >
            <BarChart3 color="white" />
          </div>

          <h3>Election Results</h3>
          <p>
            View officially published election results with complete transparency.
          </p>

          <div style={{ width: "100%", marginTop: "auto" }}>
            <Button
              className="w-full"
              onClick={() => navigate("/results/election-2025-01")}
            >
              View Results
            </Button>
          </div>
        </Card>
      </div>

      {/* ===== TRUST FEATURES ===== */}
      <div className="features" style={{ marginTop: "60px" }}>
        
        <div className="feature">
          <ShieldCheck size={32} />
          <h4>Blockchain Secured</h4>
          <p>Votes are recorded immutably on Ethereum smart contracts.</p>
        </div>

        <div className="feature">
          <BarChart3 size={32} />
          <h4>Transparent Results</h4>
          <p>Results are publicly verifiable and tamper-resistant.</p>
        </div>

        <div className="feature">
          <Users size={32} />
          <h4>Verified Voters</h4>
          <p>OTP, QR, and identity verification ensure secure participation.</p>
        </div>

      </div>
    </div>
  );
}