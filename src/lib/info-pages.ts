export const infoPages = ["delivery", "payment", "warranty", "returns", "contacts", "privacy"] as const;
export type InfoPage = (typeof infoPages)[number];

export function isInfoPage(value: string): value is InfoPage {
  return infoPages.includes(value as InfoPage);
}
