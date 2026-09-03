## Why

High-frequency tournament operations (such as calculating 7v7 line configurations by team side, compiling live match scores by annotation type, and filtering roster users by approval status) currently evaluate queries that benefit from multi-column compound indexing. Adding targeted indexes in Prisma prevents sequential table scans as the tournament history grows.

## What Changes

- **EventParticipant Indexing:** Adds `@@index([eventId, teamSide])` and `@@index([eventId, lineType])` to accelerate tournament line building and defensive/offensive roster lookups.
- **EventAnnotation Indexing:** Adds `@@index([eventId, type])` to optimize live scoreboard aggregation and point-by-point filtering in Mesa Técnica.
- **User Indexing:** Adds `@@index([teamId, status])` to accelerate team roster queries and user approval filtering.

## Capabilities

### New Capabilities
- `database-indexing-optimization`: Adds composite database indexes for tournament line matrices, live match score aggregations, and team user status lookups.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Files:**
  - `apps/api/prisma/schema.prisma`
  - Root `prisma/schema.prisma` (if present)
