import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import RequestAccess from './pages/RequestAccess';
import PendingApproval from './pages/PendingApproval';
import WaitingRoom from './pages/WaitingRoom';

export default function App() {
  return (
    <div>
      <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
        <Link to="/">OmideNo7 Meetings</Link> | <Link to="/pending">Pending</Link> | <Link to="/waiting">Waiting</Link>
      </header>
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<RequestAccess />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/waiting" element={<WaitingRoom />} />
        </Routes>
      </main>
    </div>
  );
}
