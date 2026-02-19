import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, Shield, CheckCircle } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="header">
        <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
        <h1>CampusVote</h1>
        <p>Blockchain-powered secure college elections. Transparent, tamper-proof, and verifiable voting system.</p>
      </div>

      <div className="grid">
        <Card>
          <div className="icon" style={{ background: "linear-gradient(90deg,#60A5FA,#7C3AED)" }}>
            <Users color="white" />
          </div>
          <h3>I'm a Voter</h3>
          <p>Cast your vote securely using QR authentication</p>
          <div style={{ width: "100%", marginTop: "auto" }}>
            <Button className="w-full" onClick={() => navigate("/voter/login")}>
              Start Voting
            </Button>
          </div>
        </Card>

        <Card>
          <div className="icon" style={{ background: "linear-gradient(90deg,#FB923C,#EF4444)" }}>
            <Shield color="white" />
          </div>
          <h3>Admin Portal</h3>
          <p>Manage elections and verify votes on blockchain</p>
          <div style={{ width: "100%", marginTop: "auto" }}>
            <Button className="w-full" variant="secondary" onClick={() => navigate("/admin/login")}>
              Admin Login
            </Button>
          </div>
        </Card>

        <Card>
          <div className="icon" style={{ background: "linear-gradient(90deg,#10B981,#06B6D4)" }}>
            <CheckCircle color="white" />
          </div>
          <h3>Election Result</h3>
          <p>see the vote election results</p>
          <div style={{ width: "100%", marginTop: "auto" }}>
            <Button className="w-full" variant="positive" onClick={() => navigate("/results/election-2025-01")}>
               Result
            </Button>
          </div>
        </Card>
      </div>

      <div className="features">
        <div className="feature">
          <div style={{ fontSize: 28 }}>🛡️</div>
          <h4>Blockchain Secured</h4>
          <p>Every vote recorded immutably on Ethereum</p>
        </div>
        <div className="feature">
          <div style={{ fontSize: 28 }}>🔐</div>
          <h4>QR Authentication</h4>
          <p>No MetaMask needed for voters</p>
        </div>
        <div className="feature">
          <div style={{ fontSize: 28 }}>🔎</div>
          <h4>Result</h4>
          <p>Transparent and auditable results</p>
        </div>
      </div>
    </div>
  );
}
