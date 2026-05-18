# CLAUDE.md — Unified Workflow Orchestration + LLM Wiki Knowledge System

---

# PART 1: WORKFLOW ORCHESTRATION

## 1. Plan Node Default

* Enter Plan Node mode for ANY non-trivial task (3+ steps or architectural decisions)
* If something goes sideways, STOP and re-plan immediately – don’t keep pushing
* Use plan mode for verification steps, not just building
* Write detailed specs upfront to reduce ambiguity

## 2. Subagent Strategy

* Use subagents liberally to keep main context window clean
* Offload research, exploration, and parallel analysis to subagents
* For complex problems, throw more compute at it via subagents
* One task per subagent for focused execution

## 3. Self-Improvement Loop

* After ANY correction from the user: update `tasks/lessons.md` with the pattern
* Write rules for yourself that prevent the same mistake
* Ruthlessly iterate on these lessons until mistake rate drops
* Review lessons at session start for relevant project

## 4. Verification Before Done

* Never mark a task complete without proving it works
* Diff behavior between main and your changes when relevant
* Ask yourself: "Would a staff engineer approve this?"
* Run tests, check logs, demonstrate correctness

## 5. Demand Elegance (Balanced)

* For non-trivial changes: pause and ask

  * "is there a more elegant way?"
  * "Knowing everything I know now, implement the elegant solution"
* Skip this for simple / obvious fixes – don’t over-engineer
* Challenge your own work before presenting it

## 6. Autonomous Bug Fixing

* When given a bug report: just fix it. Don’t ask for hand-holding
* Point to logs, errors, failing tests – then resolve them
* Zero context switching required from the user
* Go fix failing CI tests without being told how

---

# PART 2: TASK MANAGEMENT

1. Plan First: Write plan to `tasks/todo.md` with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review section to `tasks/todo.md`
6. Capture Lessons: Update `tasks/lessons.md` after corrections

---

# PART 3: CORE PRINCIPLES

* Simplicity First: Make every change as simple as possible. Minimal code impact
* No Laziness: Find root causes. No temporary fixes. Senior developer standards
* Minimal Impact: Changes should only touch what’s necessary. Avoid introducing bugs

---

# PART 4: LLM WIKI KNOWLEDGE SYSTEM

## 4.1 Purpose

Maintain a persistent, structured knowledge base (wiki) derived from raw inputs. This system replaces ad-hoc context retrieval with a continuously evolving knowledge layer.

---

## 4.2 Core Principles

### Source of Truth

* `raw/` is immutable and contains original inputs
* `wiki/` is structured, derived knowledge
* Never modify content inside `raw/`

### Incremental Updates

* Always update existing wiki pages first
* Avoid duplication
* Preserve historical information

### Structured Knowledge

* Prefer structured markdown
* Maintain consistent schemas per domain
* Use linking to connect entities

### Deterministic Behavior

* Consistent naming, formatting, and structure
* Avoid randomness in outputs

---

## 4.3 Directory Structure

```
knowledge/
  raw/
  wiki/
```

Optional Scoped CLAUDE.md files may exist at subfolder levels.

---

## 4.4 Wiki Page Standard

Each page must follow:

```
# Title

## Summary

## Details

## Relationships

## History

## Metadata
- created_at:
- updated_at:
- sources:
- confidence:
```

---

## 4.5 Linking Rules

* Use `[[entity_name]]` for internal linking
* Maintain bidirectional relationships where possible
* Avoid broken or ambiguous links

---

## 4.6 Operations

### Ingestion

When new data appears in `raw/`:

1. Read and interpret content
2. Extract entities and relationships
3. Update or create wiki pages
4. Attach source references
5. Maintain schema consistency

### Update

* Merge new data into existing entries
* Append changes to History
* Never overwrite valuable context blindly

### Query

* Answer strictly using `wiki/`
* If missing information, explicitly state gaps
* Do not hallucinate

### Cleanup

* Merge duplicates
* Normalize naming
* Remove inconsistencies

---

## 4.7 Consistency Rules

* One entity → one canonical page
* Normalize synonyms
* Maintain section ordering

---

## 4.8 Metadata Standards

Each page must include:

* created_at (ISO format)
* updated_at (ISO format)
* sources (raw references)
* confidence (low / medium / high)

---

## 4.9 Conflict Handling

* Preserve conflicting data
* Document discrepancies
* Avoid arbitrary resolution

---

## 4.10 Staleness Management

* Mark outdated data clearly
* Prefer latest verified information
* Retain historical records

---

## 4.11 Constraints

* Do not hallucinate missing data
* Do not modify raw inputs
* Do not delete historical context

---

## 4.12 Multi-CLAUDE.md Hierarchy

* Root CLAUDE.md defines global rules
* Subfolder CLAUDE.md files define scoped rules
* Deeper files override higher-level instructions
* Avoid conflicting rules across layers

---

## 4.13 System Goal

Continuously evolve a reliable, structured, and self-improving knowledge base that serves as the single source of truth for all reasoning, decision-making, and downstream agent workflows.

---

# PART 5: DESIGN SYSTEM & FIGMA MCP INTEGRATION RULES

