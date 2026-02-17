import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const {
      parentSubmissionId,
      childSubmissionId,
      childIpId,
      tokenId,
      txHash,
      nftContract,
      ownerAddress,
      parentIpId,
      metadataUri,
      metadataHash,
      licenseTermsId,
      licenseTerms,
    } = body;

    if (
      !parentSubmissionId ||
      !childSubmissionId ||
      !childIpId ||
      !txHash ||
      !ownerAddress ||
      !parentIpId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify both submissions exist
    const { data: parentSub, error: parentError } = await admin
      .from("submissions")
      .select("id")
      .eq("id", parentSubmissionId)
      .single();

    if (parentError || !parentSub) {
      return NextResponse.json(
        { error: "Parent submission not found" },
        { status: 404 }
      );
    }

    const { data: childSub, error: childError } = await admin
      .from("submissions")
      .select("id, created_by, team_id")
      .eq("id", childSubmissionId)
      .single();

    if (childError || !childSub) {
      return NextResponse.json(
        { error: "Child submission not found" },
        { status: 404 }
      );
    }

    // Verify the authenticated user owns the child submission
    let isOwner = false;
    if (childSub.team_id) {
      // Team submission: check if user is a team member
      const { data: membership } = await admin
        .from("team_members")
        .select("user_id")
        .eq("team_id", childSub.team_id)
        .eq("user_id", user.id)
        .maybeSingle();
      isOwner = !!membership;
    } else {
      // Solo submission: user must be the creator
      isOwner = childSub.created_by === user.id;
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Insert ip_asset record for derivative
    const { data: ipAsset, error: ipError } = await admin
      .from("ip_assets")
      .insert({
        submission_id: childSubmissionId,
        ip_id: childIpId,
        nft_contract: nftContract,
        token_id: tokenId,
        tx_hash: txHash,
        owner_address: ownerAddress,
        metadata_uri: metadataUri,
        metadata_hash: metadataHash,
        parent_ip_id: parentIpId,
      })
      .select()
      .single();

    if (ipError) {
      console.error("Derivative IP asset insert error:", ipError);
      return NextResponse.json(
        { error: "Failed to save derivative IP asset" },
        { status: 500 }
      );
    }

    // Insert license terms if provided
    if (licenseTerms && licenseTermsId) {
      const { error: ltError } = await admin
        .from("ip_license_terms")
        .insert({
          ip_asset_id: ipAsset.id,
          license_terms_id: licenseTermsId,
          commercial_use: licenseTerms.commercialUse || false,
          commercial_attribution: licenseTerms.commercialAttribution || false,
          commercial_rev_share: licenseTerms.commercialRevShare || 0,
          default_minting_fee: licenseTerms.defaultMintingFee || "0",
          derivatives_allowed: licenseTerms.derivativesAllowed || false,
          derivatives_attribution: licenseTerms.derivativesAttribution || false,
          derivatives_reciprocal: licenseTerms.derivativesReciprocal || false,
          derivatives_approval: licenseTerms.derivativesApproval || false,
          transferable: licenseTerms.transferable ?? true,
          currency: licenseTerms.currency || null,
          expiration: licenseTerms.expiration || 0,
        });

      if (ltError) {
        console.error("License terms insert error:", ltError);
      }
    }

    // Update child submission with derivative info
    const { error: updateError } = await admin
      .from("submissions")
      .update({
        forked_from_submission_id: parentSubmissionId,
        ip_asset_id: childIpId,
        ip_registered_at: new Date().toISOString(),
        built_with_story: true,
      })
      .eq("id", childSubmissionId);

    if (updateError) {
      console.error("Submission update error:", updateError);
    }

    return NextResponse.json({ success: true, ipAssetId: ipAsset.id });
  } catch (error) {
    console.error("Derivative registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
