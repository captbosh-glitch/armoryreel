# Armory.Reel

The movie weapons database: weapons, the films they're in and the characters who carry them.
Live at https://captbosh-glitch.github.io/armoryreel/ (noindexed for now).

## How it's built

- `data/*.json` holds the content: `weapons`, `films`, `characters`, `categories`, and `site`
  (the home page's hero weapon, featured weapons and films).
- `python3 scripts/build.py` writes every page: `index.html` plus `weapons/`, `films/`,
  `characters/` and `categories/`. Don't edit those by hand; edit `data/` and rebuild.
- `assets/site.css` and `assets/site.js` are shared by every page.

## Adding a weapon

1. Drop the images in:
   - `assets/weapons/{art}.jpg` (2400x1350 art) or `assets/photos/{art}.jpg` (a photo wins over the art)
   - `assets/gallery/{slug}/` for gallery photos
   - `assets/posters/{poster}.jpg` (600x900) and `assets/characters/{photo}.jpg` (640x800)
2. Add the weapon to `data/weapons.json` (and any new film or character to theirs).
   Videos are YouTube ids (`yt`) with a caption, credit and duration.
3. Run the build. It stops on a bad reference or a missing gallery photo, and lists
   images on disk that no page uses yet.
