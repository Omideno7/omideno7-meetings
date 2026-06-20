import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PendingApproval() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      const res = await axios.get('/api/requests/pending');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>درخواست‌های در انتظار</h2>
      {requests.length === 0 && <div>درخواستی وجود ندارد.</div>}
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
            <div><strong>{r.fullName}</strong> — {r.email}</div>
            <div>کشور: {r.country || '—'} | زبان: {r.language || '—'}</div>
            <div style={{ marginTop: 8 }}>{r.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
