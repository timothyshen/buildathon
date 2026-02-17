"use client";

import { PILFlavor, type LicenseTerms } from "@story-protocol/core-sdk";
import { parseEther, type WalletClient } from "viem";
import type { PilTermsFormValues, PilPreset } from "@/types";
import { getStoryClient } from "./client";
import { WIP_TOKEN_ADDRESS } from "./constants";

/**
 * Returns default PilTermsFormValues for a given preset.
 * These values populate the UI form; they are human-readable
 * (fees in ether strings, rev-share as 0-100 percentages).
 */
export function getPresetTerms(preset: PilPreset): PilTermsFormValues {
  switch (preset) {
    case "non-commercial-remix":
      return {
        commercialUse: false,
        commercialAttribution: false,
        commercialRevShare: 0,
        defaultMintingFee: "0",
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesReciprocal: true,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
    case "commercial-use":
      return {
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 0,
        defaultMintingFee: "1",
        derivativesAllowed: false,
        derivativesAttribution: false,
        derivativesReciprocal: false,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
    case "commercial-remix":
      return {
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 50,
        defaultMintingFee: "1",
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesReciprocal: true,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
    case "cc-attribution":
      return {
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 0,
        defaultMintingFee: "0",
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesReciprocal: true,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
  }
}

/**
 * Converts UI form values into SDK-compatible LicenseTerms.
 * Uses PILFlavor preset builders to produce well-structured terms
 * that can be passed to registerPILTerms or registerPilTermsAndAttach.
 */
export function buildLicenseTermsData(values: PilTermsFormValues): LicenseTerms {
  const mintingFee = parseEther(values.defaultMintingFee || "0");
  const currency = values.currency as `0x${string}`;

  // Non-commercial + derivatives => Non-Commercial Social Remixing
  if (!values.commercialUse && values.derivativesAllowed) {
    return PILFlavor.nonCommercialSocialRemixing();
  }

  // Commercial + no derivatives => Commercial Use
  if (values.commercialUse && !values.derivativesAllowed) {
    return PILFlavor.commercialUse({
      defaultMintingFee: mintingFee,
      currency,
    });
  }

  // Commercial + derivatives => Commercial Remix
  if (values.commercialUse && values.derivativesAllowed) {
    return PILFlavor.commercialRemix({
      commercialRevShare: values.commercialRevShare,
      defaultMintingFee: mintingFee,
      currency,
    });
  }

  // Fallback: non-commercial social remixing
  return PILFlavor.nonCommercialSocialRemixing();
}

/**
 * Registers PIL license terms on-chain and attaches them to an IP asset
 * in a single transaction using the SDK's registerPilTermsAndAttach workflow.
 */
export async function registerAndAttachLicenseTerms(
  walletClient: WalletClient,
  ipId: string,
  terms: PilTermsFormValues
) {
  const client = getStoryClient(walletClient);
  const licenseTerms = buildLicenseTermsData(terms);

  const response = await client.license.registerPilTermsAndAttach({
    ipId: ipId as `0x${string}`,
    licenseTermsData: [{ terms: licenseTerms }],
  });

  return response;
}

/**
 * Registers PIL license terms on-chain without attaching to an IP.
 * Returns the licenseTermsId that can later be used for attachment or minting.
 */
export async function registerLicenseTerms(
  walletClient: WalletClient,
  terms: PilTermsFormValues
) {
  const client = getStoryClient(walletClient);
  const licenseTerms = buildLicenseTermsData(terms);

  const response = await client.license.registerPILTerms(licenseTerms);

  return response;
}

/**
 * Attaches already-registered license terms to an IP asset.
 * Requires a licenseTermsId (returned from registerLicenseTerms).
 */
export async function attachLicenseTerms(
  walletClient: WalletClient,
  ipId: string,
  licenseTermsId: bigint | number
) {
  const client = getStoryClient(walletClient);

  const response = await client.license.attachLicenseTerms({
    ipId: ipId as `0x${string}`,
    licenseTermsId,
  });

  return response;
}

/**
 * Mints license tokens for an IP's attached license terms.
 * The caller may need to pay a minting fee depending on the license configuration.
 */
export async function mintLicenseToken(
  walletClient: WalletClient,
  ipId: string,
  licenseTermsId: bigint | number,
  receiver: string
) {
  const client = getStoryClient(walletClient);

  const response = await client.license.mintLicenseTokens({
    licensorIpId: ipId as `0x${string}`,
    licenseTermsId,
    receiver: receiver as `0x${string}`,
    amount: 1,
  });

  return response;
}
