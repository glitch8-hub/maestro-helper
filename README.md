# Maestro Director's Helper

A live-show companion app for directing Maestro-format improv shows. Built for [Wayward Improvised Theatre](https://waywardimprov.ca) in Ottawa.

## Features

- Roster of players with likes/dislikes that flag game conflicts
- ~110 games with delivery scripts and director's notes
- Auto-generated format running orders sized to your cast
- Shape-of-show tracking (no two zone games, no two solo monologs in the finale, etc.)
- Live game suggestions based on where you are in the show
- Print/PDF export for the booth
- Cross-device sync via Firebase

## Quick start

1. **Local development:** `npm install` then `npm run dev`. Opens at `http://localhost:5173/maestro-helper/`.
2. **Set up cloud sync:** see [`SETUP.md`](./SETUP.md).
3. **Deploy:** push to GitHub `main`. GitHub Actions builds and publishes to GitHub Pages automatically.

## Built with

- React 18 + Vite
- Tailwind CSS
- Firebase Firestore (for sync)
- lucide-react (icons)
