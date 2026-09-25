#!/usr/bin/env node
/**
 * Catalog Seed Script
 *
 * Reads catalog/products.csv and catalog/ingredients.csv,
 * runs normalization pipeline, generates SQL seed files.
 *
 * Per ADR-003: CSV is source of truth, script validates and generates SQL.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Splits a raw ingredient string into individual ingredients.
 * Handles commas inside parentheses by tracking paren depth.
 */
function splitIngredients(raw) {
  const result = [];
  let current = '';
  let parenDepth = 0;

  for (const char of raw) {
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) result.push(trimmed);
      current = '';
    } else {
      current += char;
    }
  }

  const trimmed = current.trim();
  if (trimmed) result.push(trimmed);

  return result;
}

/**
 * Normalizes a single ingredient string.
 */
function normalizeIngredientString(ingredient) {
  let normalized = ingredient.toLowerCase().trim();
  normalized = normalized.replace(/\([^)]*\)/g, '').trim();
  normalized = normalized.replace(/[.,;]+$/, '').trim();
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

/**
 * Builds a lookup map from alias -> canonical ingredient_name.
 * Does not overwrite canonical names with aliases.
 */
function buildAliasMap(concerns) {
  const aliasMap = new Map();

  // First pass: register all canonical names
  for (const concern of concerns) {
    const canonical = concern.ingredient_name.toLowerCase().trim();
    aliasMap.set(canonical, canonical);
  }

  // Second pass: add aliases, but only if not already a canonical name
  for (const concern of concerns) {
    const canonical = concern.ingredient_name.toLowerCase().trim();
    for (const alias of concern.aliases) {
      const normalizedAlias = alias.toLowerCase().trim();
      // Only add alias if not already in map (canonical names take precedence)
      if (!aliasMap.has(normalizedAlias)) {
        aliasMap.set(normalizedAlias, canonical);
      }
    }
  }

  return aliasMap;
}

/**
 * Main normalization function.
 */
function normalizeFromRawString(rawString, concerns) {
  const split = splitIngredients(rawString);
  const aliasMap = buildAliasMap(concerns);
  const normalized = [];
  const unmatched = [];

  for (const raw of split) {
    const cleaned = normalizeIngredientString(raw);
    if (!cleaned) continue;

    const canonical = aliasMap.get(cleaned);
    if (canonical) {
      normalized.push(canonical);
    } else {
      normalized.push(cleaned);
      unmatched.push(cleaned);
    }
  }

  const unmatchedCount = unmatched.length;
  const totalCount = normalized.length;
  const partialData = totalCount > 0 && unmatchedCount / totalCount > 0.3;

  return {
    ingredients_normalized: normalized,
    unmatched_count: unmatchedCount,
    partial_data: partialData,
    unmatched_ingredients: unmatched,
  };
}

function parseArrayField(field) {
  if (!field || field.trim() === '') return [];
  return field.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}

function parseBooleanField(field) {
  return field.toLowerCase() === 'true';
}

