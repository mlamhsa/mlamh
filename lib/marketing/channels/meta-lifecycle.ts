import {
  buildMetaDeletionConfirmationCode,
  buildMetaLifecycleFingerprint,
  verifyMetaSignedRequest,
} from "./meta-core.ts";
import { META_SECRET_NAMES } from "../credentials/meta-infisical.ts";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asStringRecord(value: unknown): Record<string, string> {
  const record = asRecord(value);
  return Object.fromEntries(Object.entries(record).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

export function prepareMetaDeauthorize({
  signedRequest,
  appSecret,
  configurationState,
}: {
  signedRequest: string;
  appSecret: string;
  configurationState: unknown;
}) {
  const verified = verifyMetaSignedRequest({ signedRequest, appSecret });
  if (!verified) return null;

  const configuration = asRecord(configurationState);
  const credentialRefs = asStringRecord(configuration.credential_refs);
  const isInstagramSubject = configuration.instagram_login_account_id === verified.userId;
  const nextCredentialRefs = { ...credentialRefs };
  const secretsToDelete: string[] = [];
  let scope: "instagram" | "unmatched" = "unmatched";

  if (isInstagramSubject) {
    scope = "instagram";
    delete nextCredentialRefs.instagram;
    secretsToDelete.push(META_SECRET_NAMES.instagramLongLivedToken);
  }

  return {
    verified,
    fingerprint: buildMetaLifecycleFingerprint("deauthorize", signedRequest),
    scope,
    nextCredentialRefs,
    secretsToDelete,
    remainingCredentialCount: Object.keys(nextCredentialRefs).length,
    nextConfiguration: {
      ...configuration,
      credential_refs: nextCredentialRefs,
      instagram_login_account_id: isInstagramSubject ? null : configuration.instagram_login_account_id ?? null,
    },
  };
}

export function prepareMetaDataDeletion({
  signedRequest,
  appSecret,
  requestUrl,
}: {
  signedRequest: string;
  appSecret: string;
  requestUrl: string;
}) {
  const verified = verifyMetaSignedRequest({ signedRequest, appSecret });
  if (!verified) return null;
  const fingerprint = buildMetaLifecycleFingerprint("data-deletion", signedRequest);
  const confirmationCode = buildMetaDeletionConfirmationCode(fingerprint);
  const statusUrl = new URL("/api/marketing/integrations/meta/data-deletion/status", requestUrl);
  statusUrl.searchParams.set("code", confirmationCode);
  return {
    verified,
    fingerprint,
    confirmationCode,
    statusUrl: statusUrl.toString(),
  };
}
