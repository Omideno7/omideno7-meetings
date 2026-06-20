import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import RequestAccess from './pages/RequestAccess';

export default function App() {
  return (
    <div>
      <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
        <Link to="/">OmideNo7 Meetings</Link>
      </header>
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<RequestAccess />} />
        </Routes>
      </main>
    </div>
  );
}
