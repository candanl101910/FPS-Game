# 🎮 CyberStrike 3D: Wave Survival

A fast-paced 3D First-Person Shooter browser game built using **Three.js**, **Tailwind CSS**, and **Web Audio API**. Fight through scaling wave survival challenges, earn coins, manage hotbars, upgrade weapons, and unleash unique class ultimate abilities.

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- **5 Combat Classes**: Select from Commando, Cyber Ninja, Titan, Shadow Medic, or Pyromaniac, each with unique starting loadouts and ultimate abilities (`Q`).
- **3-Slot Hotbar**: Hot-key switching between primary weapons, sidearms, and tactical throwables (`1`, `2`, `3`).
- **Wave Progression**: Dynamic enemy scaling with health/shield pickups and automatic +25 shield restoration after each wave.
- **In-Game Armory Shop**: Upgrade player attributes, purchase primary weapons, sidearms, and tactical tools using earned credits.
- **Floating Combat Text**: Dynamic animated `-XX HP` damage markers and critical hit indicators.
- **Zero External Assets**: Uses procedural meshes and synthesized audio via Web Audio API.

---

## 🕹️ Controls

| Key / Input | Action |
| :--- | :--- |
| **WASD** | Movement |
| **Space** | Jump |
| **Left Click** | Fire / Swing Weapon / Use Tool |
| **Right Click / Mouse Movement** | Aim / Rotate Camera |
| **1, 2, 3** | Hotbar Slot Switch (Primary / Sidearm / Tool) |
| **R** | Reload Weapon |
| **Q** | Activate Class Ultimate Ability |
| **B** | Open Tactical Armory |
| **P / Esc** | Pause Game / Menu |

---

## 🚀 Quick Start

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fps-wave-survival.git
   cd fps-wave-survival
   ```

2. Run automated test suite:
   ```bash
   npm test
   ```

3. Start a local server:
   ```bash
   npm run start
   ```

4. Open `http://localhost:3000` in your web browser.

---

## 📁 Repository Structure

```text
fps-wave-survival/
├── index.html          <-- Root build for GitHub Pages
├── package.json        <-- Build scripts & test commands
├── README.md           <-- Documentation
├── .gitignore          <-- Git ignore rules
├── test/
│   └── index.js        <-- Unit tests
├── src/
│   └── index.html      <-- Main source file
└── dist/
    └── index.html      <-- Production distribution build
```

---

## 🌐 Deploy to GitHub Pages

1. Go to your GitHub repository **Settings**.
2. Navigate to **Pages** under Code and Automation.
3. Under **Build and deployment > Branch**, select `main` (or `master`) and set the folder to `/ (root)` or `/dist`.
4. Click **Save**. Your game will be live at `https://YOUR_USERNAME.github.io/fps-wave-survival/`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.