-- Trail Scope Database Schema
-- Created: 2026-06-06

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trails table
CREATE TABLE IF NOT EXISTS trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trail reports table
CREATE TABLE IF NOT EXISTS trail_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('green', 'yellow', 'red')),
  conditions TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table for user metadata (optional but useful)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trails_qr_code ON trails(qr_code);
CREATE INDEX IF NOT EXISTS idx_trail_reports_trail_id_created_at ON trail_reports(trail_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trail_reports_user_id ON trail_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_reports_created_at ON trail_reports(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_trails_updated_at BEFORE UPDATE ON trails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trail_reports_updated_at BEFORE UPDATE ON trail_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Trails policies
CREATE POLICY "Trails are viewable by everyone"
  ON trails FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert trails"
  ON trails FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trails"
  ON trails FOR UPDATE
  TO authenticated
  USING (true);

-- Trail reports policies
CREATE POLICY "Trail reports are viewable by everyone"
  ON trail_reports FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert trail reports"
  ON trail_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trail reports"
  ON trail_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trail reports"
  ON trail_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample trails for Puerto Rico
INSERT INTO trails (name, location, description, qr_code) VALUES
  ('El Yunque Peak Trail', 'El Yunque National Forest', 'Challenging trail to the highest peak in El Yunque with stunning rainforest views', 'TRAIL_YUNQUE_PEAK'),
  ('La Mina Trail', 'El Yunque National Forest', 'Popular trail leading to beautiful La Mina waterfall', 'TRAIL_LA_MINA'),
  ('Mount Britton Trail', 'El Yunque National Forest', 'Moderate trail to historic observation tower', 'TRAIL_MT_BRITTON'),
  ('Camino del Guajataka', 'Guajataka Forest Reserve', 'Mountain biking trail through karst forest', 'TRAIL_GUAJATAKA'),
  ('Bosque Estatal de Guánica', 'Guánica', 'Dry forest trails with coastal views', 'TRAIL_GUANICA'),
  ('Pico del Este Trail', 'Toro Negro Forest', 'Trail to one of Puerto Rico''s highest peaks', 'TRAIL_PICO_ESTE')
ON CONFLICT (name) DO NOTHING;
