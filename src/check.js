const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function readTimestamp(value, label) {
  if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value)) {
    throw new Error(label + ' must be an ISO-8601 timestamp with timezone');
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(label + ' is not a valid timestamp');
  return time;
}

export function checkJobs(document, now = new Date()) {
  if (!document || !Array.isArray(document.jobs)) {
    throw new Error('Expected a JSON object with a jobs array');
  }
  const current = now instanceof Date ? now.getTime() : readTimestamp(now, 'now');
  if (!Number.isFinite(current)) throw new Error('Invalid current time');
  const names = new Set();
  const results = document.jobs.map(job => {
    if (!job || typeof job.name !== 'string' || !job.name.trim()) {
      throw new Error('Each job needs a non-empty name');
    }
    if (names.has(job.name)) throw new Error('Duplicate job name: ' + job.name);
    names.add(job.name);
    if (typeof job.intervalMinutes !== 'number' || !Number.isFinite(job.intervalMinutes) || job.intervalMinutes <= 0) {
      throw new Error(job.name + ': intervalMinutes must be a positive number');
    }
    const grace = job.graceMinutes ?? 0;
    if (typeof grace !== 'number' || !Number.isFinite(grace) || grace < 0) {
      throw new Error(job.name + ': graceMinutes must be non-negative');
    }
    if (job.lastSuccess == null) {
      return { name: job.name, status: 'never-run', ageMinutes: null, allowedMinutes: job.intervalMinutes + grace };
    }
    const last = readTimestamp(job.lastSuccess, job.name + '.lastSuccess');
    const age = (current - last) / 60000;
    const allowed = job.intervalMinutes + grace;
    return {
      name: job.name,
      status: age < -1 ? 'future-timestamp' : age > allowed ? 'overdue' : 'healthy',
      ageMinutes: Math.round(age * 100) / 100,
      allowedMinutes: allowed
    };
  });
  return {
    ok: results.every(job => job.status === 'healthy'),
    checkedAt: new Date(current).toISOString(),
    jobs: results
  };
}
