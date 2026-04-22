# Beer-O-Meter

A VS Code extension that rates your code's **Blood Alcohol Content (BAC)** — from 0.00 ("stone cold sober") to 0.40 ("blackout, how did this even compile"). Then, if you want, an AI bartender will roast it.

Great when you actually are drunk and need to understand what past-you was thinking.

## What it does

Beer-O-Meter analyzes the code in your active editor (or selection) in two passes:

1. **Heuristics (always runs, no internet).** A set of regex-based rules score the code — `var` usage, `==` instead of `===`, TODO/FIXME/WTF comments, bare `except:`, deep nesting, magic numbers, mixed tabs/spaces, and more. The total maps onto a 0.00–0.40 BAC scale and a "stage of drunkenness".
2. **AI bartender (optional).** The selected code plus the heuristic findings are sent to **Google Gemini**, which is prompted to play a grumpy bartender and roast the code in a short monologue — referencing the actual symptoms and ending with one piece of real advice.

Results are shown in a side panel with a colored BAC meter, a symptoms list, and (when available) the bartender's take.

## Features

- One command: **Beer-O-Meter: Analyze this code**
- Works on **any language** — 11 universal rules run on plain text
- **Bonus rules** for JavaScript / TypeScript (incl. JSX/TSX) and Python
- BAC panel **always renders**, even if the AI call fails
- AI errors (no key, quota exceeded, network, etc.) surface inside the panel *and* as a VS Code notification — never a blank tab
- No external SDKs — just the built-in `https` module

## Install / run from source

```bash
git clone <your-repo-url>
cd beer-o-meter
npm install
```

Then open the folder in VS Code and press **F5** to launch an Extension Development Host with Beer-O-Meter loaded.

To package as a `.vsix`:

```bash
npm install -g @vscode/vsce
vsce package
```

## Configuration

The AI bartender is optional. Without a key, the extension still shows the BAC meter and symptoms.

To enable the roast, create a `.env` file in the extension folder:

```
API_KEY=your-gemini-api-key
```

Get a free key at [aistudio.google.com](https://aistudio.google.com). `.env` is in `.gitignore` and `.vscodeignore`, so it won't be committed or packaged.

The extension also accepts `GEMINI_API_KEY` as an alias.

## Usage

1. Open any code file.
2. Optionally select a region of code (otherwise the whole file is analyzed).
3. `Ctrl+Shift+P` → **Beer-O-Meter: Analyze this code**.
4. A panel opens to the side showing:
   - The BAC score and stage label
   - A colored meter (green → yellow → orange → red)
   - The list of detected symptoms sorted by severity
   - The bartender's roast, or a status block if the AI isn't available

## Supported languages

| Language group        | Universal rules | Language-specific rules |
| --------------------- | --------------- | ----------------------- |
| JS / TS / JSX / TSX   | Yes             | `var`, `==`, `eval`, `: any`, `console.log` spam, `@ts-ignore` |
| Python                | Yes             | bare `except:`, `global`, `print()` debug, `import *`, lambda abuse |
| Everything else       | Yes             | — (shown as "bartender doesn't speak this") |

Adding a new language takes one file in `src/heuristics/` plus a line in `engine.ts`.

## Project layout

```
beer-o-meter/
├── package.json                  extension manifest, command registration
├── tsconfig.json
├── src/
│   ├── extension.ts              entry point, panel management, command wiring
│   ├── heuristics/
│   │   ├── types.ts              Rule and Finding interfaces
│   │   ├── engine.ts             rule runner, points → BAC mapping, stages
│   │   ├── universal.ts          language-agnostic rules
│   │   ├── javascript.ts         JS / TS rules
│   │   └── python.ts             Python rules
│   └── llm/
│       └── provider.ts           .env loader, prompt builder, Gemini HTTP call
└── .vscode/
    ├── launch.json               F5 runs the extension
    └── tasks.json                npm: compile
```

## How the BAC is computed

Each rule returns a list of `{ points, symptom }` findings. Points are summed across all rules and divided by 100 to yield BAC, capped at 0.40. A rule contributing 15 points alone (e.g. `eval()` detected) already puts you at 0.15 — "Tipsy". The mapping is deliberately non-scientific; this is a comedy tool.

Stages:

| BAC     | Stage                               |
| ------- | ----------------------------------- |
| 0.00    | Stone cold sober                    |
| 0.05+   | Buzzed — loosening up               |
| 0.10+   | Tipsy — decisions getting creative  |
| 0.18+   | Drunk — the linter has given up     |
| 0.25+   | Hammered — call a code review Uber  |
| 0.35+   | Blackout — how did this even compile|

## Contributing

Rule ideas welcome. To add one:

1. Pick the right file (`universal.ts` for any language, or a language-specific file).
2. Add a `Rule` object — `name`, and a `run(code, lines)` that returns `Finding[]` with `points` and a funny `symptom` string.
3. Keep points proportional — a serious offense is ~5–15, a minor quirk is 1–3.
4. Try it on at least one real file before opening a PR.

## Privacy

When you run the AI bartender, the **selected code** and the **heuristic findings** are sent to Google's Gemini API. Don't point it at anything you wouldn't paste into a web chat. The heuristic pass runs entirely locally — no network call.

## License

MIT.
