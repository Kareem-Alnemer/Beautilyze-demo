import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePredictions } from './evaluate-predictions.mjs';

// Label-only synthetic unit fixtures. These are not measured model results.
const fixture = () => ['dry', 'normal', 'oily'].flatMap((label) => Array.from({ length: 10 }, (_, i) => ({
  sample_id: `${label}-${i}`, model: 'skin_type', model_version: 'fixture-v1',
  true_label: label, predicted_label: label, held_out: 'true',
})));

test('computes accuracy and a true-label-row confusion matrix', () => {
  const rows = fixture();
  rows[0].predicted_label = 'oily';
  const [report] = evaluatePredictions(rows);
  assert.equal(report.accuracy, 29 / 30);
  assert.deepEqual(report.confusion_matrix, [[9, 0, 1], [0, 10, 0], [0, 0, 10]]);
});
test('rejects duplicate samples rather than counting them twice', () => {
  const rows = fixture();
  assert.throws(() => evaluatePredictions([...rows, rows[0]]), /repeated sample/);
});
test('rejects empty input', () => assert.throws(() => evaluatePredictions([]), /No predictions/));
test('rejects sparse class coverage', () => assert.throws(() => evaluatePredictions(fixture().slice(1)), /10 held-out/));
test('rejects training data, mock outputs, invalid labels and mixed versions', () => {
  for (const patch of [{ held_out: 'false' }, { model_version: 'mock-v1' }, { predicted_label: 'clear' }, { model_version: 'another-version' }]) {
    const rows = fixture();
    Object.assign(rows[0], patch);
    assert.throws(() => evaluatePredictions(rows));
  }
});
test('keeps the two models in separate reports', () => {
  const acne = fixture().map((row) => ({ ...row, model: 'acne_severity',
    true_label: { dry: 'mild', normal: 'moderate', oily: 'severe' }[row.true_label],
    predicted_label: { dry: 'mild', normal: 'moderate', oily: 'severe' }[row.predicted_label],
  }));
  assert.equal(evaluatePredictions([...fixture(), ...acne]).length, 2);
});
