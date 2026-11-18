// Warung Rush — make.fun best-game-01 entrypoint (Node 22, standard library only).
//
// This program hands the game in: it copies the game's static files (game/)
// and the screenshots (screenshots/) from beside this file into /output and
// writes /output/dossier.json with the vendored make.fun library — the
// summary the judge reads. It runs twice in the grader and both runs must
// write the same bytes, so nothing here depends on the clock or on chance.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Count plain files under a directory (guards the gate's caps early).
function countFiles(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    total += info.isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

function handIn() {
  const gameDir = join(repoRoot, 'game');
  const shotDir = join(repoRoot, 'screenshots');

  mkdirSync(outDir, { recursive: true });
  cpSync(gameDir, join(outDir, 'game'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shotDir)) {
    cpSync(shotDir, join(outDir, 'screenshots'), { recursive: true });
  }

  const gameFiles = countFiles(join(outDir, 'game'));
  if (gameFiles > 993) throw new Error(`game/ holds ${gameFiles} files, over the 993 cap`);

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return gameFiles;
}

const n = handIn();
console.log(`Warung Rush handed in: ${n} game files, dossier written to ${join(outDir, 'dossier.json')}`);
