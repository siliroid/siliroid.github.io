/* GENERATED — do not hand-edit. Run `node heat/build-config.js` after changing .env.
 *
 * This exists so the Supabase URL lives in ONE place instead of being hardcoded inline
 * in assess.html and success.html. It is committed on purpose: a static site serves its
 * config to the browser no matter what, so the .env buys you a single source of truth,
 * NOT secrecy. Anything that must stay secret does not belong in this file or any file
 * this repo serves — it belongs in the edge function's own environment.
 */
window.HEAT_CONFIG = {
  SUPABASE_URL: "https://udrbeucnxmojlvewmrbm.supabase.co",
  SHARE_URL: "https://heat.myconvergence.ai",
};
