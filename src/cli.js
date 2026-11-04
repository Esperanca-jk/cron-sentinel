#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { checkJobs } from './check.js';

const args = process.argv.slice(2);
const usage = 'Usage: node src/cli.js jobs.json [--json] [--now 2026-11-05T12:00:00Z]';
if (args.includes('--help') || args.includes('-h')) {
  console.log(usage);
} else {
  const allowed = new Set(['--json', '--now']);
  const unexpected = args.filter((arg, i) => arg.startsWith('--') && !allowed.has(arg));
  const position = args.indexOf('--now');
  const now = position >= 0 ? args[position + 1] : new Date();
  const files = args.filter((arg, index) => !arg.startsWith('--') && index !== position + 1);
  if (unexpected.length || files.length !== 1 || (position >= 0 && (!args[position + 1] || args[position + 1].startsWith('--')))) {
    console.error(usage);
    process.exitCode = 2;
  } else {
    try {
      const data = JSON.parse(await readFile(files[0], 'utf8'));
      const result = checkJobs(data, now);
      if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
      else {
        for (const job of result.jobs) {
          console.log(job.status.padEnd(17) + ' ' + job.name + ' (' +
            (job.ageMinutes === null ? 'no heartbeat' : job.ageMinutes + ' min') + ')');
        }
        console.log(result.ok ? 'All jobs healthy' : 'One or more jobs require attention');
      }
      process.exitCode = result.ok ? 0 : 1;
    } catch (error) {
      console.error('Unable to check jobs: ' + error.message);
      process.exitCode = 2;
    }
  }
}
