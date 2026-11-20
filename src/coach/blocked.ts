import type { AppState } from '../domain/types';
import { evaluateSafety } from '../safety/engine';

/** True when the person's safety answers currently block plans (pregnancy, eating concerns, high-risk). */
export function isBlockedSetup(state: AppState): boolean {
  if (!state.setup) return false;
  return evaluateSafety({ ownTargets: state.setup.ownTargets, screening: state.setup.screening }).result === 'blocked';
}
