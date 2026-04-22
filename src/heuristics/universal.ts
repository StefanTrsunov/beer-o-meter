import { Rule, Finding } from './types';

export const universalRules: Rule[] = [
  {
    name: 'single-letter-vars',
    run(code) {
      const findings: Finding[] = [];
      const re = /\b(?:let|const|var|int|float|double|char|auto)\s+([a-z])\b/g;
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = re.exec(code)) !== null) {
        if (!seen.has(m[1])) {
          seen.add(m[1]);
          findings.push({
            rule: 'single-letter-vars',
            points: 2,
            symptom: `slurred variable name: "${m[1]}"`
          });
        }
      }
      return findings.slice(0, 5);
    }
  },
  {
    name: 'todo-comments',
    run(code) {
      const matches = code.match(/\b(TODO|FIXME|HACK|XXX|WTF|BUG)\b/gi) || [];
      if (matches.length === 0) return [];
      return [{
        rule: 'todo-comments',
        points: matches.length * 1.5,
        symptom: `${matches.length} regrets written in comments (TODO/FIXME/HACK)`
      }];
    }
  },
  {
    name: 'long-lines',
    run(_code, lines) {
      const long = lines.filter(l => l.length > 120).length;
      if (long === 0) return [];
      return [{
        rule: 'long-lines',
        points: Math.min(10, long),
        symptom: `${long} lines longer than the bar tab`
      }];
    }
  },
  {
    name: 'deep-nesting',
    run(code) {
      let maxDepth = 0;
      let depth = 0;
      for (const ch of code) {
        if (ch === '{' || ch === '(') depth++;
        else if (ch === '}' || ch === ')') depth--;
        if (depth > maxDepth) maxDepth = depth;
      }
      if (maxDepth < 5) return [];
      return [{
        rule: 'deep-nesting',
        points: (maxDepth - 4) * 3,
        symptom: `nested ${maxDepth} levels deep — can't find the door`
      }];
    }
  },
  {
    name: 'commented-code',
    run(_code, lines) {
      let count = 0;
      for (const l of lines) {
        const t = l.trim();
        if (/^(\/\/|#)\s*(if|for|while|function|def|class|const|let|var|return|public|private|import)\b/.test(t)) {
          count++;
        }
      }
      if (count === 0) return [];
      return [{
        rule: 'commented-code',
        points: count * 2,
        symptom: `${count} lines of commented-out code (ghosts of past selves)`
      }];
    }
  },
  {
    name: 'mixed-indent',
    run(_code, lines) {
      let tabs = 0, spaces = 0;
      for (const l of lines) {
        if (l.startsWith('\t')) tabs++;
        else if (l.startsWith('  ')) spaces++;
      }
      if (tabs > 0 && spaces > 0) {
        return [{
          rule: 'mixed-indent',
          points: 5,
          symptom: `mixing tabs and spaces — classic drunk behavior`
        }];
      }
      return [];
    }
  },
  {
    name: 'excessive-punctuation',
    run(code) {
      const excl = (code.match(/!{2,}/g) || []).length;
      const q = (code.match(/\?{2,}/g) || []).length;
      const total = excl + q;
      if (total === 0) return [];
      return [{
        rule: 'excessive-punctuation',
        points: Math.min(6, total),
        symptom: `shouting in code (${total} excessive !!! / ???)`
      }];
    }
  },
  {
    name: 'file-too-long',
    run(_code, lines) {
      if (lines.length < 300) return [];
      return [{
        rule: 'file-too-long',
        points: Math.min(10, Math.floor(lines.length / 100)),
        symptom: `file is ${lines.length} lines — nobody should read this sober either`
      }];
    }
  },
  {
    name: 'magic-numbers',
    run(code) {
      const matches = code.match(/(?<![\w.])[0-9]{3,}(?![\w.])/g) || [];
      if (matches.length < 3) return [];
      return [{
        rule: 'magic-numbers',
        points: Math.min(8, matches.length),
        symptom: `${matches.length} magic numbers pulled from the bartender's hat`
      }];
    }
  },
  {
    name: 'profanity',
    run(code) {
      const matches = code.match(/\b(fuck|shit|damn|wtf|crap|bullshit)\b/gi) || [];
      if (matches.length === 0) return [];
      return [{
        rule: 'profanity',
        points: matches.length * 3,
        symptom: `${matches.length} angry words — clearly on the third pint`
      }];
    }
  },
  {
    name: 'trailing-whitespace',
    run(_code, lines) {
      const count = lines.filter(l => /[ \t]+$/.test(l)).length;
      if (count < 3) return [];
      return [{
        rule: 'trailing-whitespace',
        points: Math.min(4, Math.floor(count / 5)),
        symptom: `${count} lines with trailing whitespace — can't keep it together`
      }];
    }
  }
];
