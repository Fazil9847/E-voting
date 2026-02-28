import React from "react";

export function RadioGroup({ children }) {
  return <div>{children}</div>;
}

export function RadioGroupItem({ id, value, checked, onChange }) {
  return (
    <input
      id={id}
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      style={{ width: 18, height: 18 }}
    />
  );
}
