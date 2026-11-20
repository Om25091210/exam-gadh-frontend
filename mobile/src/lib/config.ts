// Public values (none of these is a secret). They default to the live ExamGadh setup so a build never ships without them;
// set the EXPO_PUBLIC_* variables only to point a build somewhere else.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://16-4-65-177.sslip.io').replace(/\/$/, '');
/** The Google "web" OAuth client id. Android Google sign-in uses it as the audience of the ID token the server verifies. */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '61213822104-61dsk8cdquktnsmqcoo8srjkh9agl5gt.apps.googleusercontent.com';
/** Development only: sign in with a fake token (the server accepts it only when it runs with GOOGLE_VERIFIER=dev). */
export const DEV_LOGIN = process.env.EXPO_PUBLIC_DEV_LOGIN === '1';
