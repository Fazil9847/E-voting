import React from "react";

export function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #E5E7EB",
      }}
    />
  );
}
