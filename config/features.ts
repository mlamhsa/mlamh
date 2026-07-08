export const features = {
    notifications: true,
    analytics: false,
    auditLog: false,
    timeline: false,
  
    adminShell: true,
    publisherShell: false,
    talentShell: false,
  
    chat: false,
    aiAssistant: false,
    payments: false,
    verification: true,
  } as const;
  
  export type FeatureKey = keyof typeof features;
  
  export function isFeatureEnabled(feature: FeatureKey) {
    return features[feature] === true;
}