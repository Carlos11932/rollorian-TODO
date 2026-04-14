# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When building AI chat features - breaking changes from v4. | ai-sdk-5 | /Users/carlosbenito/.config/opencode/skills/ai-sdk-5/SKILL.md |
| When structuring Angular projects or deciding where to place components. | angular-architecture | /Users/carlosbenito/.claude/skills/angular/architecture/SKILL.md |
| When creating Angular components, using signals, or setting up zoneless. | angular-core | /Users/carlosbenito/.claude/skills/angular/core/SKILL.md |
| When working with forms, validation, or form state in Angular. | angular-forms | /Users/carlosbenito/.claude/skills/angular/forms/SKILL.md |
| When optimizing Angular app performance, images, or lazy loading. | angular-performance | /Users/carlosbenito/.claude/skills/angular/performance/SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | /Users/carlosbenito/.config/opencode/skills/branch-pr/SKILL.md |
| When building REST APIs with Django - ViewSets, Serializers, Filters. | django-drf | /Users/carlosbenito/.config/opencode/skills/django-drf/SKILL.md |
| When building desktop apps, working with Electron main/renderer processes, IPC communication, or native integrations. | electron | /Users/carlosbenito/.config/opencode/skills/electron/SKILL.md |
| During Elixir code review, refactoring sessions, or when writing Phoenix/Ecto code. | elixir-antipatterns | /Users/carlosbenito/.config/opencode/skills/elixir-antipatterns/SKILL.md |
| When the user is looking for functionality that might exist as an installable skill. | find-skills | /Users/carlosbenito/.agents/skills/find-skills/SKILL.md |
| When creating PRs, writing PR descriptions, or using gh CLI for pull requests. | github-pr | /Users/carlosbenito/.config/opencode/skills/github-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | /Users/carlosbenito/.config/opencode/skills/go-testing/SKILL.md |
| When structuring Java apps by Domain/Application/Infrastructure, or refactoring toward clean architecture. | hexagonal-architecture-layers-java | /Users/carlosbenito/.config/opencode/skills/hexagonal-architecture-layers-java/SKILL.md |
| When user asks to release, bump version, update homebrew, or publish a new version. | homebrew-release | /Users/carlosbenito/.config/opencode/skills/homebrew-release/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | /Users/carlosbenito/.config/opencode/skills/issue-creation/SKILL.md |
| When writing Java 21 code using records, sealed types, or virtual threads. | java-21 | /Users/carlosbenito/.config/opencode/skills/java-21/SKILL.md |
| When user asks to create an epic, large feature, or multi-task initiative. | jira-epic | /Users/carlosbenito/.config/opencode/skills/jira-epic/SKILL.md |
| When user asks to create a Jira task, ticket, or issue. | jira-task | /Users/carlosbenito/.config/opencode/skills/jira-task/SKILL.md |
| When user says judgment day, judgment-day, review adversarial, dual review, doble review, juzgar, or que lo juzguen. | judgment-day | /Users/carlosbenito/.config/opencode/skills/judgment-day/SKILL.md |
| When working with Next.js - routing, Server Actions, data fetching. | nextjs-15 | /Users/carlosbenito/.config/opencode/skills/nextjs-15/SKILL.md |
| When writing E2E tests - Page Objects, selectors, MCP workflow. | playwright | /Users/carlosbenito/.config/opencode/skills/playwright/SKILL.md |
| When user wants to review PRs, analyze issues, or audit backlog. | pr-review | /Users/carlosbenito/.config/opencode/skills/pr-review/SKILL.md |
| When writing Python tests - fixtures, mocking, markers. | pytest | /Users/carlosbenito/.config/opencode/skills/pytest/SKILL.md |
| When writing React components - no useMemo/useCallback needed. | react-19 | /Users/carlosbenito/.config/opencode/skills/react-19/SKILL.md |
| When building mobile apps, working with React Native components, using Expo, React Navigation, or NativeWind. | react-native | /Users/carlosbenito/.config/opencode/skills/react-native/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | /Users/carlosbenito/.config/opencode/skills/skill-creator/SKILL.md |
| When building or refactoring Spring Boot 3 applications. | spring-boot-3 | /Users/carlosbenito/.config/opencode/skills/spring-boot-3/SKILL.md |
| When styling with Tailwind - cn(), theme variables, no var() in className. | tailwind-4 | /Users/carlosbenito/.config/opencode/skills/tailwind-4/SKILL.md |
| When reviewing technical exercises, code assessments, candidate submissions, or take-home tests. | technical-review | /Users/carlosbenito/.config/opencode/skills/technical-review/SKILL.md |
| When writing TypeScript code - types, interfaces, generics. | typescript | /Users/carlosbenito/.config/opencode/skills/typescript/SKILL.md |
| When writing, reviewing, or refactoring React/Next.js code for performance. | vercel-react-best-practices | /Users/carlosbenito/.agents/skills/vercel-react-best-practices/SKILL.md |
| When using Zod for validation - breaking changes from v3. | zod-4 | /Users/carlosbenito/.config/opencode/skills/zod-4/SKILL.md |
| When managing React state with Zustand. | zustand-5 | /Users/carlosbenito/.config/opencode/skills/zustand-5/SKILL.md |

