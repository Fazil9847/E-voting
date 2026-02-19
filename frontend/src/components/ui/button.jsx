import React from "react";

export function Button({ children, className = "", variant, ...props }) {
  const base = "btn " + (className || "");
  const v = variant === "secondary" ? "secondary" : variant === "positive" ? "positive" : "primary";
  return (
    <button className={`${base} ${v}`} {...props}>
      {children}
    </button>
  );
}
