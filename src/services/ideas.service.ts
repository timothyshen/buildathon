/**
 * Ideas Service
 * Handles ideas CRUD, voting, comments, and interest signaling
 */

import { createClient } from "@/lib/supabase/client";
import type { Idea, IdeaComment, IdeaInterest, IdeaStatus, IdeaInterestRole } from "@/types";
import type { ServiceResponse, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";
import { notificationsService } from "./notifications.service";

export interface IdeasListOptions {
  page?: number;
  pageSize?: number;
  sort?: "trending" | "newest" | "seeking_team";
  tags?: string[];
  status?: IdeaStatus;
  authorId?: string;
  search?: string;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  tags: string[];
  cohortId?: string;
}

export interface IdeasService {
  list(options?: IdeasListOptions): Promise<PaginatedResponse<Idea>>;
  getById(id: string, currentUserId?: string): Promise<ServiceResponse<Idea | null>>;
  create(data: CreateIdeaData, authorId: string): Promise<ServiceResponse<Idea>>;
  update(id: string, data: Partial<CreateIdeaData> & { status?: IdeaStatus }): Promise<ServiceResponse<Idea>>;
  delete(id: string): Promise<ServiceResponse<void>>;
  vote(ideaId: string, userId: string): Promise<ServiceResponse<void>>;
  unvote(ideaId: string, userId: string): Promise<ServiceResponse<void>>;
  getVotedIdeaIds(userId: string, ideaIds: string[]): Promise<ServiceResponse<Set<string>>>;
  getComments(ideaId: string): Promise<ServiceResponse<IdeaComment[]>>;
  addComment(ideaId: string, authorId: string, body: string, parentId?: string): Promise<ServiceResponse<IdeaComment>>;
  updateComment(id: string, body: string): Promise<ServiceResponse<IdeaComment>>;
  deleteComment(id: string): Promise<ServiceResponse<void>>;
  getInterests(ideaId: string): Promise<ServiceResponse<IdeaInterest[]>>;
  addInterest(ideaId: string, userId: string, role: IdeaInterestRole, message?: string): Promise<ServiceResponse<IdeaInterest>>;
  removeInterest(ideaId: string, userId: string): Promise<ServiceResponse<void>>;
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

function toIdea(row: Record<string, unknown>, hasVoted?: boolean): Idea {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    tags: (row.tags as string[]) || [],
    authorId: row.author_id as string,
    author: row.author ? toUser(row.author as Record<string, unknown>) : undefined,
    status: row.status as IdeaStatus,
    cohortId: row.cohort_id as string | undefined,
    submissionId: row.submission_id as string | undefined,
    voteCount: row.vote_count as number,
    commentCount: row.comment_count as number,
    interestCount: row.interest_count as number,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    hasVoted,
  };
}

function toIdeaComment(row: Record<string, unknown>): IdeaComment {
  return {
    id: row.id as string,
    ideaId: row.idea_id as string,
    authorId: row.author_id as string,
    author: row.author ? toUser(row.author as Record<string, unknown>) : undefined,
    parentId: row.parent_id as string | undefined,
    body: row.body as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function toIdeaInterest(row: Record<string, unknown>): IdeaInterest {
  return {
    id: row.id as string,
    ideaId: row.idea_id as string,
    userId: row.user_id as string,
    user: row.user ? toUser(row.user as Record<string, unknown>) : undefined,
    role: row.role as IdeaInterestRole,
    message: row.message as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function buildCommentTree(comments: IdeaComment[]): IdeaComment[] {
  const topLevel: IdeaComment[] = [];
  const childMap = new Map<string, IdeaComment[]>();

  for (const comment of comments) {
    if (comment.parentId) {
      const children = childMap.get(comment.parentId) || [];
      children.push(comment);
      childMap.set(comment.parentId, children);
    } else {
      topLevel.push(comment);
    }
  }

  for (const comment of topLevel) {
    comment.replies = childMap.get(comment.id) || [];
  }

  return topLevel;
}

const AUTHOR_SELECT = "*, author:users!ideas_author_id_fkey(id, name, email, avatar, role, created_at)";

class IdeasServiceImpl implements IdeasService {
  private get supabase() {
    return createClient();
  }

  async list(options: IdeasListOptions = {}): Promise<PaginatedResponse<Idea>> {
    const { page = 1, pageSize = 18, sort = "trending", tags, status, authorId, search } = options;

    try {
      let query = this.supabase
        .from("ideas")
        .select(AUTHOR_SELECT, { count: "exact" });

      if (status) {
        query = query.eq("status", status);
      }
      if (authorId) {
        query = query.eq("author_id", authorId);
      }
      if (tags && tags.length > 0) {
        query = query.overlaps("tags", tags);
      }
      if (search) {
        const sanitized = search.replace(/[%,().*\\]/g, "");
        if (sanitized.length > 0) {
          query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }

      if (sort === "seeking_team") {
        query = query.eq("status", "seeking_team").order("created_at", { ascending: false });
      } else if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else {
        // trending — fetch by created_at, re-sort client-side
        query = query.order("created_at", { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        return { ...error(queryError.message, []), total: 0, page, pageSize, hasMore: false };
      }

      const ideas = (data || []).map((row) => toIdea(row as Record<string, unknown>));

      if (sort === "trending") {
        const now = Date.now();
        ideas.sort((a, b) => {
          const daysOldA = (now - a.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const daysOldB = (now - b.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const scoreA = a.voteCount + 1 / (daysOldA + 2);
          const scoreB = b.voteCount + 1 / (daysOldB + 2);
          return scoreB - scoreA;
        });
      }

      return paginated(ideas, count || 0, page, pageSize);
    } catch (err) {
      return { ...error(err instanceof Error ? err.message : "Unknown error", []), total: 0, page, pageSize, hasMore: false };
    }
  }

  async getById(id: string, currentUserId?: string): Promise<ServiceResponse<Idea | null>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("ideas")
        .select(AUTHOR_SELECT)
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
          .from("idea_votes")
          .select("id")
          .eq("idea_id", id)
          .eq("user_id", currentUserId)
          .single();
        hasVoted = !!vote;
      }

      return success(toIdea(data as Record<string, unknown>, hasVoted));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", null);
    }
  }

  async create(data: CreateIdeaData, authorId: string): Promise<ServiceResponse<Idea>> {
    try {
      const { data: created, error: insertError } = await this.supabase
        .from("ideas")
        .insert({
          author_id: authorId,
          title: data.title,
          description: data.description,
          tags: data.tags,
          cohort_id: data.cohortId || null,
        })
        .select(AUTHOR_SELECT)
        .single();

      if (insertError) {
        return error(insertError.message);
      }

      return success(toIdea(created as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async update(id: string, data: Partial<CreateIdeaData> & { status?: IdeaStatus }): Promise<ServiceResponse<Idea>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.cohortId !== undefined) updateData.cohort_id = data.cohortId;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: updated, error: updateError } = await this.supabase
        .from("ideas")
        .update(updateData)
        .eq("id", id)
        .select(AUTHOR_SELECT)
        .single();

      if (updateError) {
        return error(updateError.message);
      }

      return success(toIdea(updated as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("ideas")
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

  async vote(ideaId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error: insertError } = await this.supabase
        .from("idea_votes")
        .insert({ idea_id: ideaId, user_id: userId });

      if (insertError) {
        return error(insertError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async unvote(ideaId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("idea_votes")
        .delete()
        .eq("idea_id", ideaId)
        .eq("user_id", userId);

      if (deleteError) {
        return error(deleteError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async getVotedIdeaIds(userId: string, ideaIds: string[]): Promise<ServiceResponse<Set<string>>> {
    try {
      if (ideaIds.length === 0) return success(new Set());

      const { data, error: queryError } = await this.supabase
        .from("idea_votes")
        .select("idea_id")
        .eq("user_id", userId)
        .in("idea_id", ideaIds);

      if (queryError) {
        return error(queryError.message, new Set());
      }

      return success(new Set((data || []).map((v) => v.idea_id)));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", new Set());
    }
  }

  async getComments(ideaId: string): Promise<ServiceResponse<IdeaComment[]>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("idea_comments")
        .select("*, author:users!idea_comments_author_id_fkey(id, name, email, avatar, role, created_at)")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true });

      if (queryError) {
        return error(queryError.message, []);
      }

      const flat = (data || []).map((row) => toIdeaComment(row as Record<string, unknown>));
      return success(buildCommentTree(flat));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", []);
    }
  }

  async addComment(ideaId: string, authorId: string, body: string, parentId?: string): Promise<ServiceResponse<IdeaComment>> {
    try {
      const { data: created, error: insertError } = await this.supabase
        .from("idea_comments")
        .insert({
          idea_id: ideaId,
          author_id: authorId,
          body,
          parent_id: parentId || null,
        })
        .select("*, author:users!idea_comments_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (insertError) {
        return error(insertError.message);
      }

      // Notify idea author (if commenter is not the author)
      try {
        const { data: idea } = await this.supabase
          .from("ideas")
          .select("author_id, title")
          .eq("id", ideaId)
          .single();

        if (idea && idea.author_id !== authorId) {
          const comment = toIdeaComment(created as Record<string, unknown>);
          await notificationsService.create({
            userId: idea.author_id,
            type: "idea_comment",
            title: "New comment on your idea",
            body: `${comment.author?.name || "Someone"} commented on: ${idea.title}`,
            href: `/ideas/${ideaId}`,
          });
        }
      } catch {
        // Non-critical — don't fail the comment creation
      }

      return success(toIdeaComment(created as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async updateComment(id: string, body: string): Promise<ServiceResponse<IdeaComment>> {
    try {
      const { data: updated, error: updateError } = await this.supabase
        .from("idea_comments")
        .update({ body })
        .eq("id", id)
        .select("*, author:users!idea_comments_author_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (updateError) {
        return error(updateError.message);
      }

      return success(toIdeaComment(updated as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async deleteComment(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("idea_comments")
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

  async getInterests(ideaId: string): Promise<ServiceResponse<IdeaInterest[]>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("idea_interests")
        .select("*, user:users!idea_interests_user_id_fkey(id, name, email, avatar, role, created_at)")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true });

      if (queryError) {
        return error(queryError.message, []);
      }

      return success((data || []).map((row) => toIdeaInterest(row as Record<string, unknown>)));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", []);
    }
  }

  async addInterest(ideaId: string, userId: string, role: IdeaInterestRole, message?: string): Promise<ServiceResponse<IdeaInterest>> {
    try {
      const { data: created, error: insertError } = await this.supabase
        .from("idea_interests")
        .insert({
          idea_id: ideaId,
          user_id: userId,
          role,
          message: message || null,
        })
        .select("*, user:users!idea_interests_user_id_fkey(id, name, email, avatar, role, created_at)")
        .single();

      if (insertError) {
        return error(insertError.message);
      }

      // Notify idea author
      try {
        const { data: idea } = await this.supabase
          .from("ideas")
          .select("author_id, title")
          .eq("id", ideaId)
          .single();

        if (idea && idea.author_id !== userId) {
          const interest = toIdeaInterest(created as Record<string, unknown>);
          await notificationsService.create({
            userId: idea.author_id,
            type: "idea_interest",
            title: "Someone wants to build your idea",
            body: `${interest.user?.name || "Someone"} is interested in: ${idea.title}`,
            href: `/ideas/${ideaId}`,
          });
        }
      } catch {
        // Non-critical
      }

      return success(toIdeaInterest(created as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async removeInterest(ideaId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error: deleteError } = await this.supabase
        .from("idea_interests")
        .delete()
        .eq("idea_id", ideaId)
        .eq("user_id", userId);

      if (deleteError) {
        return error(deleteError.message);
      }

      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error");
    }
  }
}

export const ideasService = new IdeasServiceImpl();
