/**
 * Demo-safety keystone. REPLAY is the default (safe) path; set REPLAY=0 in .env.local
 * only for the live recording pass / a brave live run.
 */
export function isReplay(): boolean {
  return process.env.REPLAY !== '0'
}
