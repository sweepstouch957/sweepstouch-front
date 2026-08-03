export interface Env {
  NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
