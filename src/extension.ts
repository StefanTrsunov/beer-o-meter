import * as vscode from 'vscode';
import { analyze, Report } from './heuristics/engine';
import { loadApiKey, askBartender } from './llm/provider';

type BartenderState =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'no-key' }
  | { kind: 'ready'; text: string }
  | { kind: 'error'; message: string };

let currentPanel: vscode.WebviewPanel | null = null;

export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand('beer-o-meter.analyze', async () => {
    try {
      await runAnalyze(context);
    } catch (err: any) {
      vscode.window.showErrorMessage(
        `Beer-O-Meter: something broke — ${err?.message ?? String(err)}`
      );
    }
  });
  context.subscriptions.push(cmd);
}

export function deactivate() {
  currentPanel = null;
}

async function runAnalyze(context: vscode.ExtensionContext) {
  const input = readActiveCode();
  if (!input) return;

  const report = analyze(input.code, input.languageId);
  const panel = getOrCreatePanel(report);

  // Step 1: ALWAYS render the BAC immediately, before anything async.
  renderPanel(panel, report, { kind: 'loading' });

  // Step 2: try the AI. Any failure here keeps the BAC panel intact.
  const apiKey = loadApiKey(context.extensionPath);
  if (!apiKey) {
    vscode.window.showWarningMessage(
      'Beer-O-Meter: no API key found in .env — showing BAC only.'
    );
    renderPanel(panel, report, { kind: 'no-key' });
    return;
  }

  try {
    const text = await askBartender(input.code, input.languageId, report, apiKey);
    renderPanel(panel, report, { kind: 'ready', text });
  } catch (err: any) {
    const message = err?.message ?? String(err);
    vscode.window.showErrorMessage(`Beer-O-Meter: bartender unavailable — ${message}`);
    renderPanel(panel, report, { kind: 'error', message });
  }
}

function readActiveCode(): { code: string; languageId: string } | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Beer-O-Meter: open a file first, ya lightweight.');
    return null;
  }
  const sel = editor.selection;
  const code = sel.isEmpty ? editor.document.getText() : editor.document.getText(sel);
  if (!code.trim()) {
    vscode.window.showWarningMessage('Beer-O-Meter: nothing to analyze.');
    return null;
  }
  return { code, languageId: editor.document.languageId };
}

function getOrCreatePanel(report: Report): vscode.WebviewPanel {
  if (currentPanel) {
    currentPanel.title = `BAC ${report.bac.toFixed(2)} — ${report.stage}`;
    currentPanel.reveal(vscode.ViewColumn.Beside, true);
    return currentPanel;
  }
  const panel = vscode.window.createWebviewPanel(
    'beerOMeter',
    `BAC ${report.bac.toFixed(2)} — ${report.stage}`,
    vscode.ViewColumn.Beside,
    { enableScripts: false, retainContextWhenHidden: true }
  );
  panel.onDidDispose(() => {
    currentPanel = null;
  });
  currentPanel = panel;
  return panel;
}

function renderPanel(panel: vscode.WebviewPanel, report: Report, bartender: BartenderState) {
  panel.title = `BAC ${report.bac.toFixed(2)} — ${report.stage}`;
  panel.webview.html = renderHtml(report, bartender);
}

function renderHtml(report: Report, bartender: BartenderState): string {
  const pct = Math.min(100, (report.bac / 0.4) * 100);
  const color =
    report.bac < 0.05 ? '#4caf50' :
    report.bac < 0.18 ? '#ffb300' :
    report.bac < 0.25 ? '#ff7043' : '#d32f2f';

  const findings =
    report.findings.length === 0
      ? `<li>Suspiciously clean. Are you even having fun?</li>`
      : [...report.findings]
          .sort((a, b) => b.points - a.points)
          .map(f => `<li><span class="pts">+${f.points.toFixed(1)}</span> ${escapeHtml(f.symptom)}</li>`)
          .join('');

  const langNote = report.languageSupported
    ? `Language: ${escapeHtml(report.languageId)}`
    : `Language: ${escapeHtml(report.languageId)} (bartender doesn't speak this — universal rules only)`;

  const bartenderBlock = renderBartender(bartender);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Beer-O-Meter</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: var(--vscode-editor-foreground); }
  h1 { font-size: 48px; margin: 0; color: ${color}; }
  .stage { font-size: 20px; opacity: 0.85; margin-bottom: 24px; }
  .meter { height: 24px; background: rgba(128,128,128,0.2); border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
  .fill { height: 100%; width: ${pct}%; background: ${color}; }
  .scale { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.6; margin-bottom: 32px; }
  h2 { font-size: 16px; text-transform: uppercase; opacity: 0.7; margin-bottom: 8px; letter-spacing: 0.05em; }
  ul { list-style: none; padding: 0; }
  li { padding: 8px 12px; margin-bottom: 4px; background: rgba(128,128,128,0.1); border-radius: 6px; }
  .pts { display: inline-block; min-width: 48px; font-weight: bold; color: ${color}; }
  .lang { margin-top: 24px; font-size: 12px; opacity: 0.5; }
  .bartender {
    margin-top: 36px;
    padding: 20px 22px;
    background: rgba(255, 179, 0, 0.10);
    border-left: 4px solid ${color};
    border-radius: 6px;
    font-size: 15px;
    line-height: 1.55;
    font-style: italic;
    white-space: pre-wrap;
  }
  .bartender.error { background: rgba(211, 47, 47, 0.12); border-left-color: #d32f2f; font-style: normal; }
  .bartender.warn  { background: rgba(255, 179, 0, 0.15);  border-left-color: #ffb300; font-style: normal; }
  .bartender .label { display: block; font-style: normal; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.7; margin-bottom: 8px; }
</style></head>
<body>
  <h1>BAC ${report.bac.toFixed(2)}</h1>
  <div class="stage">${escapeHtml(report.stage)}</div>
  <div class="meter"><div class="fill"></div></div>
  <div class="scale"><span>0.00</span><span>0.10</span><span>0.20</span><span>0.30</span><span>0.40</span></div>
  <h2>Symptoms</h2>
  <ul>${findings}</ul>
  <div class="lang">${langNote}</div>
  ${bartenderBlock}
</body>
</html>`;
}

function renderBartender(b: BartenderState): string {
  switch (b.kind) {
    case 'none':
      return '';
    case 'loading':
      return `<div class="bartender"><span class="label">The Bartender</span>Pouring your roast... (calling Gemini)</div>`;
    case 'no-key':
      return `<div class="bartender warn"><span class="label">Bartender off duty</span>No API_KEY in .env — the heuristics above still work.</div>`;
    case 'ready':
      return `<div class="bartender"><span class="label">The Bartender says</span>${escapeHtml(b.text)}</div>`;
    case 'error':
      return `<div class="bartender error"><span class="label">Bartender unavailable</span>${escapeHtml(b.message)}</div>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]!));
}
