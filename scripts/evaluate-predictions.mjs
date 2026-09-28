import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';

const classes = {
  skin_type: ['dry', 'normal', 'oily'],
  acne_severity: ['mild', 'moderate', 'severe'],
};

export function evaluatePredictions(rows) {
  if (!rows.length) throw new Error('No predictions supplied.');
  const groups = new Map();
  const seen = new Set();
  rows.forEach((row, index) => {
    const labels = classes[row.model];
    if (!labels || !labels.includes(row.true_label) || !labels.includes(row.predicted_label)) {
      throw new Error(`Row ${index + 2}: unsupported model or class label.`);
    }
    if (row.held_out !== 'true') throw new Error(`Row ${index + 2}: held-out confirmation is required.`);
    if (!row.sample_id?.trim() || !row.model_version?.trim() || /mock/i.test(row.model_version)) {
      throw new Error(`Row ${index + 2}: sample ID and non-mock model version are required.`);
    }
    const identity = JSON.stringify([row.model, row.sample_id]);
    if (seen.has(identity)) throw new Error(`Row ${index + 2}: repeated sample within a model.`);
    seen.add(identity);
    if (!groups.has(row.model)) groups.set(row.model, {
      model: row.model, model_version: row.model_version, labels,
      confusion_matrix: labels.map(() => labels.map(() => 0)),
    });
    const group = groups.get(row.model);
    if (group.model_version !== row.model_version) throw new Error('Do not combine different model versions in one report.');
    group.confusion_matrix[labels.indexOf(row.true_label)][labels.indexOf(row.predicted_label)]++;
  });

  return [...groups.values()].map((group) => {
    const samples_per_class = group.confusion_matrix.map((row) => row.reduce((sum, n) => sum + n, 0));
    if (samples_per_class.some((count) => count < 10)) throw new Error('At least 10 held-out samples per class are required by blueprint 5.7.');
    const sample_count = samples_per_class.reduce((sum, n) => sum + n, 0);
    const correct = group.confusion_matrix.reduce((sum, row, i) => sum + row[i], 0);
    return { ...group, samples_per_class, sample_count, correct, accuracy: correct / sample_count,
      matrix_axes: 'rows = true labels; columns = predicted labels',
      limitation: 'Held-out provenance is declared by the evaluator, not independently verified by this script. Accuracy is not confidence calibration or clinical validation.',
    };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/evaluate-predictions.mjs <predictions.csv>');
    const rows = parse(readFileSync(process.argv[2], 'utf8'), { columns: true, skip_empty_lines: true, trim: true });
    process.stdout.write(`${JSON.stringify(evaluatePredictions(rows), null, 2)}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
