import React from 'react';

export default function ParentDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <nav style={{ padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>SafeWeb Jr</h2>
      </nav>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Parent Dashboard — Coming Soon</h2>
      </div>
    </div>
  );
}
