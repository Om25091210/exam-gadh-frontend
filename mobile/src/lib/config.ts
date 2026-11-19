export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://16-4-65-177.sslip.io').replace(/\/$/, '');
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
/** Development only: sign in with a fake token (the server accepts it only when it runs with GOOGLE_VERIFIER=dev). */
export const DEV_LOGIN = process.env.EXPO_PUBLIC_DEV_LOGIN === '1';
