# NEON STRIKE: Sector Nine

A playable, single-player first-person shooter for your browser. Fight enemy robots, survive waves, earn credits, unlock weapons, and buy upgrades.

## Files

```text
neon-strike/
├── dist/
│   ├── index.html
│   ├── game.js
│   ├── styles.css
│   └── overrides.css
├── README.md
└── test.mjs
```

The **`dist/`** folder contains the complete game. It does not require a framework, database, external files, or a build command.

## Play locally

Open **`dist/index.html`** in your browser. For the best experience, use a laptop or desktop with a keyboard and mouse.

## Run tests

Install [Node.js](https://nodejs.org/) version 20 or newer, open a terminal inside this folder, and run:

```bash
node --test test.mjs
```

The tests check game startup, the upgrade shop, purchases, shooting, and grenades. You do **not** need `npm install`.

## Upload to GitHub

Create a new GitHub repository and upload the **contents** of this folder. Keep `dist/`, `README.md`, and `test.mjs` together at the repository root. Upload the extracted files, not the ZIP itself.

## Deploy using Vercel

1. Open [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Choose **Other** as the Framework Preset.
3. Set the **Root Directory** to the repository root (`./`).
4. Set the **Output Directory** to `dist`.
5. **Leave the Build Command empty** (disable any automatically suggested build command).
6. Click **Deploy**.

Since this minimal version has no `package.json` or `vercel.json`, you must set the output directory and blank build command in Vercel's project settings.

## Controls

| Control | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look around |
| Left click | Shoot |
| Right click | Aim |
| `Space` | Jump |
| `Shift` | Sprint |
| `R` | Reload |
| `1`–`5` or mouse wheel | Change unlocked weapon |
| `B` | Open armory |
| `G` | Throw grenade |
| `H` | Use medkit |
| `T` | Deploy sentry |
| `Esc` | Pause |
| Arrow keys | Alternative aiming controls |

Your highest wave and score are saved locally in your browser.
