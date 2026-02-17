# Abyssal Skyline (WIP)

This is the early prototype for **Abyssal Skyline**, a neon-drenched isometric runner rendered fully in WebGL (Three.js). Right now it contains:

- Procedural megacity spine with animated platform segments.
- Hovercraft player rig with lane swapping, aerial vault, and burst draft.
- Ion-thread pickups that feed the lattice energy meter.
- Formation placeholders (electro-arc squads) moving through the lane space.
- HUD overlay wired to live game state.
- Touch + keyboard controls.

## Tech stack

- Vanilla ES modules
- Three.js r162
- No build step required – runs as static files

## Local dev

```bash
python3 -m http.server 4173
# or
npx serve
```

Then open http://localhost:4173/ in a modern browser (desktop or mobile). The prototype is pre-alpha; expect placeholder assets and unfinished balance.

## Roadmap

- Enemy AI behaviours for spiral/bloom formations
- Rail vault system that adds vertical play
- Screen-space post-processing (bloom, aberration, glitch)
- Persistent upgrades + meta progression
- Audio pass (sfx + music)
