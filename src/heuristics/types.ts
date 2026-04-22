export interface Finding {
  rule: string;
  points: number;
  symptom: string;
}

export interface Rule {
  name: string;
  run(code: string, lines: string[]): Finding[];
}
