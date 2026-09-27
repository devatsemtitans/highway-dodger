# 🚗 Highway Dodger

A fast-paced 2D highway traffic dodging game built with [Kaboom.js](https://kaboomjs.com/).

## 🎮 Play

Open `index.html` in a browser via a local server:

```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`

## 🕹️ Controls

| Action | Keys |
|---|---|
| Steer Left | `←` / `A` / `Q` (AZERTY) |
| Steer Right | `→` / `D` |
| Gas | `↑` / `W` / `Z` (AZERTY) |
| Brake | `↓` / `S` |
| Pause | `P` / `ESC` |

📱 **Mobile:** Touch left/right sides to steer. Bottom corners for Gas/Brake.

## 🏆 Ranks

| Score | Rank |
|---|---|
| 0 | Learner |
| 1,000 | Rookie Driver |
| 5,000 | Street Racer |
| 12,000 | Highway Pro |
| 25,000 | Speed Legend |
| 50,000 | Road King 👑 |

## ✨ Features

- Winding procedural road with real curve physics
- 5 traffic vehicle types (Car, Taxi, Van, Truck, Bus)
- Procedural audio: engine hum, crash, coin, background beat
- Mobile touch controls
- Persistent high score via localStorage
- Milestone rank system with in-game announcements
- Pause / Resume
- AZERTY keyboard support (France/Belgium)
- CrazyGames quality guidelines compliant

## 🛠️ Tech Stack

- [Kaboom.js v3000](https://kaboomjs.com/) — game engine (CDN)
- Web Audio API — procedural sound engine
- SVG assets — generated via Node.js script (`build_natural_assets.js`)

## 📁 Files

| File | Purpose |
|---|---|
| `index.html` | Entry point |
| `game.js` | All game logic |
| `build_natural_assets.js` | Generates SVG art assets |
| `*.svg` | Vector game sprites |
