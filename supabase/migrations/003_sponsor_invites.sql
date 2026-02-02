-- Sponsor Invites table for invite link flow
CREATE TABLE sponsor_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  sponsor_org_id UUID NOT NULL REFERENCES sponsor_orgs(id) ON DELETE CASCADE,
  email TEXT,  -- optional: restrict invite to specific email
  created_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsor_invites_token ON sponsor_invites(token);
CREATE INDEX idx_sponsor_invites_sponsor_org ON sponsor_invites(sponsor_org_id);
