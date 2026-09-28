/// <reference types="vite/client" />

/** True only under `npm run dev` with SPLITWISE_API_KEY set in .env (see vite.config.ts). */
declare const __SPLITWISE_PROXY__: boolean;

/** Build stamp shown in the app (see vite.config.ts). */
declare const __APP_VERSION__: string;
declare const __APP_BUILD__: string;
declare const __APP_COMMIT__: string;
