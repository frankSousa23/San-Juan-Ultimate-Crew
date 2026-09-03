## Context

See `proposal.md` for motivation.
`LiveAnnotationsTable.tsx` is the primary interactive table for scoring ultimate matches in real time.

## Goals / Non-Goals

**Goals:**
- Implement `apps/api/src/lib/eventBroadcaster.ts` using Node.js `EventEmitter`.
- Expose `GET /api/annotations/stream` in `annotations.ts`.
- Broadcast on `POST /api/annotations` and `DELETE /api/annotations/:id`.
- Connect `LiveAnnotationsTable.tsx` via `EventSource` and handle offline queuing via `localStorage`.

**Non-Goals:**
- Two-way WebSockets (Server-Sent Events are unidirectional, simpler, and work over standard HTTP/2 / Nginx without custom proxy tunneling).

## Decisions

### Decision 1: SSE over WebSockets
SSE is chosen over WebSockets because scoring updates are strictly server-to-client broadcasts, saving connection handshake overhead and working seamlessly through corporate/mobile firewalls.

### Decision 2: Resilient Local Offline Queue
When `fetch` fails or `!navigator.onLine`, the payload is saved in `localStorage.getItem('sigedivo.offline_annotations')`. When the `online` event fires, the queue is flushed in FIFO order.

## Risks / Trade-offs

- **[Risk] Connection leaks:** Long-lived SSE connections could hold open file descriptors.
  - *Mitigation:* Explicit cleanup on `req.on('close', ...)` removes listeners immediately.
