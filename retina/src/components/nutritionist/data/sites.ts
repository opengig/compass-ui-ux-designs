export const ALL_SITES = ["Hyderabad", "Bangalore", "Delhi"] as const;
export type SiteName = (typeof ALL_SITES)[number];
