-- Extend ip_license_type enum with full PilPreset values
ALTER TYPE ip_license_type ADD VALUE IF NOT EXISTS 'non-commercial-remix';
ALTER TYPE ip_license_type ADD VALUE IF NOT EXISTS 'cc-attribution';
