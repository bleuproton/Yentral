import React from "react";

export const TenantSwitcher: React.FC<{ tenantName?: string }> = ({ tenantName }) => {
  return (
    <div style={{ fontWeight: 600, fontSize: 14 }}>
      {tenantName ?? "Active tenant"}
    </div>
  );
};
