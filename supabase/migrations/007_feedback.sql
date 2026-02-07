-- Feature request / feedback dashboard

-- Enums
CREATE TYPE feedback_status AS ENUM ('open', 'planned', 'in_progress', 'completed', 'declined');
CREATE TYPE feedback_category AS ENUM ('feature_request', 'bug_report', 'improvement');

-- Feedback posts
CREATE TABLE feedback_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category feedback_category NOT NULL DEFAULT 'feature_request',
  status feedback_status NOT NULL DEFAULT 'open',
  vote_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  status_changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_posts_status ON feedback_posts(status);
CREATE INDEX idx_feedback_posts_category ON feedback_posts(category);
CREATE INDEX idx_feedback_posts_vote_count ON feedback_posts(vote_count DESC);
CREATE INDEX idx_feedback_posts_created_at ON feedback_posts(created_at DESC);
CREATE INDEX idx_feedback_posts_author ON feedback_posts(author_id);

-- Feedback votes (one per user per post)
CREATE TABLE feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_feedback_votes_post ON feedback_votes(post_id);
CREATE INDEX idx_feedback_votes_user ON feedback_votes(user_id);

-- Feedback comments (threaded, 1-level nesting)
CREATE TABLE feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feedback_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_comments_post ON feedback_comments(post_id);
CREATE INDEX idx_feedback_comments_parent ON feedback_comments(parent_id);
CREATE INDEX idx_feedback_comments_author ON feedback_comments(author_id);

-- Triggers: auto-update updated_at (reuse existing function)
CREATE TRIGGER update_feedback_posts_updated_at
  BEFORE UPDATE ON feedback_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feedback_comments_updated_at
  BEFORE UPDATE ON feedback_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: sync vote_count on feedback_posts
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts SET vote_count = vote_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_feedback_vote_count
  AFTER INSERT OR DELETE ON feedback_votes
  FOR EACH ROW EXECUTE FUNCTION update_feedback_vote_count();

-- Trigger: sync comment_count on feedback_posts
CREATE OR REPLACE FUNCTION update_feedback_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_feedback_comment_count
  AFTER INSERT OR DELETE ON feedback_comments
  FOR EACH ROW EXECUTE FUNCTION update_feedback_comment_count();

-- RLS Policies
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Posts: public read
CREATE POLICY "Feedback posts are viewable by everyone"
  ON feedback_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create feedback posts"
  ON feedback_posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own feedback posts"
  ON feedback_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all feedback posts"
  ON feedback_posts FOR ALL
  USING (public.is_admin());

-- Votes: public read, auth insert/delete own
CREATE POLICY "Feedback votes are viewable by everyone"
  ON feedback_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON feedback_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own vote"
  ON feedback_votes FOR DELETE
  USING (user_id = auth.uid());

-- Comments: public read, auth create, own edit/delete, admin all
CREATE POLICY "Feedback comments are viewable by everyone"
  ON feedback_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON feedback_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own comments"
  ON feedback_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments"
  ON feedback_comments FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all feedback comments"
  ON feedback_comments FOR ALL
  USING (public.is_admin());
