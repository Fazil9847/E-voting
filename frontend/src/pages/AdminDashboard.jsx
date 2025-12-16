import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import AddVoterForm from "../components/AddVoterForm";
import AddCandidateForm from "../components/AddCandidateForm";
import { Upload } from "lucide-react";
import UploadVoterPhoto from "../components/UploadVoterPhoto";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;
const elections = [
  { id: "election-2025-01", title: "Student Council Elections 2025" }
];

export default function AdminDashboard() {
  const nav = useNavigate();
  const [adminName, setAdminName] = useState("");

  // ✅ Protect admin dashboard
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      nav("/admin/login");
      return;
    }

    fetch(`${API}/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => setAdminName(data.admin.name))
      .catch(() => {
        localStorage.removeItem("admin_token");
        nav("/admin/login");
      });
  }, [nav]);

  // ✅ elections must be defined
  const elections = [
    { id: "election-2025-01", title: "Student Council Elections 2025" }
  ];
  const activeElection = elections[0]; // for now


  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ color: "white" }}>
          Admin Dashboard {adminName && `- ${adminName}`}
        </h2>

        {/* --- Election Cards --- */}
        {elections.map(e => (
          <Card key={e.id} style={{ marginTop: 16 }}>
            <CardContent>
              <h3>{e.title}</h3>
              <br />
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => nav("/admin/scan", { state: { election: e } })}>
                  Scan QR
                </Button>

                <Button
                  variant="outline"
                  onClick={() => nav(`/admin/results/${e.id}`)}
                  style={{ marginLeft: 8 }}
                >
                  Results
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* --- Add Voter Section --- */}
        <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "white" }}>Add Voter</h3>
          <Card style={{ marginTop: 12 }}>
            <CardContent>
              <AddVoterForm />
            </CardContent>
          </Card>
        </div>

      {/* --- Add Candidate Section --- */}
<div style={{ marginTop: 30 }}>
  <h3 style={{ color: "white" }}>Add Candidate</h3>
  <Card style={{ marginTop: 12 }}>
    <CardContent>
      <AddCandidateForm electionId={activeElection.id} />
    </CardContent>
  </Card>
</div>
   <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "white" }}>Add Voter</h3>
          <Card style={{ marginTop: 12 }}>
            <CardContent>
              <UploadVoterPhoto />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
