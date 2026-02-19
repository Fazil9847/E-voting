import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminLogin() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!name.trim() || !password) {
      toast.error("Enter name and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Save token + admin info
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_name", data.admin?.name || name.trim());

      toast.success("Logged in");
      nav("/admin/dashboard");
    } catch (err) {
      console.error("admin login error:", err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 520 }}>
        <CardContent>
          <h2>Admin Login</h2>

          <Label>Admin Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="admin" />

          <Label style={{ marginTop: 8 }}>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />

          <div style={{ marginTop: 12 }}>
            <Button className="w-full" onClick={login} disabled={loading} style={{ margin: 8 }}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => nav("/")}>Back</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
