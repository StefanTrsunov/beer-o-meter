import { Rule } from './types';

export const pythonRules: Rule[] = [
  {
    name: 'py-bare-except',
    run(code) {
      const count = (code.match(/except\s*:/g) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'py-bare-except',
        points: count * 4,
        symptom: `${count}× bare "except:" — ignoring all of life's problems`
      }];
    }
  },
  {
    name: 'py-global',
    run(code) {
      const count = (code.match(/^\s*global\s+/gm) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'py-global',
        points: count * 3,
        symptom: `${count}× "global" — shouting from the rooftops`
      }];
    }
  },
  {
    name: 'py-print-debug',
    run(code) {
      const count = (code.match(/^\s*print\s*\(/gm) || []).length;
      if (count < 3) return [];
      return [{
        rule: 'py-print-debug',
        points: Math.min(6, count),
        symptom: `${count}× print() — debugging by monologue`
      }];
    }
  },
  {
    name: 'py-star-import',
    run(code) {
      const count = (code.match(/from\s+\S+\s+import\s+\*/g) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'py-star-import',
        points: count * 3,
        symptom: `import * — grabbing every bottle off the shelf`
      }];
    }
  },
  {
    name: 'py-lambda-abuse',
    run(code) {
      const count = (code.match(/\blambda\b/g) || []).length;
      if (count < 4) return [];
      return [{
        rule: 'py-lambda-abuse',
        points: Math.min(6, count),
        symptom: `${count}× lambda — the anonymous shots add up`
      }];
    }
  }
];
