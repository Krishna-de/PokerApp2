/// <reference types="vite/client" />

/** True only under `npm run dev` with SPLITWISE_API_KEY set in .env (see vite.config.ts). */
declare const __SPLITWISE_PROXY__: boolean;
