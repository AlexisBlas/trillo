import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Database types
export interface Trail {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  difficulty: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrailReport {
  id: string;
  trail_id: string | null;
  park_name: string | null;
  user_id: string;
  status: 'green' | 'yellow' | 'red';
  conditions: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrailReportWithDetails extends TrailReport {
  trails: Trail | null;
  profiles: {
    id: string;
    email: string;
  };
}

// Create Supabase client
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