## Compact Rules

### ai-sdk-5
- Use AI SDK 5 APIs and patterns; do not mix v4 helpers.
- Keep message/state shapes aligned with the v5 primitives actually in use.
- Prefer server-safe boundaries for model calls and streaming.
- Validate tool inputs/outputs explicitly.
- Watch for breaking changes from v4 before refactoring chat flows.

### angular-architecture
- Follow the Scope Rule: place code at the narrowest scope that owns it.
- Keep feature folders cohesive and naming consistent.
- Separate presentational and orchestration responsibilities.
- Avoid dumping shared code into global folders too early.
- Prefer clear architectural boundaries over convenience imports.

### angular-core
- Prefer standalone components over NgModules for new code.
- Use signals for local reactive state when appropriate.
- Prefer inject() over constructor injection in modern Angular code.
- Use new control flow syntax consistently.
- Keep zoneless-friendly patterns when setting up change detection.

### angular-forms
- Use the project’s chosen form model consistently per feature.
- Keep validation close to the form definition.
- Model form state explicitly instead of scattering flags.
- Prefer reactive patterns for complex validation flows.
- Treat errors and touched/dirty state as first-class UX concerns.

### angular-performance
- Use NgOptimizedImage for images when possible.
- Defer non-critical UI and lazy load heavy routes/features.
- Prefer SSR-friendly patterns for initial render performance.
- Reduce above-the-fold work before adding micro-optimizations.
- Measure loading boundaries and asset weight intentionally.

### branch-pr
- Use the issue-first workflow before opening PRs.
- Verify scripts/tests/docs expectations before PR creation.
- Keep PR scope tight and aligned with one approved issue.
- Use conventional commit/PR wording.
- Do not skip repository checks or process gates.

### django-drf
- Use serializers, viewsets, and filters with clear responsibility boundaries.
- Keep validation in serializers, not scattered across views.
- Prefer DRF conventions before custom plumbing.
- Model filtering/pagination explicitly.
- Keep API behavior testable and predictable.

### electron
- Keep main and renderer responsibilities strictly separated.
- Use IPC for cross-process communication; do not leak Node access into renderer code.
- Prefer preload bridges for safe capability exposure.
- Treat native integrations as infrastructure boundaries.
- Keep packaging/update concerns explicit in architecture.

### elixir-antipatterns
- Return tagged tuples consistently for recoverable failures.
- Keep Phoenix/web concerns out of domain logic.
- Push query complexity into clear Ecto boundaries.
- Keep GenServer/Task usage purposeful, not incidental.
- Write ExUnit coverage around behavior, not just implementation details.

### find-skills
- Search existing skills before inventing a new workflow from scratch.
- Prefer installing or reusing a skill when a domain pattern already exists.
- Use skills check/update flows to keep capabilities current.
- Treat skills as reusable operating procedures, not ad-hoc notes.
- Escalate to skill creation only when repetition and value are proven.

### github-pr
- Create PRs with clear titles and concise WHAT/WHY summaries.
- Use gh CLI as the primary GitHub interface.
- Summarize material changes, testing, and validation explicitly.
- Keep descriptions reviewer-focused, not a raw commit dump.
- Ensure branch state is ready before creating the PR.

### go-testing
- Prefer table-driven tests for behavior matrices.
- Keep tests deterministic and focused on public behavior.
- Use teatest patterns for Bubbletea TUIs when relevant.
- Add integration coverage only where unit seams are insufficient.
- Use golden files carefully and update them intentionally.

### hexagonal-architecture-layers-java
- Keep dependency direction pointing inward toward the domain.
- Separate domain, application, and infrastructure concerns cleanly.
- Use ports/adapters instead of framework leakage into core logic.
- Make boundaries explicit enough to support multiple adapters.
- Optimize for testable domain logic before framework convenience.

### homebrew-release
- Treat release automation as a checklist-driven workflow.
- Verify version, binaries, checksums, tags, and formula updates explicitly.
- Keep Homebrew tap updates synchronized with released artifacts.
- Do not publish partial releases.
- Make distribution metadata reproducible and auditable.

### issue-creation
- Search for duplicates before opening a new issue.
- Use the project’s approval/status workflow if one exists.
- Write issues with enough context to be actionable.
- Separate bug reports from feature requests clearly.
- Capture acceptance criteria or reproduction steps up front.

