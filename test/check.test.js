import test from 'node:test';
import assert from 'node:assert/strict';
import { checkJobs } from '../src/check.js';

const now = '2026-11-05T12:00:00Z';
function job(overrides = {}) {
  return { name: 'pipeline', intervalMinutes: 30, graceMinutes: 5, lastSuccess: '2026-11-05T11:30:00Z', ...overrides };
}
test('healthy within interval plus grace', () => {
  const result = checkJobs({ jobs: [job()] }, now);
  assert.equal(result.ok, true);
  assert.equal(result.jobs[0].ageMinutes, 30);
});
test('identifies overdue runs', () => {
  const result = checkJobs({ jobs: [job({ lastSuccess: '2026-11-05T11:20:00Z' })] }, now);
  assert.equal(result.jobs[0].status, 'overdue');
  assert.equal(result.ok, false);
});
test('never-run and future timestamps are unhealthy', () => {
  const results = checkJobs({ jobs: [job({ name: 'a', lastSuccess: null }), job({ name: 'b', lastSuccess: '2026-11-05T12:10:00Z' })] }, now);
  assert.deepEqual(results.jobs.map(x => x.status), ['never-run', 'future-timestamp']);
});
test('rejects duplicate job names', () => {
  assert.throws(() => checkJobs({ jobs: [job(), job()] }, now), /Duplicate/);
});
test('rejects invalid schedule and ambiguous timezone', () => {
  assert.throws(() => checkJobs({ jobs: [job({ intervalMinutes: 0 })] }, now), /positive/);
  assert.throws(() => checkJobs({ jobs: [job({ lastSuccess: '2026-11-05T10:00:00' })] }, now), /timezone/);
});
test('empty job list is a valid no-op', () => {
  assert.equal(checkJobs({ jobs: [] }, now).ok, true);
});
