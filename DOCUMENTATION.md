# PromptMachine — Documentation

## Overview
PromptMachine is a Vite + React + TypeScript front-end prototype for a "Prompt Machine" UI designed to interact with a VEO/GenAI model (video or multimodal generation). The project includes a small set of UI components, a service layer for API interactions, and shared TypeScript types.

This document details the project structure, setup, how to run locally, and recommended improvements.

---

## Repository structure (top-level)
- .gitignore
- App.tsx — main application component
- index.html, index.tsx — app entry points
- index.css — base styles (currently empty)
- components/ — UI components (ApiKeyDialog, LoadingIndicator, PromptForm, VideoResult, ActivityLog)
- services/ — API client(s) and wrappers for GenAI/VEO endpoints
- types.ts — shared TypeScript types/interfaces
- vite.config.ts — Vite configuration and path aliases
- package.json — dependencies and scripts
- tsconfig.json — TypeScript configuration
- README.md — short usage instructions (expandable)
- metadata.json — repository metadata

---

## Local setup

1. Clone the repo:
   git clone https://github.com/thebearwithabite/PromptMachine.git
   cd PromptMachine

2. Install dependencies:
   npm install
   (or `pnpm install` / `yarn install` depending on your package manager preference and the repo setup)

3. Environment variables:
   - This project uses environment variables for API keys / secrets. Vite apps typically expect env variables prefixed with `VITE_`.
   - Example (create a `.env.local` or `.env` file in the project root):
     VITE_GENAI_API_KEY=your_api_key_here
   - Check the ApiKeyDialog component or the service client implementation for the exact env variable name used by the app.

4. Run locally:
   npm run dev
   (This runs the Vite dev server; see package.json scripts for exact names.)

5. Build:
   npm run build

6. Preview production build:
   npm run preview

---

## Components & responsibilities
- App.tsx
  - Coordinates app state (current prompt, loading state, results), displays the main UI and wire-ups.
- ApiKeyDialog
  - UI for entering and storing the API key (likely stores into local storage or sets a runtime env-like value).
- PromptForm
  - Accepts user prompts and parameters for generation.
- LoadingIndicator
  - Shows progress while requests are in-flight.
- VideoResult
  - Displays the generated video or multimodal output.
- ActivityLog
  - Shows recent prompts, responses, and operation metadata (timestamps, status, durations).

---

## Services
- services/
  - Contains the client logic that calls the GenAI / VEO APIs. This folder should handle:
    - Constructing requests
    - Streaming or chunked response handling (if applicable)
    - Error handling and retries
    - Authentication header injection using the API key

---

## Types
- types.ts defines common interfaces such as PromptRequest, GenerationResult, VideoMetadata, and other domain types so components and services share the same contracts.

---

## Notes & assumptions
- The project likely depends on `@google/genai` and other libraries (commit message referenced this).
- Vite-specific env variables should use the `VITE_` prefix to be visible at runtime in client code.
- index.css is present but empty — you can add base styles there or integrate a CSS framework.

---

## Suggested improvements
1. README expansion
   - Add explicit install & run commands, environment variable names, example prompt screenshots, and example responses.
2. .env.example
   - Provide a template `.env.example` with the exact VITE_* env var names required.
3. License
   - Add a LICENSE file to clarify usage and sharing.
4. CI / Tests
   - Add GitHub Actions for linting, type checking, and unit tests.
5. TypeScript strictness
   - If not already enabled, consider enabling `strict: true` in tsconfig and addressing any errors.
6. Error handling & UX
   - Improve progress UI for long-running video generation jobs, provide cancellation mechanisms.
7. Documentation of API shapes
   - Document the GenAI request and response shapes, expected fields and error codes.
8. Accessibility
   - Ensure components are accessible (aria labels and keyboard navigation).
9. Add end-to-end example
   - A small end-to-end example demonstrating a successful prompt, request flow, and the resulting video or artifact.

---

## Where to look in code
- App.tsx — app wiring and flows
- components/* — UI pieces for each interaction
- services/* — API calls
- types.ts — shared type definitions
- vite.config.ts — aliases and env handling
- package.json — scripts and dependencies

---

## Next steps (recommended immediate tasks)
- Add `.env.example` with the exact client-side env var names (VITE_ prefix keys).
- Expand README with step-by-step local run instructions and screenshots.
- Add a LICENSE file.
- Add simple unit tests for critical utility functions and snapshot tests for key components.

If you’d like, I can:
- Generate the `.env.example`, expanded README, or a LICENSE file for you.
- Create the DOCUMENTATION.md as a PR draft with the content above.
