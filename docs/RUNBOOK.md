# Operations Runbook

## Service checks

1. Confirm `GET /api/health` returns `status: ok`.
2. Confirm `/api/system/current` has a recent timestamp.
3. Confirm site heartbeats are current and pipeline runs are succeeding.
4. Review active critical alerts and unresolved incidents.

## High temperature

Validate sensor freshness, compare adjacent rigs, inspect cooling-unit assets, verify fan speed and airflow, reduce site load if temperature exceeds 80°C, and escalate to the cooling vendor within SLA. Keep the incident open until temperature remains below 72°C for 15 minutes.

## Rig offline

Check last-seen time, PDU state, controller reachability, network path, and recent maintenance. Power-cycle only under the approved site procedure. Validate accepted-share growth after recovery.

## Hashrate degradation

Compare site and rig trends, pool connectivity, thermal throttling, rejected shares, firmware changes, and offline rigs. Escalate a sustained drop greater than 20%.

## Data freshness

Inspect the latest pipeline log, collector heartbeat, queue backlog, timestamp timezone, rejected records, and database capacity. Re-run the pipeline after correcting the source.