function escapeSqlString(str) {
  return str.replace(/'/g, "''");
}

function formatArrayForSql(arr) {
  if (arr.length === 0) return '{}';
  return '{' + arr.map((s) => '"' + escapeSqlString(s) + '"').join(',') + '}';
}

function generateProductInsert(product, concerns) {
  const norm = normalizeFromRawString(product.ingredients_raw, concerns);

  const skinTypeTags = parseArrayField(product.skin_type_tags);
  const concernTags = parseArrayField(product.concern_tags);

  const values = [
    `'${escapeSqlString(product.id)}'`,
    `'${escapeSqlString(product.name)}'`,
    `'${escapeSqlString(product.brand)}'`,
    `'${escapeSqlString(product.ingredients_raw)}'`,
    formatArrayForSql(norm.ingredients_normalized),
    norm.unmatched_count,
    norm.partial_data,
    formatArrayForSql(skinTypeTags),
    formatArrayForSql(concernTags),
    product.age_notes ? `'${escapeSqlString(product.age_notes)}'` : 'NULL',
    product.annotation_source ? `'${escapeSqlString(product.annotation_source)}'` : 'NULL',
    product.annotation_rationale ? `'${escapeSqlString(product.annotation_rationale)}'` : 'NULL',
    product.annotator ? `'${escapeSqlString(product.annotator)}'` : 'NULL',
    product.annotated_at ? `'${product.annotated_at}'` : 'now()',
  ];

  return `INSERT INTO products (id, name, brand, ingredients_raw, ingredients_normalized, unmatched_count, partial_data, skin_type_tags, concern_tags, age_notes, annotation_source, annotation_rationale, annotator, annotated_at) VALUES (${values.join(', ')});`;
}

function generateIngredientInsert(ing) {
  const values = [
    `'${escapeSqlString(ing.ingredient_name)}'`,
    formatArrayForSql(parseArrayField(ing.aliases)),
    formatArrayForSql(parseArrayField(ing.helps_with)),
    formatArrayForSql(parseArrayField(ing.caution_for)),
    parseBooleanField(ing.is_common_allergen),
    parseBooleanField(ing.is_sensitivity_flag),
    parseBooleanField(ing.is_strong_active),
    parseBooleanField(ing.is_barrier_support),
    ing.reason ? `'${escapeSqlString(ing.reason)}'` : 'NULL',
    ing.source ? `'${escapeSqlString(ing.source)}'` : 'NULL',
  ];

  return `INSERT INTO ingredient_concerns (ingredient_name, aliases, helps_with, caution_for, is_common_allergen, is_sensitivity_flag, is_strong_active, is_barrier_support, reason, source) VALUES (${values.join(', ')}) ON CONFLICT (ingredient_name) DO UPDATE SET aliases = EXCLUDED.aliases, helps_with = EXCLUDED.helps_with, caution_for = EXCLUDED.caution_for, is_common_allergen = EXCLUDED.is_common_allergen, is_sensitivity_flag = EXCLUDED.is_sensitivity_flag, is_strong_active = EXCLUDED.is_strong_active, is_barrier_support = EXCLUDED.is_barrier_support, reason = EXCLUDED.reason, source = EXCLUDED.source;`;
}

function main() {
  const catalogDir = path.join(__dirname, '..', 'catalog');
  const productsCsvPath = path.join(__dirname, '..', 'catalog', 'products.csv');
  const ingredientsCsvPath = path.join(__dirname, '..', 'catalog', 'ingredients.csv');
  const outputDir = path.join(__dirname, '..', 'supabase', 'seed');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const productsCsv = fs.readFileSync(productsCsvPath, 'utf-8');
  const ingredientsCsv = fs.readFileSync(ingredientsCsvPath, 'utf-8');

  const products = parse(productsCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const ingredients = parse(ingredientsCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const concerns = ingredients.map((ing) => ({
    ingredient_name: ing.ingredient_name,
    aliases: parseArrayField(ing.aliases),
  }));

  const productStatements = products.map((p) => generateProductInsert(p, concerns)).join('\n\n');
  const ingredientStatements = ingredients.map((i) => generateIngredientInsert(i)).join('\n\n');

  const productsSql = `-- Seed: products\n-- Generated by scripts/seed-catalog.mjs\n-- Run after migrations 001, 002, 003\n\n${productStatements}\n`;

  const ingredientsSql = `-- Seed: ingredient_concerns\n-- Generated by scripts/seed-catalog.mjs\n-- Run after migrations 001, 002, 003\n\n${ingredientStatements}\n`;

  fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed', '001_products.sql'), productsSql);
  fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed', '002_ingredient_concerns.sql'), ingredientsSql);

  console.log(`Generated ${products.length} product inserts`);
  console.log(`Generated ${ingredients.length} ingredient inserts`);
  console.log(`Output written to supabase/seed/`);
}

main();