These rules govern every Figma-driven change in this repo. The Figma MCP server returns React + Tailwind reference code — treat it as a **representation of design intent, not final code style**. Always adapt to this project's stack, tokens, and primitives.

## 5.1 Stack Reference (do not guess)

* **Framework:** Next.js 15 App Router, React 19, Server/Client Components
* **Styling:** **Tailwind CSS v4** — uses `@import "tailwindcss"` + `@theme inline` block in `app/globals.css`. There is NO `tailwind.config.js`. Theme tokens are CSS variables, exposed as utilities through `@theme inline`.
* **Component library:** ShadCN-style primitives in `components/ui/` (Radix + CVA)
* **State:** Zustand v5 (`lib/mock-store.ts`) — every mutation appends an audit entry via `appendAudit`
* **Icons:** `lucide-react` ONLY. Do not introduce another icon library.
* **Utilities:** `cn()` from `lib/utils.ts` (twMerge + clsx); `formatCurrencyINR()` for money; `formatRelativeDays()` for dates
* **Path alias:** `@/*` → repo root. Never use `../../..` chains.
* **Package manager:** pnpm 10.7.1 with `onlyBuiltDependencies: ["sharp"]`

## 5.2 Directory Conventions

| Kind | Location |
|------|----------|
| App Router pages | `app/<route>/page.tsx` |
| App frame (sidebar, topbar) | `components/shell/` |
| Reusable UI primitives (Button, Card, Dialog…) | `components/ui/` |
| Feature-scoped components | `components/<feature>/` (`dashboard`, `detail`, `exceptions`, `worklist`) |
| Domain types | `lib/types.ts` |
| Mock fixtures | `data/<entity>.ts` |
| Pure selectors / derivations | `lib/selectors.ts` |
| State + mutations | `lib/mock-store.ts` |
| Queue identity (color/icon/copy/action) | `lib/queue-config.ts` |
| Global tokens + utilities | `app/globals.css` |

**Rules:**
- IMPORTANT: **Feature components go in `components/<feature>/`, not `components/ui/`.** `components/ui/` is reserved for stack-neutral primitives only.
- New Radix-based primitives belong in `components/ui/` with file name kebab-case matching the primitive (`dialog.tsx`, `popover.tsx`).
- Naming: files are kebab-case (`apl-evidence.tsx`), exported React symbols are PascalCase.

## 5.3 Design Tokens — Single Source of Truth

**All tokens live in `app/globals.css`.** Never hardcode colors or spacing values anywhere else.

### Semantic color tokens (shadcn convention)

`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`

Exposed as utilities via `@theme inline`: `bg-primary`, `text-muted-foreground`, `border-border`, etc.

### Queue identity tokens (domain-specific)

`--green-queue`, `--green-queue-soft`, `--amber-queue`, `--amber-queue-soft`, `--red-queue`, `--red-queue-soft`, `--blue-queue`, `--blue-queue-soft`

- IMPORTANT: **Never use queue classes inline.** Always import `QUEUES` from `lib/queue-config.ts` and read `textClass`, `bgSoftClass`, `borderClass`, `stripeClass`, `ringClass`, `icon`. This is the ONE PLACE queue identity is defined — diverging breaks the four-queue mental model end-to-end.
- Queue order for UI display is `QUEUE_ORDER` from the same file (`["amber", "red", "green", "blue"]`).

### Radius

`--radius: 0.625rem` → Tailwind classes `rounded-sm/md/lg/xl` bind to it automatically. Don't override `rounded-[5px]` style.

### Typography

* **Sans (body):** Inter — `var(--font-inter)` — loaded via `next/font/google` in `app/layout.tsx`
* **Serif display:** Fraunces — `var(--font-fraunces)` — access via utility class `font-display` (already defined in `globals.css`). Use for hero numerics, marquee metrics.
* **Numeric tabular:** utility class `numeric-tabular` — use for any table column containing aligned numbers (counts, currency, percentages).
* Do not import additional fonts.

### Dark mode

`.dark` class toggles a second set of tokens in `globals.css`. Dark-mode tokens are pre-defined — do not add dark variants inline (`dark:bg-foo`) for semantic tokens; they already flip.

## 5.4 Component Patterns

### ShadCN primitives

All primitives in `components/ui/` follow the pattern:
```ts
const thingVariants = cva("base-classes", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: "default", size: "default" }
});
```
With `React.forwardRef`, `className` merged via `cn()`, and `asChild` (where Radix supports it).

- New primitives: copy an existing one (`button.tsx`) as the skeleton. Do not re-implement CVA patterns from scratch.
- Every primitive accepts `className` and forwards it through `cn()`.

### Feature components

- Pure-ish functional components, destructured props, TypeScript interface for props.
- Data comes from `useMockStore` (zustand selector) or props. **Never read mock fixtures directly inside a feature component** — read derived state via selectors.
- Mutations call store actions only — do not build parallel state.

### Icon usage

Always `import { IconName } from "lucide-react"`. Size via `[&_svg]:size-4` (already baked into Button) or explicit `size={16}` on the component. Do not use `className="w-4 h-4"` inline if the parent primitive already sizes SVGs.

