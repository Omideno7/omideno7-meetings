import { Injectable } from '@nestjs/common';

@Injectable()
export class SupabaseService {
  private url: string;
  private serviceKey: string;

  constructor() {
    this.url = process.env.SUPABASE_URL || '';
    this.serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
    if (!this.url || !this.serviceKey) {
      // Not throwing here so local dev can continue without Supabase; methods will throw if used.
      console.warn('SupabaseService: SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Supabase features disabled.');
    }
  }

  // Create a user via Supabase Admin API (requires service role key)
  async createUser(email: string, password: string, metadata: Record<string, any> = {}) {
    if (!this.url || !this.serviceKey) throw new Error('Supabase not configured');

    const res = await fetch(`${this.url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.serviceKey}`,
      },
      body: JSON.stringify({ email, password, user_metadata: metadata }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase createUser failed: ${res.status} ${text}`);
    }

    return res.json();
  }

  // Verify a client JWT by calling the user endpoint (simple, network-backed check)
  async verifyToken(token: string) {
    if (!this.url) throw new Error('Supabase not configured');
    const res = await fetch(`${this.url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  }
}
