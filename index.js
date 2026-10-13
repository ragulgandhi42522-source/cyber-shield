import { scenario1 } from './scenario1_usb.js';
import { scenario2 } from './scenario2_workstation.js';
import { scenario3 } from './scenario3_insider.js';

export const allScenarios = [
  scenario1,
  scenario2,
  scenario3
];

export function getScenarioById(id) {
  return allScenarios.find(s => s.id === id) || allScenarios[0];
}
