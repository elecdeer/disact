# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo managed with pnpm workspaces and Turbo that implements a Discord bot framework with JSX-like syntax for markdown rendering.

### Key Packages

- `packages/disact`: Core library providing JSX runtime and markdown transformation
- `packages/disact-engine`: Rendering engine for Discord elements
- `packages/example/basic`: Example usage
- `packages/tsconfig`: Shared TypeScript configurations

## Common Commands

### Building

```bash
pnpm run build          # Build all packages using Turbo
```

### Linting

```bash
pnpm run lint           # Lint all packages using oxlint

# Lint a specific file
pnpm run lint packages/disact/src/components/elements/schemaUtils.ts
```

### Running Tests

```bash
# Tests use vitest - run from individual package directories
pnpm run test --project disact
pnpm run test --project disact-engine

# Run a specific test file from the root directory
pnpm run test packages/disact/src/components/core/TextDisplay/textDisplaySchema.test.ts
```

## Code Architecture

### Core Concepts

1. **JSX Runtime**: Custom JSX implementation that transforms Discord-specific elements into markdown
   - JSX elements are processed through `packages/disact/src/jsx/renderer.ts`
   - Supports Discord-specific components like user mentions, channels, emojis

2. **Markdown Transformation**:
   - Elements are converted to mdast (Markdown AST) via `packages/disact/src/jsx/markdown/markdown.ts`
   - mdast is then serialized to Discord-compatible markdown
   - Supports Discord formatting: bold, italic, strikethrough, code blocks, etc.

3. **Rendering Engine**:
   - `packages/disact-engine/src/render.ts` handles component resolution and context management
   - Supports async components and context providers
   - Fragment elements for grouping without wrapper elements

### Key Files

- `packages/disact/src/jsx/renderer.ts`: Main rendering logic
- `packages/disact/src/jsx/markdown/markdown.ts`: Markdown transformation pipeline
- `packages/disact-engine/src/render.ts`: Core rendering engine
- `packages/disact/src/jsx/jsx-internal.ts`: JSX type definitions and utilities

### Testing

- Tests are located alongside source files (`.test.ts`, `.test.tsx`)
- Uses vitest for testing framework
- Test files cover both unit tests and integration scenarios

## Development Notes

- Uses oxlint for linting
- Uses oxfmt for code formatting
- TypeScript strict mode enabled
- ESM modules with dual CJS/ESM exports
- Supports both import and require for compatibility

### Referencing discord-api-types Type Definitions

When you need to reference discord-api-types type definitions:

1. **Find the package path**:

```bash
npm list -r --depth 0 --parseable discord-api-types
```

2. **Check the `.d.ts` files** in the returned path to understand the actual type structures