### java-21
- Prefer records for immutable data carriers.
- Use sealed types for closed hierarchies with explicit intent.
- Apply virtual threads for blocking I/O workloads, not blindly everywhere.
- Keep Java 21 language features readable and justified.
- Favor safe modern constructs over legacy ceremony.

### jira-epic
- Use epics only for initiatives that span multiple deliverables.
- Break big work into concrete outcomes and dependencies.
- Capture scope, risks, and success criteria explicitly.
- Keep epic descriptions structured for planning, not implementation detail.
- Make cross-team impact visible early.

### jira-task
- Keep tasks small, actionable, and independently understandable.
- Split work by dependency boundaries when needed.
- Use titles that communicate scope and type clearly.
- Capture blockers and ordering explicitly.
- Avoid stuffing unrelated work into one ticket.

### judgment-day
- Use dual independent reviews when the user explicitly requests it.
- Keep reviewers blind to each other’s findings.
- Treat the orchestrator role as coordination, not direct review.
- Re-judge after fixes when the workflow requires it.
- Use it for high-risk or high-confidence review scenarios only.

### nextjs-15
- Use App Router patterns consistently.
- Prefer server-first data fetching and Server Actions where appropriate.
- Keep route boundaries and loading states explicit.
- Avoid legacy Pages Router assumptions in new code.
- Respect streaming and caching semantics deliberately.

### playwright
- Write tests against real UI flows, not imagined behavior.
- Prefer robust selectors and page objects for maintainability.
- Keep one focused spec per user journey slice.
- Avoid flaky waits; validate actual outcomes.
- Explore the UI first so tests match reality.

### pr-review
- Review the whole change set, not just the last commit.
- Check for obvious quality regressions, dead code, and accidental files.
- Trace impacted modules and behavior before judging implementation.
- Flag missing tests, unsafe config, and reviewer friction.
- Focus on actionable findings with evidence.

### pytest
- Use fixtures intentionally to remove duplication without hiding setup.
- Prefer parametrization for behavior matrices.
- Mock only at clear boundaries.
- Keep test names descriptive and outcome-focused.
- Use markers sparingly and consistently.

### react-19
- Do not add useMemo/useCallback by default; let the compiler do its job.
- Keep components server-first unless client interactivity is required.
- Use modern React form/action patterns where applicable.
- Treat refs as regular props in updated patterns when supported.
- Remove legacy optimization cargo culting.

### react-native
- Respect platform differences explicitly when behavior diverges.
- Keep navigation, styling, and native integrations modular.
- Prefer Expo-friendly patterns unless bare workflow is required.
- Use NativeWind intentionally rather than mixing styling paradigms chaotically.
- Isolate native module assumptions behind clear boundaries.

### skill-creator
- Create a skill only for repeatable, high-value patterns.
- Prefer referencing existing documentation over duplicating it.
- Keep instructions actionable, concise, and decision-oriented.
- Focus on rules, constraints, and gotchas the agent must apply.
- Do not create skills for trivial or one-off tasks.

### spring-boot-3
- Use constructor-style dependency injection and validated config properties.
- Keep controllers thin and service/application boundaries clear.
- Prefer Spring Boot conventions before custom infrastructure.
- Make configuration explicit and testable.
- Align REST behavior and error handling consistently.

### tailwind-4
- Use Tailwind 4 patterns and project utilities consistently.
- Prefer cn() or equivalent composition helpers when available.
- Use theme variables correctly; do not misuse var() in className patterns.
- Keep utility composition readable instead of over-stacking classes.
- Treat design tokens as part of the system, not ad-hoc strings.

### technical-review
- Evaluate correctness, tests, security, and maintainability together.
- Flag over-engineering and missing fundamentals clearly.
- Look for secrets, unsafe defaults, and missing validation.
- Judge code quality with evidence, not taste alone.
- Keep review output structured and decision-oriented.

### typescript
- Prefer explicit, precise types over any.
- Model domain constraints in the type system when reasonable.
- Keep interfaces/types small and composable.
- Use generics only when they improve correctness and clarity.
- Maintain strictness rather than typing around errors.

### vercel-react-best-practices
- Start async work early and await as late as possible.
- Parallelize independent work instead of serializing by habit.
- Use Suspense/streaming boundaries intentionally.
- Avoid barrel imports and other bundle-size traps.
- Prefer dynamic loading for heavy client components.

### zod-4
- Use Zod 4 APIs consistently; do not mix v3 assumptions.
- Keep schemas close to boundaries where data enters the system.
- Validate external input before business logic consumes it.
- Reuse schemas deliberately for parsing and inference.
- Watch breaking changes when upgrading older validation code.

### zustand-5
- Keep stores small and focused by domain.
- Avoid over-centralizing all state in one store.
- Model actions explicitly instead of mutating ad hoc.
- Respect selector-based subscriptions for render performance.
- Use Zustand only where shared client state is actually needed.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-level convention files detected during init. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
