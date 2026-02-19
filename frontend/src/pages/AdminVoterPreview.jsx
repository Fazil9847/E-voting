import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const BASE =
  `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}`;

export default function AdminVoterPreview() {
  const nav = useNavigate();
  const loc = useLocation();

  const { student, election } = loc.state || {};

  if (!student || !election) {
    return <div style={{ padding: 20 }}>Invalid session</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Card style={{ width: 420 }}>
        <CardContent>
          <h2 style={{ textAlign: "center", marginBottom: 12 }}>
            Voter Verification
          </h2>

          {student.photo && (
            <img
              src={`${BASE}${student.photo}`}
              alt="Voter"
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto",
                display: "block"
              }}
            />
          )}

          <div style={{ marginTop: 16 }}>
            <p><strong>Name:</strong> {student.name}</p>
            <p><strong>Voter ID:</strong> {student.voterId}</p>
            <p><strong>Department:</strong> {student.department || "-"}</p>
            <p><strong>Election:</strong> {election.title}</p>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            <Button
              onClick={() =>
                nav("/admin/vote", {
                  state: { student, election }
                })
              }
            >
              ✅ Confirm & Proceed to Vote
            </Button>

            <Button
              variant="outline"
              onClick={() => nav("/admin/scan", { state: { election } })}
            >
              ❌ Cancel & Rescan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
