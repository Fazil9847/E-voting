import React from "react";

export function Label({ children, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151" }} {...props}>
      {children}
    </label>
  );
}
