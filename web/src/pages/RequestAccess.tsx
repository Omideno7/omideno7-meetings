import React, { useState } from 'react';
import axios from 'axios';

export default function RequestAccess() {
  const [form, setForm] = useState({ fullName: '', email: '', reason: '' });
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post('/api/requests', form);
      setSent(true);
    } catch (err) {
      console.error(err);
      alert('Error submitting request');
    }
  }

  if (sent) return <div>درخواست شما ثبت شد. لطفا منتظر تایید باشید.</div>;

  return (
    <form onSubmit={submit} style={{ maxWidth: 600 }}>
      <div>
        <label>نام کامل</label>
        <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
      </div>
      <div>
        <label>ایمیل</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <label>چرا میخواهید وارد شوید؟</label>
        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
      </div>
      <button type="submit">ارسال درخواست</button>
    </form>
  );
}
