# Agent Connection Management Specification

## Purpose

Define the self-service lifecycle for private MCP connections in TODO.

## Requirements

### Requirement: Authenticated Settings Management

The system MUST expose authenticated self-service agent connection management inside Settings so each user can inspect their own connections, credentials, and recent audit activity.

#### Scenario: Settings loads current management state
- GIVEN an authenticated user opens Settings
- WHEN the management surface renders
- THEN the UI MUST list that user's existing agent clients
- AND the UI MUST show recent audit events for that same user scope

#### Scenario: User creates a new connection
- GIVEN an authenticated user is in Settings
- WHEN they submit a valid connection name, kind, and scopes
- THEN the system MUST create an agent client owned by that user
- AND the response MUST include the created client summary

### Requirement: One-Time Token Visibility And Lifecycle Controls

The system MUST reveal a plain token only at credential creation time and MUST support credential rotation and revocation without exposing previously issued secrets again.

#### Scenario: Token is shown once after issue
- GIVEN a connection is created or rotated successfully
- WHEN the mutation completes
- THEN the plain token MUST be returned for that response only
- AND later reads MUST NOT reveal the full token again

#### Scenario: Client revocation invalidates active credentials
- GIVEN an agent client has one or more active credentials
- WHEN the user revokes the client
- THEN the client MUST move to `REVOKED`
- AND all active credentials for that client MUST become revoked

### Requirement: Provider Onboarding Snippets

The system MUST generate provider-specific onboarding instructions for Codex, Claude Code, Cursor, and a generic MCP client from the same base URL and token metadata.

#### Scenario: User copies a provider snippet
- GIVEN the user has a current token or placeholder state
- WHEN they select a provider
- THEN the system MUST render the corresponding command or config snippet
- AND the snippet MUST target the TODO MCP package and current base URL

### Requirement: Client-Safe Agent Imports

Client-side Settings surfaces and browser-facing helpers MUST consume agent metadata from client-safe modules only, without importing mixed server barrels that re-export Prisma or other server-only dependencies.

#### Scenario: Settings client code consumes agent metadata
- GIVEN a client component or browser-facing helper needs agent constants, contracts, types, or onboarding snippets
- WHEN it imports those dependencies
- THEN it MUST import from client-safe leaf modules such as `constants`, `contracts`, `types`, or `onboarding`
- AND it MUST NOT import the mixed `@/lib/agents` barrel

#### Scenario: Browser bundle excludes server-only agent dependencies
- GIVEN the Settings onboarding flow is bundled for the browser
- WHEN the import graph is resolved
- THEN Prisma, `server-only`, and Node-only agent management dependencies MUST remain outside the client bundle
- AND Settings onboarding MUST stay compatible with the Next.js client build pipeline

### Requirement: Synchronized Mutation Responses

Management mutations MUST return enough refreshed state for the Settings UI to stay synchronized without a second round-trip.

#### Scenario: Mutation updates audit activity
- GIVEN the user creates, rotates, or revokes an agent resource
- WHEN the mutation response is returned
- THEN it MUST include the updated client summary
- AND it MUST include refreshed recent audit events for the user
