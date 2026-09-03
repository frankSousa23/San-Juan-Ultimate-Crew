## Purpose

Provides real-time Server-Sent Events (SSE) streaming for tournament matches and offline-resilient action buffering for field annotators.

## ADDED Requirements

### Requirement: SSE Live Match Stream Endpoint
The API SHALL expose an SSE streaming endpoint `GET /api/annotations/stream?eventId=:id` with `text/event-stream` response headers that remains open to push real-time match events.

#### Scenario: Client Connects to Live Match Stream
- **WHEN** client opens an EventSource connection to `/api/annotations/stream?eventId=10`
- **THEN** connection remains established and receives a confirmation heartbeat payload.

### Requirement: Real-Time Event Dispatching
The API SHALL emit real-time event notifications to connected stream clients whenever an annotation is created or deleted for that event.

#### Scenario: Goal Annotation Registered
- **WHEN** `POST /api/annotations` successfully records a goal
- **THEN** all clients connected to that match's stream receive an `ANNOTATION_CREATED` message.

### Requirement: Offline Annotation Queuing
The frontend technical table interface SHALL detect network unavailability and buffer unsubmitted scoring actions in local storage until connectivity is restored.

#### Scenario: Submitting Action While Disconnected
- **WHEN** an annotator records a point without network access
- **THEN** action is saved to the local offline queue and automatically submitted when the browser emits the `online` event.
