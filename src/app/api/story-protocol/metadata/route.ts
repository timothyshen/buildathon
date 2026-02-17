import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "gateway.pinata.cloud",
});

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
    const { name, description, image, attributes } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 },
      );
    }

    // Build IP metadata following Story Protocol standard
    const ipMetadata: Record<string, unknown> = {
      name,
      description,
      image: image || "",
      attributes: attributes || [],
    };

    // Build NFT metadata
    const nftMetadata: Record<string, unknown> = {
      name,
      description,
      image: image || "",
    };

    // Pin both to IPFS via Pinata (public uploads)
    const ipUpload = await pinata.upload.public.json(ipMetadata);
    const nftUpload = await pinata.upload.public.json(nftMetadata);

    // Compute SHA-256 hashes of the JSON content
    const encoder = new TextEncoder();
    const ipBytes = encoder.encode(JSON.stringify(ipMetadata));
    const nftBytes = encoder.encode(JSON.stringify(nftMetadata));

    const ipHashBuffer = await crypto.subtle.digest("SHA-256", ipBytes);
    const nftHashBuffer = await crypto.subtle.digest("SHA-256", nftBytes);
    const ipHash = Buffer.from(ipHashBuffer).toString("hex");
    const nftHash = Buffer.from(nftHashBuffer).toString("hex");

    return NextResponse.json({
      ipMetadataURI: `https://gateway.pinata.cloud/ipfs/${ipUpload.cid}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://gateway.pinata.cloud/ipfs/${nftUpload.cid}`,
      nftMetadataHash: `0x${nftHash}`,
    });
  } catch (error) {
    console.error("[Story Protocol] Metadata upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload metadata" },
      { status: 500 },
    );
  }
}
