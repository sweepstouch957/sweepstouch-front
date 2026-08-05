export interface Config {
  gtm?: {
    id?: string;
  };
}

export const config = {
  gtm: {
    id: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
  },
} satisfies Config;
