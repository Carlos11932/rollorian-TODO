# Public MCP Hosting Specification

## Purpose

Define the hosted/public MCP transport for Books and TODO after the private self-service token flow is already in place.

## Requirements

### Requirement: Public Streamable HTTP Endpoints Per App

The system MUST expose a public HTTPS Streamable HTTP MCP endpoint for Books and another for TODO, so users can connect by URL without running a local MCP process.

#### Scenario: User connects to Books remotely
- GIVEN a user has a valid Books agent token
- WHEN they register the hosted Books MCP URL in a compatible MCP client
- THEN the client MUST connect without a local stdio command
- AND the Books endpoint MUST expose only the Books MCP tool catalog

#### Scenario: User connects to TODO remotely
- GIVEN a user has a valid TODO agent token
- WHEN they register the hosted TODO MCP URL in a compatible MCP client
- THEN the client MUST connect without a local stdio command
- AND the TODO endpoint MUST expose only the TODO MCP tool catalog

### Requirement: Existing User Tokens Authenticate Hosted Requests

Hosted MCP requests MUST reuse the current per-user agent tokens and MUST NOT require a global shared secret.

#### Scenario: Valid user token reaches the upstream Agent API
- GIVEN a user provides a valid agent token for the target app
- WHEN the hosted MCP service serves a request
- THEN it MUST forward the bearer token to that app's Agent API
- AND the request MUST execute with the same user-scoped permissions as the private stdio flow

#### Scenario: Revoked or invalid token is rejected
- GIVEN a user token has been revoked or is invalid
- WHEN the hosted MCP service calls the Agent API
- THEN the request MUST be rejected
- AND the MCP client MUST receive a transport-safe authorization failure rather than leaked upstream internals

### Requirement: Shared Host, Isolated App Services

Books and TODO MUST be reachable from the same public host while remaining isolated runtime services.

#### Scenario: Shared host routes to isolated services
- GIVEN the public MCP deployment is online
- WHEN a request targets the Books or TODO MCP path
- THEN the reverse proxy MUST route it to the correct per-app service
- AND env vars, upstream base URLs, and tool catalogs MUST remain isolated per app

### Requirement: Hosted Onboarding In Settings

Books and TODO Settings MUST offer hosted/remote MCP onboarding alongside the existing local stdio setup.

#### Scenario: User chooses hosted onboarding
- GIVEN a user has issued an agent token in Settings
- WHEN they choose the hosted transport option
- THEN the UI MUST show the app-specific hosted MCP URL
- AND the UI MUST render provider-specific hosted snippets for the supported clients
- AND the UI MUST keep the local stdio option available as fallback

### Requirement: Operational Hardening For Public Exposure

The hosted MCP deployment MUST include operational safeguards suitable for public internet exposure.

#### Scenario: Public service exposes health and telemetry
- GIVEN the public MCP services are deployed
- WHEN operators inspect service health
- THEN each service MUST expose a health signal suitable for uptime checks
- AND request/error logging MUST be sufficient to debug auth or transport failures

#### Scenario: Public service limits abuse
- GIVEN the MCP endpoints are reachable from the public internet
- WHEN abusive or excessive traffic arrives
- THEN the deployment MUST apply rate limiting or equivalent protection
- AND legitimate authenticated traffic MUST still reach the MCP service
