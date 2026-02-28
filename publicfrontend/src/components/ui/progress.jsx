import React from "react";

export function Progress({ value = 0, className = "" }) {
  return (
    <div className={className} style={{ background: "#E5E7EB", height: 8, borderRadius: 6 }}>
      <div style={{ width: `${value}%`, height: "100%", background: "#4F46E5", borderRadius: 6 }} />
    </div>
  );
}
