import generated from '../../.generated/site.json';

interface TemplateSite {
  publicSite: string | null;
  navigation: { label: string; link: string }[];
  theme: { defaultMode: 'system' | 'light' | 'dark'; accent?: string };
  brand: { logo?: string; logoAlt?: string; favicon?: string; socialImage?: string };
}

export const site = generated as TemplateSite;
