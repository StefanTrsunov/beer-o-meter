import { Rule, Finding } from './types';
import { universalRules } from './universal';
import { javascriptRules } from './javascript';
import { pythonRules } from './python';

const languageRules: Record<string, Rule[]> = {
  javascript: javascriptRules,
  typescript: javascriptRules,
  javascriptreact: javascriptRules,
  typescriptreact: javascriptRules,
  python: pythonRules
};

export interface Report {
  bac: number;
  stage: string;
  findings: Finding[];
  languageId: string;
  languageSupported: boolean;
}

const STAGES: { min: number; label: string }[] = [
  { min: 0.00, label: 'Stone cold sober' },
  { min: 0.05, label: 'Buzzed — loosening up' },
  { min: 0.10, label: 'Tipsy — decisions getting creative' },
  { min: 0.18, label: 'Drunk — the linter has given up' },
  { min: 0.25, label: 'Hammered — call a code review Uber' },
  { min: 0.35, label: 'Blackout — how did this even compile' }
];

export function analyze(code: string, languageId: string): Report {
  const lines = code.split('\n');
  const rules = [...universalRules, ...(languageRules[languageId] || [])];
  const findings: Finding[] = [];
  for (const rule of rules) {
    try {
      findings.push(...rule.run(code, lines));
    } catch {
      // a single broken rule shouldn't take down the rest
    }
  }
  const totalPoints = findings.reduce((s, f) => s + f.points, 0);
  const bac = Math.min(0.40, totalPoints / 100);
  const stage = [...STAGES].reverse().find(s => bac >= s.min)!.label;
  return {
    bac,
    stage,
    findings,
    languageId,
    languageSupported: !!languageRules[languageId]
  };
}
