/**
 * /chatbot auth is the shared visitor account (`/api/users/auth`). Signing up or
 * logging in here also signs you into the website, and the reverse.
 */
export { GET, POST, DELETE } from '@/app/api/users/auth/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
