import 'server-only';

/**
 * /chatbot uses the same visitor session as the main website (`users` table,
 * `jk_user_session` cookie). Re-exported here so conversation routes keep a
 * stable import path without a second account system.
 */
export {
  clearSessionHint,
  endSession,
  getSessionUser,
  startSession,
} from '@/lib/users/session';
