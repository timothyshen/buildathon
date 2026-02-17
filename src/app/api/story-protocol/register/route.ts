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
      submissionId,
      ipId,
      tokenId,
      txHash,
      nftContract,
      ownerAddress,
      metadataUri,
      metadataHash,
      licenseTermsId,
      licenseTerms,
      parentIpId,
    } = body;

    if (!submissionId || !ipId || !txHash || !ownerAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify submission exists and user has access
    const { data: submission, error: subError } = await admin
      .from("submissions")
      .select("id, created_by, team_id")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Insert ip_asset record
    const { data: ipAsset, error: ipError } = await admin
      .from("ip_assets")
      .insert({
        submission_id: submissionId,
        ip_id: ipId,
        nft_contract: nftContract,
        token_id: tokenId,
        tx_hash: txHash,
        owner_address: ownerAddress,
        metadata_uri: metadataUri,
        metadata_hash: metadataHash,
        parent_ip_id: parentIpId || null,
      })
      .select()
      .single();

    if (ipError) {
      console.error("IP asset insert error:", ipError);
      return NextResponse.json(
        { error: "Failed to save IP asset" },
        { status: 500 }
      );
    }

    // Insert license terms
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

    // Update denormalized fields on submission
    const { error: updateError } = await admin
      .from("submissions")
      .update({
        ip_asset_id: ipId,
        ip_registered_at: new Date().toISOString(),
        built_with_story: true,
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Submission update error:", updateError);
    }

    return NextResponse.json({ success: true, ipAssetId: ipAsset.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
