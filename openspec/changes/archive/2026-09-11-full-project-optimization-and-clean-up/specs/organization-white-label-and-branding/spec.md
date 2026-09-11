## ADDED Requirements

### Requirement: Comprehensive Dynamic Identity Coverage
The application components, showcase widgets, match planners, and system manual documentation SHALL dynamically resolve organization and venue branding from `branding.ts`, eliminating static legacy placeholders across all views.

#### Scenario: Displaying Tournament Brackets Showcase
- **WHEN** a user views the tournament bracket preview on the landing page
- **THEN** the showcase renders the configured organization name or short name instead of static club names.

#### Scenario: Prepopulating Match Venue Defaults
- **WHEN** creating or displaying next match details on the dashboard
- **THEN** the interface defaults to the configured organization location when no custom venue is specified.
