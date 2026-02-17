// Story Protocol services — barrel export

export { getStoryClient } from "./client";

export {
  STORY_CHAIN_ID,
  STORY_RPC_URL,
  SPG_NFT_CONTRACT,
  WIP_TOKEN_ADDRESS,
  STORY_EXPLORER_URL,
} from "./constants";

export {
  getPresetTerms,
  buildLicenseTermsData,
  registerAndAttachLicenseTerms,
  registerLicenseTerms,
  attachLicenseTerms,
  mintLicenseToken,
} from "./licensing";

export { registerSubmissionAsIp, recordRegistration } from "./ip-registration";

export { registerDerivativeIp, recordDerivative } from "./derivatives";

export {
  claimAllRevenue,
  getClaimableRevenue,
  payRoyaltyOnBehalf,
} from "./royalties";
