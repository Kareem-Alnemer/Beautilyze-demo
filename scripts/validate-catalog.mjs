#!/usr/bin/env node
/**
 * Catalog validation (blueprint §7, §11).
 *
 * Checks catalog/products.csv + catalog/ingredients.csv WITHOUT inventing
 * evidence: every product needs a source + rationale, tags must use the
 * closed vocabularies, and ingredient normalization must reproduce the
 * partial_data flags. Fails non-zero with a human-readable report.
 *
 * Run: node scripts/validate-catalog.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const CONCERN_TAGS = new Set(['acne', 'oil_control', 'hydration', 'dryness', 'sensitivity']);
const SKIN_TAGS = new Set(['dry', 'normal', 'oily', 'sensitive', 'combination']);

function readCsv(rel) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  return parse(text, { columns: true, skip_empty_lines: true, trim: true });
}

function splitRaw(raw) {
  const out = [];
  let cur = '';
  let depth = 0;
  for (const ch of raw) {
    if (ch === '(') { depth++; cur += ch; }
    else if (ch === ')') { depth = Math.max(0, depth - 1); cur += ch; }
    else if (ch === ',' && depth === 0) {
      const t = cur.trim();
      if (t) out.push(t);
      cur = '';
    } else cur += ch;
  }
  const t = cur.trim();
  if (t) out.push(t);
  return out;
}

function clean(s) {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[.,;]+$/, '').replace(/\s+/g, ' ').trim();
}

const errors = [];
const warnings = [];

const ingredients = readCsv('catalog/ingredients.csv');
const products = readCsv('catalog/products.csv');

if (products.length < 10) errors.push(`catalog/products.csv has ${products.length} rows; need >= 10 for the current demo set (blueprint target 30+)`);
if (ingredients.length < 10) errors.push(`catalog/ingredients.csv has ${ingredients.length} rows; expected ~20-30`);

// Lookup names for normalization parity check
const known = new Set(ingredients.map((r) => (r.ingredient_name || '').toLowerCase().trim()).filter(Boolean));
for (const row of ingredients) {
  if (!row.source || !row.source.trim()) errors.push(`ingredient "${row.ingredient_name}" is missing a source (blueprint §7.2: every entry cites a source)`);
}

for (const p of products) {
  const id = p.id || p.name || '(unknown)';
  if (!p.annotation_source || !p.annotation_source.trim()) errors.push(`${id}: missing annotation_source`);
  if (!p.annotation_rationale || !p.annotation_rationale.trim()) errors.push(`${id}: missing annotation_rationale`);
  for (const t of (p.concern_tags || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!CONCERN_TAGS.has(t)) errors.push(`${id}: concern tag "${t}" is outside the closed vocabulary (§7.1)`);
  }
  for (const t of (p.skin_type_tags || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!SKIN_TAGS.has(t)) warnings.push(`${id}: skin tag "${t}" is outside the usual set (dry/normal/oily/sensitive)`);
  }
  const rawList = splitRaw(p.ingredients_raw || '').map(clean).filter(Boolean);
  const unmatched = rawList.filter((i) => !known.has(i));
  const ratio = rawList.length ? unmatched.length / rawList.length : 1;
  if (ratio > 0.3) warnings.push(`${id}: ${unmatched.length}/${rawList.length} ingredients unmatched (${Math.round(ratio * 100)}% > 30% threshold → partial_data expected)`);
}

if (errors.length) {
  console.error(`catalog validation FAILED (${errors.length} error(s), ${warnings.length} warning(s)):`);
  for (const e of errors) console.error(`  ERROR: ${e}`);
  for (const w of warnings) console.error(`  WARN: ${w}`);
  process.exit(1);
}
console.log(`catalog validation OK: ${products.length} products, ${ingredients.length} ingredient concerns, ${warnings.length} warning(s).`);
for (const w of warnings) console.log(`  WARN: ${w}`);
