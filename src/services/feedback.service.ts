/**
 * Feedback Service
 * Handles feedback posts, voting, and comments
 */

import { createClient } from "@/lib/supabase/client";
import type { FeedbackPost, FeedbackComment, FeedbackCategory, FeedbackStatus } from "@/types";
import type { ServiceResponse, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

export interface FeedbackListOptions {
  page?: number;
  pageSize?: number;
  sort?: "trending" | "top" | "new";
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  search?: string;
}

export interface CreateFeedbackData {
  title: string;
  description: string;
  category: FeedbackCategory;
}

export interface FeedbackService {
  list(options?: FeedbackListOptions): Promise<PaginatedResponse<FeedbackPost>>;
  getById(id: string, currentUserId?: string): Promise<ServiceResponse<FeedbackPost | null>>;
  create(data: CreateFeedbackData, authorId: string): Promise<ServiceResponse<FeedbackPost>>;
  update(id: string, data: Partial<CreateFeedbackData>): Promise<ServiceResponse<FeedbackPost>>;
  updateStatus(id: string, status: FeedbackStatus, changedBy: string): Promise<ServiceResponse<FeedbackPost>>;
  delete(id: string): Promise<ServiceResponse<void>>;
  vote(postId: string, userId: string): Promise<ServiceResponse<void>>;
  unvote(postId: string, userId: string): Promise<ServiceResponse<void>>;
  getVotedPostIds(userId: string, postIds: string[]): Promise<ServiceResponse<Set<string>>>;
  getComments(postId: string): Promise<ServiceResponse<FeedbackComment[]>>;
  addComment(postId: string, authorId: string, body: string, parentId?: string): Promise<ServiceResponse<FeedbackComment>>;
  updateComment(id: string, body: string): Promise<ServiceResponse<FeedbackComment>>;
  deleteComment(id: string): Promise<ServiceResponse<void>>;
}

function toUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as "admin" | "sponsor" | "judge" | "participant",
    avatar: row.avatar as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function toFeedbackPost(row: Record<string, unknown>, hasVoted?: boolean): FeedbackPost {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    author: row.author ? toUser(row.author as Record<string, unknown>) : undefined,
    title: row.title as string,
    description: row.description as string,
    category: row.category as FeedbackCategory,
    status: row.status as FeedbackStatus,
    voteCount: row.vote_count as number,
    commentCount: row.comment_count as number,
    statusChangedBy: row.status_changed_by as string | undefined,
    statusChangedAt: row.status_changed_at ? new Date(row.status_changed_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    hasVoted,
  };
}

function toFeedbackComment(row: Record<string, unknown>): FeedbackComment {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    authorId: row.author_id as string,
    author: row.author ? toUser(row.author as Record<string, unknown>) : undefined,
    parentId: row.parent_id as string | undefined,
    body: row.body as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function buildCommentTree(comments: FeedbackComment[]): FeedbackComment[] {
  const topLevel: FeedbackComment[] = [];
  const childMap = new Map<string, FeedbackComment[]>();

  for (const comment of comments) {
    if (comment.parentId) {
      const children = childMap.get(comment.parentId) || [];
      children.push(comment);
      childMap.set(comment.parentId, children);
    } else {
      topLevel.push(comment);
    }
  }

  // Attach replies
  for (const comment of topLevel) {
    comment.replies = childMap.get(comment.id) || [];
  }

  return topLevel;
}

class FeedbackServiceImpl implements FeedbackService {
  private get supabase() {
    return createClient();
  }

  async list(options: FeedbackListOptions = {}): Promise<PaginatedResponse<FeedbackPost>> {
    const { page = 1, pageSize = 20, sort = "trending", status, category, search } = options;

    try {
      let query = this.supabase
        .from("feedback_posts")
        .select("*, author:users!feedback_posts_author_id_fkey(id, name, email, avatar, role, created_at)", { count: "exact" });

      if (status) {
        query = query.eq("status", status);
      }
      if (category) {
        query = query.eq("category", category);
      }
      if (search) {
        const sanitized = search.replace(/[%,().*\\]/g, '');
        if (sanitized.length > 0) {
          query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }

      // For "top" and "new", we can sort in the database
      if (sort === "top") {
        query = query.order("vote_count", { ascending: false });
      } else {
        // Both "trending" and "new" fetch by created_at DESC; trending will re-sort in JS
        query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        return { ...error(queryError.message, []), total: 0, page, pageSize, hasMore: false };
      }

      const posts = (data || []).map((row) => toFeedbackPost(row as Record<string, unknown>));

      // Trending sort: score = vote_count + (1 / (days_old + 2))
      if (sort === "trending") {
        const now = Date.now();
        posts.sort((a, b) => {
          const daysOldA = (now - a.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const daysOldB = (now - b.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const scoreA = a.voteCount + 1 / (daysOldA + 2);
          const scoreB = b.voteCount + 1 / (daysOldB + 2);
          return scoreB - scoreA;
        });
      }

      return paginated(posts, count || 0, page, pageSize);
    } catch (err) {
      return { ...error(err instanceof Error ? err.message : "Unknown error", []), total: 0, page, pageSize, hasMore: false };
    }
  }

  async getById(id: string, currentUserId?: string): Promise<ServiceResponse<FeedbackPost | null>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("feedback_posts")
        .select("*, author:users!feedback_posts_author_id_fkey(id, name, email, avatar, role, created_at)")
        .eq("id", id)
        .single();

      if (queryError?.code === "PGRST116") {
        return success(null);
      }

      if (queryError) {
        return error(queryError.message, null);
      }

      let hasVoted = false;
      if (currentUserId) {
        const { data: vote } = await this.supabase
          .from("feedback_votes")
          .select("id")
          .eq("post_id", id)
          .eq("user_id", currentUserId)
          .single();
        hasVoted = !!vote;
      }

      return success(toFeedbackPost(data as Record<string, unknown>, hasVoted));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", null);
    }
  }

  async create(data: CreateFeedbackData, authorId: string): Promise<ServiceResponse<FeedbackPost>> {
    try {
      const { data: created, error: insertError } = await this.supabase
        .from("feedback_posts")
        .insert({
          author_id: authorId,
          title: data.title,
          description: data.description,
          category: data.category,
        })
        .select("*, author:users!feedback_posts_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (insertError) {
        return error(insertError.message);
      }

      return success(toFeedbackPost(created as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async update(id: string, data: Partial<CreateFeedbackData>): Promise<ServiceResponse<FeedbackPost>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;

      const { data: updated, error: updateError } = await this.supabase
        .from("feedback_posts")
        .update(updateData)
        .eq("id", id)
        .select("*, author:users!feedback_posts_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (updateError) {
        return error(updateError.message);
      }

      return success(toFeedbackPost(updated as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async updateStatus(id: string, status: FeedbackStatus, changedBy: string): Promise<ServiceResponse<FeedbackPost>> {
    try {
      const { data: updated, error: updateError } = await this.supabase
        .from("feedback_posts")
        .update({
          status,
          status_changed_by: changedBy,
          status_changed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, author:users!feedback_posts_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (updateError) {
        return error(updateError.message);
      }

      return success(toFeedbackPost(updated as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("feedback_posts")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return error(deleteError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async vote(postId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error: insertError } = await this.supabase
        .from("feedback_votes")
        .insert({ post_id: postId, user_id: userId });

      if (insertError) {
        return error(insertError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async unvote(postId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("feedback_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (deleteError) {
        return error(deleteError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async getVotedPostIds(userId: string, postIds: string[]): Promise<ServiceResponse<Set<string>>> {
    try {
      if (postIds.length === 0) return success(new Set());

      const { data, error: queryError } = await this.supabase
        .from("feedback_votes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      if (queryError) {
        return error(queryError.message, new Set());
      }

      return success(new Set((data || []).map((v) => v.post_id)));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", new Set());
    }
  }

  async getComments(postId: string): Promise<ServiceResponse<FeedbackComment[]>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("feedback_comments")
        .select("*, author:users!feedback_comments_author_id_fkey(id, name, email, avatar, role, created_at)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (queryError) {
        return error(queryError.message, []);
      }

      const flat = (data || []).map((row) => toFeedbackComment(row as Record<string, unknown>));
      return success(buildCommentTree(flat));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", []);
    }
  }

  async addComment(postId: string, authorId: string, body: string, parentId?: string): Promise<ServiceResponse<FeedbackComment>> {
    try {
      const { data: created, error: insertError } = await this.supabase
        .from("feedback_comments")
        .insert({
          post_id: postId,
          author_id: authorId,
          body,
          parent_id: parentId || null,
        })
        .select("*, author:users!feedback_comments_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (insertError) {
        return error(insertError.message);
      }

      return success(toFeedbackComment(created as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async updateComment(id: string, body: string): Promise<ServiceResponse<FeedbackComment>> {
    try {
      const { data: updated, error: updateError } = await this.supabase
        .from("feedback_comments")
        .update({ body })
        .eq("id", id)
        .select("*, author:users!feedback_comments_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (updateError) {
        return error(updateError.message);
      }

      return success(toFeedbackComment(updated as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async deleteComment(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("feedback_comments")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return error(deleteError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }
}

export const feedbackService = new FeedbackServiceImpl();
