# Abyssal Skyline (WIP)

WebGL prototype for an isometric neon runner. Latest build adds:

- Spiral / bloom enemy formations with behaviour scripts
- Rail vault nodes that trigger combo + lattice bonuses
- Fog + lighting tweaks, richer trail FX
- HUD timestamp showing build version

## Controls

- **Lane shift:** Arrow keys / A-D / swipe left-right
- **Vault:** Space / tap
- **Burst:** Shift (consumes lattice energy)

## Stack

- Vanilla ES modules
- Three.js r162
- No bundler (static files)

## Run locally

```bash
python3 -m http.server 4173
# or
npx serve
```

Visit `http://localhost:4173`.

## Roadmap

- Audio pass (ambience + SFX)
- Persistent progression layer
- HUD overlays for rail bonuses
