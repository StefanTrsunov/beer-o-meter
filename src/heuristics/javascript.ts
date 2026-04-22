import { Rule } from './types';

export const javascriptRules: Rule[] = [
  {
    name: 'js-var',
    run(code) {
      const count = (code.match(/\bvar\s+\w+/g) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'js-var',
        points: count * 2,
        symptom: `${count}× "var" — drinking the 2009 vintage`
      }];
    }
  },
  {
    name: 'js-loose-equals',
    run(code) {
      const count = (code.match(/[^=!]==[^=]/g) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'js-loose-equals',
        points: count * 2,
        symptom: `${count}× "==" instead of "===" — seeing double`
      }];
    }
  },
  {
    name: 'js-eval',
    run(code) {
      if (!/\beval\s*\(/.test(code)) return [];
      return [{
        rule: 'js-eval',
        points: 15,
        symptom: `eval() detected — absolutely hammered`
      }];
    }
  },
  {
    name: 'js-any',
    run(code) {
      const count = (code.match(/:\s*any\b/g) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'js-any',
        points: count * 1.5,
        symptom: `${count}× ": any" — TypeScript? More like TypeShrug`
      }];
    }
  },
  {
    name: 'js-console-log',
    run(code) {
      const count = (code.match(/console\.log/g) || []).length;
      if (count < 3) return [];
      return [{
        rule: 'js-console-log',
        points: Math.min(6, count),
        symptom: `${count}× console.log — debugging like it's a group chat`
      }];
    }
  },
  {
    name: 'js-ts-ignore',
    run(code) {
      const count = (code.match(/@ts-(ignore|nocheck|expect-error)/g) || []).length;
      if (count === 0) return [];
      return [{
        rule: 'js-ts-ignore',
        points: count * 4,
        symptom: `${count}× @ts-ignore — telling the compiler to shut up`
      }];
    }
  }
];
