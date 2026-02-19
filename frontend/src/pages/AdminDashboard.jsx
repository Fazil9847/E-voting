import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import AddVoterForm from "../components/AddVoterForm";
import AddCandidateForm from "../components/AddCandidateForm";
import UploadVoterPhoto from "../components/UploadVoterPhoto";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminDashboard() {
  const nav = useNavigate();

  const [adminName, setAdminName] = useState("");
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);

  const [newElectionId, setNewElectionId] = useState("");
  const [newElectionTitle, setNewElectionTitle] = useState("");

  const token = localStorage.getItem("admin_token");

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!token) {
      nav("/admin/login");
      return;
    }

    fetch(`${API}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminName(data.admin.name))
      .catch(() => {
        localStorage.removeItem("admin_token");
        nav("/admin/login");
      });
  }, [nav, token]);

  /* ---------------- FETCH ELECTIONS ---------------- */
 const fetchElections = async () => {
  const res = await fetch(`${API}/elections`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  setElections(data);

  // 🔑 FIX: re-sync selectedElection from fresh data
  if (selectedElection) {
    const updated = data.find(
      e => e.electionId === selectedElection.electionId
    );
    setSelectedElection(updated || null);
  } else if (data.length > 0) {
    setSelectedElection(data[0]);
  }
};


  useEffect(() => {
    fetchElections();
  }, []);

  /* ---------------- CREATE ELECTION ---------------- */
  const createElection = async () => {
    if (!newElectionId || !newElectionTitle) {
      alert("Election ID and title required");
      return;
    }

    const res = await fetch(`${API}/elections`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        electionId: newElectionId,
        title: newElectionTitle
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Election created successfully");
    setNewElectionId("");
    setNewElectionTitle("");
    fetchElections();
  };

  /* ---------------- START ELECTION ---------------- */
  const startElection = async (id) => {
    try {
      const res = await fetch(`${API}/elections/${id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);
      fetchElections();
    } catch {
      alert("Failed to start election");
    }
  };

  /* ---------------- END ELECTION ---------------- */
  const endElection = async (id) => {
    try {
      const res = await fetch(`${API}/elections/${id}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);
      fetchElections();
    } catch {
      alert("Failed to end election");
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = () => {
    localStorage.removeItem("admin_token");
    nav("/admin/login");
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <h2 style={{ color: "white" }}>
          Admin Dashboard {adminName && `- ${adminName}`}
        </h2>

        {/* ---------------- SELECT ELECTION ---------------- */}
        <Card style={{ marginTop: 20 }}>
          <CardContent>
            <h3>Select Election</h3>

            <select
              value={selectedElection?.electionId || ""}
              onChange={(e) => {
                const el = elections.find(x => x.electionId === e.target.value);
                setSelectedElection(el);
              }}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            >
              <option value="">-- Select Election --</option>
              {elections.map(e => (
                <option key={e.electionId} value={e.electionId}>
                  {e.title}
                </option>
              ))}
            </select>

            {selectedElection && (
              <>
                {/* STATUS BADGE */}
                <p style={{ marginBottom: 12 }}>
                  Status:{" "}
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 14,
                      background: selectedElection.isActive ? "#16a34a" : "#dc2626",
                      color: "white"
                    }}
                  >
                    {selectedElection.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                 <Button
  disabled={selectedElection.isActive}
  onClick={() => startElection(selectedElection.electionId)}
>
  Start Election
</Button>

<Button
  disabled={!selectedElection.isActive}
  variant="destructive"
  onClick={() => endElection(selectedElection.electionId)}
>
  End Election
</Button>

                  <Button
                    variant="outline"
                    onClick={() => nav(`/admin/results/${selectedElection.electionId}`)}
                  >
                    Results
                  </Button>

                  <Button
                    onClick={() =>
                      nav("/admin/scan", { state: { election: selectedElection } })
                    }
                  >
                    Scan QR
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ---------------- CREATE ELECTION ---------------- */}
        <Card style={{ marginTop: 20 }}>
          <CardContent>
            <h3>Create New Election</h3>

            <input
              placeholder="Election ID"
              value={newElectionId}
              onChange={e => setNewElectionId(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />

            <input
              placeholder="Election Title"
              value={newElectionTitle}
              onChange={e => setNewElectionTitle(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />

            <Button onClick={createElection}>Create Election</Button>
          </CardContent>
        </Card>

        {/* ---------------- ADD CANDIDATE ---------------- */}
        {selectedElection && (
          <div style={{ marginTop: 30 }}>
            <h3 style={{ color: "white" }}>
              Add Candidate ({selectedElection.title})
            </h3>
            <Card>
              <CardContent>
                <AddCandidateForm electionId={selectedElection.electionId} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------------- ADD VOTER ---------------- */}
        <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "white" }}>Add Voter</h3>
          <Card>
            <CardContent>
              <AddVoterForm />
            </CardContent>
          </Card>
        </div>

        {/* ---------------- UPLOAD PHOTO ---------------- */}
        <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "white" }}>Upload Voter Photo</h3>
          <Card>
            <CardContent>
              <UploadVoterPhoto />
            </CardContent>
          </Card>
        </div>

        {/* ---------------- LOGOUT ---------------- */}
        <div style={{ marginTop: 40, textAlign: "right" }}>
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
        </div>

      </div>
    </div>
  );
}
