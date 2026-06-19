# Telemetry Data Pipeline

The simulated ETL path is:

`collect → ingest → schema validation → missing-value checks → duplicate-rig checks → timestamp freshness → clean storage → dashboard aggregates`

Quality score weights are completeness 30%, freshness 25%, validity 25%, duplicate control 10%, and error control 10%. Rejected records remain visible for investigation instead of silently disappearing.

For production, use a durable message bus, schema registry, dead-letter queue, idempotent writes, lineage metadata, partitioned time-series storage, and quality alerts tied to data SLAs.
