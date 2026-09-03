## Why

During competitive matches, technical table annotators, bench players, and spectators require real-time score and annotation updates without manual page refreshes. Additionally, temporary outdoor network disconnects risk lost entries during intense tournament points unless a resilient offline sync queue is available.

## What Changes

- **Server-Sent Events (SSE) Broadcaster:** Implements an in-memory event stream broadcaster in `apps/api/src/lib/eventBroadcaster.ts` that emits real-time point notifications.
- **Real-Time Streaming Endpoint:** Adds `GET /api/annotations/stream` in `apps/api/src/routes/annotations.ts` providing an HTTP SSE channel for active matches.
- **Frontend Real-Time Listener & Offline Resilience:** Updates `apps/web/src/components/LiveAnnotationsTable.tsx` to automatically listen for SSE match updates and maintain a persistent offline retry queue for actions logged without connectivity.

## Capabilities

### New Capabilities
- `live-match-streaming-and-offline-sync`: Establishes real-time Server-Sent Events for match annotations and an offline-first queue for technical table scoring.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Files:**
  - `apps/api/src/lib/eventBroadcaster.ts`
  - `apps/api/src/routes/annotations.ts`
  - `apps/web/src/components/LiveAnnotationsTable.tsx`
