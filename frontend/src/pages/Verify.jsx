import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Verify() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const nav = useNavigate();
  

  const check = () => {
    if (!hash.trim()) return toast.error("Enter tx hash");
    // Mock verification
    setResult({ election_title: "Student Council 2025", candidate: { name: "Niyas" }, timestamp: new Date().toISOString(), tx_hash: hash });
    toast.success("Transaction verified (demo)");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 720 }}>
        <CardContent>
          <h2>Verify Transaction</h2>
          <Label>Transaction Hash</Label>
          <Input value={hash} onChange={(e) => setHash(e.target.value)} placeholder="Enter transaction hash" />
          <div style={{ marginTop: 12 }}>
            <Button onClick={check} style={{ margin: 5 }}>Verify</Button>
              <Button onClick={() => nav("/")}  >Back</Button>
          </div>

          {result && (
            <div style={{ background: "#ECFDF5", padding: 12, borderRadius: 8, marginTop: 12 }}>
              <div><strong>Election:</strong> {result.election_title}</div>
              <div><strong>Candidate:</strong> {result.candidate.name}</div>
              <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{result.tx_hash}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
