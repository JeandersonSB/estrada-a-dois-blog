import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { canStamp } from '../app/rota-biker/status.ts';
import { pinSvg } from '../app/rota-biker/pinIcon.ts';

const monuments = JSON.parse(fs.readFileSync(new URL('../app/rota-biker/monuments.json', import.meta.url), 'utf8'));

test('every monument has a known status and no status text in its name', () => {
  for (const m of monuments) {
    assert.ok(['carimbando', 'fase_final', 'em_construcao'].includes(m.status), `#${m.number} sem status válido`);
    assert.doesNotMatch(m.name, /em construção/i, `#${m.number}: situação deve ficar em status, não no nome`);
  }
});

test('only stamping monuments can be visited or routed', () => {
  assert.deepEqual(monuments.filter(m => !canStamp(m)).map(m => m.number).sort((a, b) => a - b), [40, 41, 42, 45, 46]);
  assert.equal(canStamp({ status: 'fase_final' }), true);
  assert.equal(canStamp({ status: 'em_construcao' }), false);
  assert.equal(canStamp({ status: 'qualquer' }), false);
});

test('pins differ by shape, not only by color', () => {
  assert.match(pinSvg('indisponivel'), /stroke-dasharray/);
  assert.doesNotMatch(pinSvg('disponivel'), /stroke-dasharray/);
  assert.match(pinSvg('visitado'), /<circle/);
  assert.doesNotMatch(pinSvg('disponivel'), /<circle/);
});