## 5.5 Figma MCP → Code Flow (required, no skips)

1. **Parse the URL.** `figma.com/design/:fileKey/:name?node-id=1-2` → `fileKey=":fileKey"`, `nodeId="1:2"` (dash → colon).
2. **Call `get_design_context`** first for the exact node. It returns React + Tailwind + a screenshot + hints.
3. **If the payload is too large / truncated,** call `get_metadata` to get the node map, then re-fetch specific children with `get_design_context`.
4. **Call `get_screenshot`** separately for a visual reference.
5. **Adapt — do not paste.** The reference code is R+T; our project is R+Tv4+CVA+shadcn. Rewrite using:
   - ShadCN primitives from `components/ui/` instead of raw `<button>`/`<div>` with utility stacks.
   - Semantic tokens (`bg-card`, `text-muted-foreground`) instead of literal hex or `bg-white`/`text-gray-500`.
   - Queue tokens via `QUEUES[…]` instead of hardcoded `text-emerald-500`, etc.
   - Lucide icons instead of inline SVG where equivalents exist.
   - `formatCurrencyINR()` for any money value (the PRD is Indian and numbers look like ₹1,045).
6. **Validate 1:1** against the Figma screenshot for visual parity AND behavior before marking complete.

## 5.6 Mapping Figma Primitives to This Repo

| If Figma shows… | Use from this repo |
|-----------------|-------------------|
| Button (any variant) | `@/components/ui/button` with `variant` prop |
| Modal / dialog / drawer | `@/components/ui/dialog` |
| Dropdown menu | `@/components/ui/dropdown-menu` |
| Popover / floating panel | `@/components/ui/popover` |
| Tabs | `@/components/ui/tabs` |
| Select | `@/components/ui/select` |
| Card / panel | `@/components/ui/card` |
| Status pill / chip | If queue-related → use `QueueChip` / `ExceptionStatusPill`. If generic → `@/components/ui/badge`. |
| Table with sticky header | Reuse patterns in `components/worklist/` — look at the existing table before rolling your own. |
| Sidebar nav | Already exists as `AppSidebar` in `components/shell/`. Extend it, don't rebuild it. |
| Top bar | Already exists as `TopBar` in `components/shell/`. Extend it, don't rebuild it. |

If a Figma component has no clear match, create a new feature component in the right `components/<feature>/` folder rather than adding one-off markup in a page file.

## 5.7 Asset Handling

- IMPORTANT: If the Figma MCP server returns a **localhost** source for an image/SVG, use it directly. Do not re-host.
- IMPORTANT: **Do not install new icon packages.** All iconography is `lucide-react`. If Figma uses a custom icon, convert it to an inline SVG component in `components/ui/icons/<name>.tsx`.
- Static images belong in `public/` (served as `/filename.png`). Optimized assets via `next/image`.
- Do not use placeholder URLs when the MCP server provides the real source.

## 5.8 Copyright / Product Rules (specific to CMP Autobot)

- **Currency:** Always INR, formatted via `formatCurrencyINR()` — never USD or `$`.
- **Dates:** IST timezone (`+05:30`). Use `formatRelativeDays()` for "Nd ago" style or `date-fns` for precise formats.
- **Queue copy:** the literal labels are defined in `lib/queue-config.ts` (`"Green — Perfect Match"`, `"Amber — Confirmation Required"`, `"Red — Investigation Required"`, `"Blue — Transition Watch"`). Do not paraphrase.
- **PRD vocabulary (non-negotiable):** MOG, APL, MAM, ODS, SAP, CookBook, Original vs Incremental scope, 1:many MOG→APL with "default = lowest-cost active APL at site". If a Figma label contradicts the PRD, flag it rather than silently changing code.

## 5.9 Accessibility & Quality Defaults

- Every interactive Radix primitive already ships keyboard + ARIA support — do not wrap it in non-semantic `<div onClick>`.
- Focus ring uses `--ring` — preserve `focus-visible:ring-2 focus-visible:ring-ring` patterns shipped by primitives.
- Color contrast: queue tokens are calibrated calm-not-vivid; don't up-saturate them.
- `numeric-tabular` for any table column holding numbers.

## 5.10 Pre-implementation Checklist (apply before writing code from a Figma design)

1. `pnpm typecheck` is green on the branch you're starting from.
2. Confirmed the node ID + file key resolve in `get_design_context` and `get_screenshot`.
3. Identified which `components/<feature>/` the design belongs to — or created it.
4. Checked `components/ui/` for an existing primitive before authoring a new one.
5. If the design introduces a new semantic (e.g., a new status color), added the token to `app/globals.css` and (if domain) a config in `lib/queue-config.ts`-adjacent file. Did NOT inline the color.
6. `pnpm dev` on :3001 to verify at runtime, not just at typecheck.

## 5.11 Out of Scope (defer / discuss)

- Do not introduce a new CSS framework (e.g., styled-components, emotion) — stick with Tailwind v4.
- Do not swap Zustand for another state lib.
- Do not port components from v3-style `tailwind.config.js` — we are v4 native.
- Do not add storybook/testing-library in this prototype without explicit ask.
