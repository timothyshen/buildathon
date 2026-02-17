import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PINATA_API_KEY = process.env.PINATA_API_KEY!;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY!;
const PINATA_JWT = process.env.PINATA_JWT;

async function pinJsonToIPFS(json: Record<string, unknown>): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prefer JWT if available, fall back to API key + secret
  if (PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  } else {
    headers["pinata_api_key"] = PINATA_API_KEY;
    headers["pinata_secret_api_key"] = PINATA_SECRET_KEY;
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers,
    body: JSON.stringify({ pinataContent: json }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.IpfsHash as string;
}

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

    // Pin both to IPFS via Pinata
    const [ipCid, nftCid] = await Promise.all([
      pinJsonToIPFS(ipMetadata),
      pinJsonToIPFS(nftMetadata),
    ]);

    // Compute SHA-256 hashes of the JSON content
    const encoder = new TextEncoder();
    const ipBytes = encoder.encode(JSON.stringify(ipMetadata));
    const nftBytes = encoder.encode(JSON.stringify(nftMetadata));

    const ipHashBuffer = await crypto.subtle.digest("SHA-256", ipBytes);
    const nftHashBuffer = await crypto.subtle.digest("SHA-256", nftBytes);
    const ipHash = Buffer.from(ipHashBuffer).toString("hex");
    const nftHash = Buffer.from(nftHashBuffer).toString("hex");

    return NextResponse.json({
      ipMetadataURI: `https://gateway.pinata.cloud/ipfs/${ipCid}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://gateway.pinata.cloud/ipfs/${nftCid}`,
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
