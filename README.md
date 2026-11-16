# NEON STRIKE: Sector Nine

A self-contained, single-player first-person arena shooter that runs entirely in your browser. Fight waves of hostile robots, unlock five weapons, earn credits, and upgrade your equipment.

**Works with GitHub, GitHub Pages, and Vercel.** No framework, database, API keys, or paid dependencies are required.

## Features

- First-person, ray-cast 3D-style arena with textured walls and a tactical minimap
- Three enemy classes: Stalker, Sentinel, and Juggernaut
- Five unlockable weapons: sidearm, SMG, assault rifle, shotgun, and ion railgun
- Endless enemy waves with escalating difficulty
- Credit-based armory for weapons, ammo, damage, rate of fire, speed, health, and armor upgrades
- Grenades, medkits, sentry turrets, pickups, synthesized sound effects, and hit indicators
- Personal-best wave and score saved in browser local storage

## Project structure

```text
neon-strike/
├── dist/                     # Ready-to-deploy game files
│   ├── index.html
│   ├── game.js
│   ├── styles.css
│   └── overrides.css
├── scripts/
│   ├── build.mjs             # Validates the static distribution
│   └── serve.mjs             # Zero-dependency development server
├── tests/
│   ├── project.test.mjs      # Distribution/configuration checks
│   └── gameplay.test.mjs     # Game boot and interaction smoke tests
├── .github/workflows/pages.yml
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

The complete game is already inside **`dist/`**. Because it is plain HTML, CSS, and JavaScript, there is no compilation step. The build command verifies that those files are present, linked correctly, and syntactically valid.

## Run it locally

1. Install [Node.js](https://nodejs.org/) version **20 or newer**.
2. Open a terminal in the `neon-strike` folder.
3. Run:

   ```bash
   npm run dev
   ```

4. Open **http://127.0.0.1:3000** in Chrome, Edge, Firefox, or Safari.

No `npm install` is needed; the project uses only built-in Node.js features.

### Build and test

```bash
npm run build    # Verify dist/ is deployable
npm test         # Run automated smoke tests
npm run check    # Do both
```

You can also open `dist/index.html` directly, but using the development server is recommended.

## Deploy to Vercel

1. Upload this folder to a GitHub repository (instructions below).
2. Go to [vercel.com/new](https://vercel.com/new) and import that repository.
3. Use the project root as the **Root Directory** and select **Other** for the framework, if prompted.
4. The included `vercel.json` sets:

   | Setting | Value |
   | --- | --- |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Framework | Other / no framework |

5. Click **Deploy**. Vercel serves `dist/index.html` and the game assets.

No environment variables are required. Future pushes to your GitHub repository can trigger new deployments.

## Upload to GitHub

Create an empty repository named something like `neon-strike` on GitHub, then run these commands inside this project folder. Replace `YOUR_USERNAME` with your GitHub username:

```bash
git init
git add .
git commit -m "Initial Neon Strike game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neon-strike.git
git push -u origin main
```

Alternatively, use GitHub Desktop to publish the folder, or upload its contents through the GitHub website. Keep the `dist/`, `scripts/`, `tests/`, and `.github/` folders together.

### Optional: host it on GitHub Pages

The included workflow at `.github/workflows/pages.yml` tests the game and deploys `dist/` whenever you push to `main`.

1. Open your repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push to `main`, or run the workflow from the **Actions** tab.

Your website URL will usually look like `https://YOUR_USERNAME.github.io/neon-strike/`. Relative asset paths make the game work in a repository subfolder.

## Game controls

| Control | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look around |
| Left mouse button | Fire |
| Right mouse button | Aim |
| `Space` | Jump |
| `Shift` | Sprint |
| `R` | Reload |
| `1`–`5`, scroll wheel, or `Q` | Switch unlocked weapons |
| `B` | Open the armory |
| `G` | Throw a grenade |
| `H` | Use a medkit |
| `T` | Deploy a sentry turret |
| `Esc` | Pause |
| Arrow keys | Fallback aiming when pointer lock is unavailable |

For the best experience, play on a desktop or laptop using a keyboard and mouse.

## Editing the game

- **Gameplay, enemies, weapons, and upgrades:** `dist/game.js`
- **Menus and HUD:** `dist/index.html`
- **Colours, layout, and visual effects:** `dist/styles.css` and `dist/overrides.css`

After making changes, run `npm run check` before committing. The development server serves the files in `dist/` directly.

## Notes

- This is a single-player game; it does not use accounts or online multiplayer.
- High scores are stored locally in the browser, not shared across devices.
- Game artwork is drawn procedurally in JavaScript; no image hosting or CDN is necessary.
