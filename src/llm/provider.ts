// Phase 2 — "Ask the bartender" Gemini roast.
// Everything (env loading, prompt building, HTTP call) lives in this one file.

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { Report } from '../heuristics/engine';

const MODEL = 'gemini-2.0-flash';
const ENDPOINT_HOST = 'generativelanguage.googleapis.com';

let cachedKey: string | null = null;

export function loadApiKey(extensionPath: string): string | null {
  if (cachedKey) return cachedKey;
  const envPath = path.join(extensionPath, '.env');
  let content: string;
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch {
    return null;
  }
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key === 'API_KEY' || key === 'GEMINI_API_KEY') {
      cachedKey = val;
      return cachedKey;
    }
  }
  return null;
}

function buildPrompt(code: string, languageId: string, report: Report): string {
  const findings =
    report.findings.length === 0
      ? '(no symptoms detected — suspiciously sober)'
      : report.findings.map(f => `- ${f.symptom} (+${f.points.toFixed(1)})`).join('\n');

  return `You are a grumpy but witty bartender who moonlights as a code reviewer.
A ${languageId} programmer just stumbled up to the bar and showed you their code.
The code breathalyzer says:

BAC: ${report.bac.toFixed(2)} — ${report.stage}

Symptoms detected by the breathalyzer:
${findings}

The code:
\`\`\`${languageId}
${code}
\`\`\`

Roast this code in 3-5 sentences as a monologue from behind the bar.
- Reference at least two of the symptoms above by name.
- Be funny and slightly mean — like a regular giving a friend crap.
- End with exactly one piece of real, actionable coding advice.
- No headers, no bullet points, no markdown. Just the bartender talking.`;
}

export async function askBartender(
  code: string,
  languageId: string,
  report: Report,
  apiKey: string
): Promise<string> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(code, languageId, report) }] }],
    generationConfig: { temperature: 0.95, maxOutputTokens: 400 }
  });

  const options: https.RequestOptions = {
    hostname: ENDPOINT_HOST,
    path: `/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise<string>((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          reject(new Error(`Gemini returned non-JSON: ${data.slice(0, 200)}`));
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          const msg = parsed?.error?.message || `HTTP ${res.statusCode}`;
          reject(new Error(`Gemini API error: ${msg}`));
          return;
        }
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          reject(new Error('Gemini returned no text. The bartender is speechless.'));
          return;
        }
        resolve(String(text).trim());
      });
    });
    req.on('error', err => reject(new Error(`Network error: ${err.message}`)));
    req.write(body);
    req.end();
  });
}
