-- Ideation Board: ideas, votes, comments, interest signaling

-- Enums
CREATE TYPE idea_status AS ENUM ('open', 'seeking_team', 'in_progress', 'built', 'archived');
CREATE TYPE idea_interest_role AS ENUM ('builder', 'designer', 'business', 'other');

-- Ideas
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status idea_status NOT NULL DEFAULT 'open',
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  interest_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ideas_author ON ideas(author_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_vote_count ON ideas(vote_count DESC);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_ideas_cohort ON ideas(cohort_id);
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);

-- Idea votes (one per user per idea)
CREATE TABLE idea_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

CREATE INDEX idx_idea_votes_idea ON idea_votes(idea_id);
CREATE INDEX idx_idea_votes_user ON idea_votes(user_id);

-- Idea comments (threaded, 1-level nesting)
CREATE TABLE idea_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES idea_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_idea_comments_idea ON idea_comments(idea_id);
CREATE INDEX idx_idea_comments_parent ON idea_comments(parent_id);
CREATE INDEX idx_idea_comments_author ON idea_comments(author_id);

-- Idea interests (one per user per idea)
CREATE TABLE idea_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role idea_interest_role NOT NULL DEFAULT 'builder',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

CREATE INDEX idx_idea_interests_idea ON idea_interests(idea_id);
CREATE INDEX idx_idea_interests_user ON idea_interests(user_id);

-- Triggers: auto-update updated_at (reuse existing function)
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_idea_comments_updated_at
  BEFORE UPDATE ON idea_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: sync vote_count on ideas
CREATE OR REPLACE FUNCTION update_idea_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET vote_count = vote_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET vote_count = vote_count - 1 WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_idea_vote_count
  AFTER INSERT OR DELETE ON idea_votes
  FOR EACH ROW EXECUTE FUNCTION update_idea_vote_count();

-- Trigger: sync comment_count on ideas
CREATE OR REPLACE FUNCTION update_idea_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET comment_count = comment_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET comment_count = comment_count - 1 WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_idea_comment_count
  AFTER INSERT OR DELETE ON idea_comments
  FOR EACH ROW EXECUTE FUNCTION update_idea_comment_count();

-- Trigger: sync interest_count on ideas
CREATE OR REPLACE FUNCTION update_idea_interest_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET interest_count = interest_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET interest_count = interest_count - 1 WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_idea_interest_count
  AFTER INSERT OR DELETE ON idea_interests
  FOR EACH ROW EXECUTE FUNCTION update_idea_interest_count();

-- RLS Policies
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_interests ENABLE ROW LEVEL SECURITY;

-- Ideas: public read, auth create, own update, admin all
CREATE POLICY "Ideas are viewable by everyone"
  ON ideas FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ideas"
  ON ideas FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own ideas"
  ON ideas FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all ideas"
  ON ideas FOR ALL
  USING (public.is_admin());

-- Votes: public read, auth insert/delete own
CREATE POLICY "Idea votes are viewable by everyone"
  ON idea_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on ideas"
  ON idea_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own idea vote"
  ON idea_votes FOR DELETE
  USING (user_id = auth.uid());

-- Comments: public read, auth create, own edit/delete, admin all
CREATE POLICY "Idea comments are viewable by everyone"
  ON idea_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment on ideas"
  ON idea_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own idea comments"
  ON idea_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own idea comments"
  ON idea_comments FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all idea comments"
  ON idea_comments FOR ALL
  USING (public.is_admin());

-- Interests: public read, auth create, own delete, admin all
CREATE POLICY "Idea interests are viewable by everyone"
  ON idea_interests FOR SELECT USING (true);

CREATE POLICY "Authenticated users can express interest"
  ON idea_interests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own interest"
  ON idea_interests FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all idea interests"
  ON idea_interests FOR ALL
  USING (public.is_admin());
