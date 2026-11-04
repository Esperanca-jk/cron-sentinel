# cron-sentinel

Check whether scheduled jobs are still reporting successful runs. No monitoring server, external API, or background daemon required.

Jobs can be executed by cron, Task Scheduler, GitHub Actions, or another scheduler. Feed the tool a JSON list containing the last **successful** run of each job, its expected interval, and an optional grace period.

## Quick start

Requires Node.js 20+.

```bash
git clone https://github.com/Esperanca-jk/cron-sentinel.git
cd cron-sentinel
node src/cli.js examples/jobs.json --now 2026-11-05T12:00:00Z
node src/cli.js examples/jobs.json --now 2026-11-05T12:00:00Z --json
npm test
```

## Input

```json
{
  "jobs": [
    {
      "name": "nightly-import",
      "intervalMinutes": 1440,
      "graceMinutes": 30,
      "lastSuccess": "2026-11-05T01:00:00Z"
    }
  ]
}
```

A missing or null `lastSuccess` produces `never-run`. Future timestamps more than one minute ahead are flagged. `--now` allows deterministic replay and tests.

**Exit codes:** 0 all healthy; 1 overdue, never-run, or clock issue; 2 invalid input.

### Integrate with existing monitoring

Have each scheduled job write its own last-success timestamp to your existing status file or data store. Run this CLI from any monitoring system and alert when its exit status is 1. The tool itself does not schedule jobs, transmit alerts, update heartbeat timestamps, or parse cron expressions.

No GitHub Actions workflows are included or enabled.

## Security

Do not put access tokens in the input JSON. Timestamp data stays local. See [CONTRIBUTING.md](CONTRIBUTING.md).

[MIT License](LICENSE).
