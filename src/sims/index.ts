import { AreaId } from '../store/types';
import { SCENARIOS } from './scenarios';
import { SimScenario } from './types';

export * from './types';
export { SCENARIOS } from './scenarios';
export { evaluateTurn, matchesIntent, normalize } from './match';

/** ロールプレイを用意している領域(相手や場が要る=タイミングを自分で作りにくい3領域) */
export const SIM_AREAS: AreaId[] = ['hearing', 'drive', 'negotiation'];

export function hasSim(areaId: AreaId): boolean {
  return SIM_AREAS.includes(areaId);
}

export function scenariosForArea(areaId: AreaId): SimScenario[] {
  return SCENARIOS.filter((s) => s.areaId === areaId);
}

export function scenarioById(id: string): SimScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
