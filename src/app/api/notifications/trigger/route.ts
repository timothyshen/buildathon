import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser, notifyBulk } from "@/lib/notify";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, data } = body;

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    const admin = createAdminClient();

    switch (event) {
      case "submission_submitted": {
        const { submissionId, title, cohortId } = data;
        // Notify all admins
        const { data: admins } = await admin
          .from("users")
          .select("id")
          .eq("role", "admin");

        if (admins && admins.length > 0) {
          await notifyBulk(
            admins.map((a) => ({
              userId: a.id,
              type: "new_submission",
              title: "New submission",
              body: `"${title}" was submitted`,
              href: `/admin/submissions`,
              metadata: { submissionId, cohortId },
            }))
          );
        }

        // Notify track sponsors if applicable
        if (submissionId) {
          const { data: submissionTracks } = await admin
            .from("submission_tracks")
            .select("track_id")
            .eq("submission_id", submissionId);

          if (submissionTracks && submissionTracks.length > 0) {
            const trackIds = submissionTracks.map((st) => st.track_id);
            const { data: tracks } = await admin
              .from("tracks")
              .select("sponsor_org_id")
              .in("id", trackIds)
              .not("sponsor_org_id", "is", null);

            if (tracks && tracks.length > 0) {
              const sponsorOrgIds = [...new Set(tracks.map((t) => t.sponsor_org_id).filter(Boolean))];
              const { data: sponsorUsers } = await admin
                .from("users")
                .select("id")
                .in("sponsor_org_id", sponsorOrgIds);

              if (sponsorUsers && sponsorUsers.length > 0) {
                await notifyBulk(
                  sponsorUsers.map((s) => ({
                    userId: s.id,
                    type: "new_track_submission",
                    title: "New track submission",
                    body: `"${title}" was submitted to your track`,
                    href: `/sponsor/tracks`,
                    metadata: { submissionId, cohortId },
                  }))
                );
              }
            }
          }
        }
        break;
      }

      case "submission_status_changed": {
        const { submissionId, title, newStatus, userId: targetUserId } = data;
        const statusLabels: Record<string, string> = {
          submitted: "submitted",
          under_review: "under review",
          accepted: "accepted",
          winner: "selected as a winner",
        };
        const label = statusLabels[newStatus] || newStatus;

        await notifyUser({
          userId: targetUserId,
          type:
            newStatus === "winner"
              ? "winner_announced"
              : "submission_status_changed",
          title:
            newStatus === "winner"
              ? "Congratulations! You won!"
              : "Submission status updated",
          body: `"${title}" is now ${label}`,
          href: `/submissions/${submissionId}`,
          metadata: { submissionId, newStatus },
        });
        break;
      }

      case "review_completed": {
        const { submissionId } = data;
        // Look up the submission creator
        const { data: submission } = await admin
          .from("submissions")
          .select("created_by, title")
          .eq("id", submissionId)
          .single();

        if (submission?.created_by) {
          await notifyUser({
            userId: submission.created_by,
            type: "review_received",
            title: "New review received",
            body: `"${submission.title}" received a new review`,
            href: `/submissions/${submissionId}`,
            metadata: { submissionId },
          });
        }
        break;
      }

      case "review_assigned": {
        const { judgeId, cohortName } = data;
        await notifyUser({
          userId: judgeId,
          type: "review_assigned",
          title: "Review assigned",
          body: `You have new submissions to review${cohortName ? ` for ${cohortName}` : ""}`,
          href: `/reviews`,
          metadata: data,
        });
        break;
      }

      case "team_invite_created": {
        const { teamName, email } = data;
        const { data: invitedUser } = await admin
          .from("users")
          .select("id")
          .eq("email", email.toLowerCase())
          .single();

        if (invitedUser) {
          await notifyUser({
            userId: invitedUser.id,
            type: "team_invite",
            title: "Team invitation",
            body: `You've been invited to join "${teamName}"`,
            href: `/teams`,
            metadata: data,
          });
        }
        break;
      }

      case "feedback_created": {
        const { feedbackId, title } = data;
        const { data: admins } = await admin
          .from("users")
          .select("id")
          .eq("role", "admin");

        if (admins && admins.length > 0) {
          await notifyBulk(
            admins.map((a) => ({
              userId: a.id,
              type: "new_feedback",
              title: "New feedback",
              body: `"${title}" was posted`,
              href: `/feedback/${feedbackId}`,
              metadata: { feedbackId },
            }))
          );
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
