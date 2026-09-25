#!/usr/bin/env node
/**
 * The recommendation engine is owned by the Suppli Afya app
 * (github.com/eddienjeru564-ship-it/suppli_afya, src/engine/). This repository
 * keeps an exact copy in src/engine/ and never edits it.
 *
 *   npm run engine:check              verify src/engine/ matches engine.lock.json
 *   npm run engine:sync               copy the engine from ../suppli_afya and update the lock
 *   npm run engine:sync -- --from DIR copy from another checkout of suppli_afya
 *
 * `npm test` runs the same check, so a local edit to the engine fails CI.
 * To change the engine, change it upstream, then sync.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE_DIR = join(ROOT, "src/engine");
const LOCK = join(ROOT, "engine.lock.json");

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const tsFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".ts")).sort();

/** Differences between src/engine/ and the lock file. Empty means the copy is intact. */
export function engineDrift() {
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const problems = [];
  const present = new Set(tsFiles(ENGINE_DIR));
  for (const [file, hash] of Object.entries(lock.files)) {
    if (!present.has(file)) problems.push(`missing: src/engine/${file}`);
    else if (sha256(join(ENGINE_DIR, file)) !== hash) problems.push(`changed: src/engine/${file}`);
    present.delete(file);
  }
  for (const file of present) problems.push(`not upstream: src/engine/${file}`);
  return problems;
}

function sync(from) {
  const source = join(from, "src/engine");
  if (!existsSync(source)) {
    console.error(`No engine found at ${source}. Pass --from <path to a suppli_afya checkout>.`);
    process.exit(1);
  }
  for (const f of tsFiles(ENGINE_DIR)) rmSync(join(ENGINE_DIR, f));
  const files = {};
  for (const f of tsFiles(source)) {
    copyFileSync(join(source, f), join(ENGINE_DIR, f));
    files[f] = sha256(join(ENGINE_DIR, f));
  }
  let commit = null;
  try {
    commit = execFileSync("git", ["-C", from, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    /* not a git checkout */
  }
  const lock = {
    upstream: "github.com/eddienjeru564-ship-it/suppli_afya",
    path: "src/engine",
    commit,
    syncedAt: new Date().toISOString().slice(0, 10),
    note: "Exact copy of the Suppli Afya engine. Do not edit here; change it upstream and run npm run engine:sync.",
    files,
  };
  writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
  console.log(`Synced ${Object.keys(files).length} engine files from ${from}${commit ? ` @ ${commit.slice(0, 7)}` : ""}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "sync") {
    const i = rest.indexOf("--from");
    const from = resolve(ROOT, i >= 0 ? rest[i + 1] : process.env.SUPPLI_AFYA_DIR ?? "../suppli_afya");
    sync(from);
  } else if (cmd === "check") {
    const problems = engineDrift();
    if (problems.length) {
      console.error("src/engine/ no longer matches engine.lock.json:\n  " + problems.join("\n  "));
      console.error("The engine is owned upstream. Revert local edits, or run npm run engine:sync.");
      process.exit(1);
    }
    console.log("Engine matches the upstream copy.");
  } else {
    console.log("Usage: node scripts/engine.mjs <check|sync> [--from <suppli_afya checkout>]");
    process.exit(1);
  }
}
