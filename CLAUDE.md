# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo managed with pnpm workspaces and Turbo that implements a Discord bot framework using JSX syntax for building Discord message components (buttons, selects, containers, etc.) with React-like state management.

### Key Packages

- `packages/disact`: Core library — JSX runtime, Discord components, hooks, app management. Published as ESM.
- `packages/disact-engine`: Internal rendering engine — renders `DisactElement` trees to `RenderedElement` trees asynchronously via `ReadableStream`.
- `packages/example/basic`: Example usage
- `packages/tsconfig`: Shared TypeScript configurations

## Common Commands

### Building

```bash
pnpm run build          # Build all packages using Turbo (respects dependency order)
```

### Linting & Formatting

```bash
pnpm run lint           # oxlint with type-aware checking
pnpm run lint:fix       # Auto-fix lint errors
pnpm run format         # Check formatting with oxfmt
pnpm run format:fix     # Auto-fix formatting
```

### Running Tests

```bash
pnpm run test                      # Run all tests
pnpm run test --project disact     # Run disact package tests only
pnpm run test --project disact-engine  # Run disact-engine tests only

# Run a specific test file from the root directory
pnpm run test packages/disact/src/components/core/TextDisplay/textDisplaySchema.test.ts
```

## Code Architecture

### Data Flow

```
JSX code (user writes <Button>, <Container>, etc.)
  ↓
jsx() / jsxDEV() factory (packages/disact/src/jsx.ts)
  ↓
DisactElement tree (type: "function" | "intrinsic" | "suspense" | "errorBoundary")
  ↓
renderToReadableStream() in packages/disact-engine/src/render.ts
  ↓
RenderedElement tree (type: "intrinsic" | "text")
  ↓
toMessageComponentsPayload() → Discord API payload
  ↓
Session.commit()
```

### Core Concepts

1. **JSX Runtime** (`packages/disact/src/jsx.ts`, `jsx-runtime.ts`, `jsx-dev-runtime.ts`):
   - Custom JSX factory that creates `DisactElement` objects (not React elements)
   - The `type` field distinguishes function components from intrinsic (built-in) elements
   - `jsxImportSource: "disact"` in tsconfig routes JSX to this runtime

2. **Rendering Engine** (`packages/disact-engine/src/render.ts`):
   - `renderToReadableStream()` returns a `ReadableStream<RenderResult>` for async rendering
   - Scheduler (`scheduler.ts`) manages task execution with a 100ms idle timeout
   - Context is managed via a global `currentRenderingContext` variable — hooks read from it
   - Re-renders are requested via `requestRerender()` with a 100-cycle safety limit
   - Supports Suspense and ErrorBoundary elements

3. **Hook System** (`packages/disact/src/hooks/`):
   - `useInteraction(callback)`: Register a callback for when interactions complete
   - `useRerender()`: Get a function to trigger re-renders
   - `useEmbedState<T, R>(initial, reducers)`: Embed state into component `customId` fields
   - State survives across interactions by encoding into `customId` format: `"disact:<action>:<instanceId>:<serializedState>"`

4. **DisactApp** (`packages/disact/src/app/`):
   - Entry point for lifecycle management
   - `Session` interface: `{ commit, getCurrent, getInteraction }`
   - Lifecycle callbacks: `preRender`, `postRender`, `postRenderCycle`
   - Diff detection (`app/diff.ts`) skips `commit()` when output hasn't changed

5. **Discord Components** (`packages/disact/src/components/core/`):
   - Each component has: `ComponentName.tsx` + `componentNameSchema.ts` (Zod validation) + `.test.ts`
   - Available: ActionRow, Button, ChannelSelect, Components, Container, File, MediaGallery, MentionableSelect, RoleSelect, Section, Separator, StringSelect, TextDisplay, Thumbnail, UserSelect

### Key Types

```typescript
// Element types created by JSX factory
type DisactElement =
  | FunctionComponentElement // { type: "function", fc, props }
  | IntrinsicElement // { type: "intrinsic", name, props, children }
  | SuspenseElement
  | ErrorBoundaryElement;

// Nodes accepted as JSX children
type DisactNode = DisactElement | string | number | boolean | null | undefined | DisactNode[];

// Output of the rendering engine
type RenderedElement =
  | {
      type: "intrinsic";
      name: IntrinsicElementName;
      props: PropsBase;
      children: RenderedElement[] | null;
    }
  | { type: "text"; content: string };
```

### Context System

- Context is a global variable; components running in parallel cannot share context
- `runInContext(context, fn)` — wraps execution; cannot be nested
- `getCurrentContext<T>()` — called inside components/hooks to access the current context
- Special context fields: `__requestRerender`, `__interactionCallbacks`, `__embedStateComputedStates`

### Testing Patterns

- Test files live alongside source files (`.test.ts`, `.test.tsx`)
- vitest with `typecheck: { enabled: true }` — type errors are caught as test failures
- `disact-engine` tests use a setup file at `packages/disact-engine/src/__tests__/setup.ts`

### Logging

Uses `@logtape/logtape`. Each module creates a logger via:

```typescript
import { getDisactLogger } from "./utils/logger";
const logger = getDisactLogger("moduleName");
```

## Development Notes

- Uses `tsdown` for building individual packages
- Uses oxlint for linting, oxfmt for formatting
- TypeScript strict mode enabled
- ESM modules; `packages/disact` has dual CJS/ESM exports for compatibility
- `packages/disact-engine` uses `jsx: "react-jsxdev"` with `jsxImportSource: "."` (self-referential)

### Referencing discord-api-types Type Definitions

When you need to reference discord-api-types type definitions:

1. **Find the package path**:

```bash
npm list -r --depth 0 --parseable discord-api-types
```

2. **Check the `.d.ts` files** in the returned path to understand the actual type structures
