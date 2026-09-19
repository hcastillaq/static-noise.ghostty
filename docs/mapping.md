# Mapping Rationale: Static Noise to Ghostty

Static Noise publishes visual roles through DTCG tokens (`semantic`, `domains`, `primitives`, `projections.ansi`), but does not provide tool-specific settings. This document explains how those roles are adapted to Ghostty terminal options.

## Direct Mappings

These options map directly to semantic intent:

- **`background` -> `semantic.surface.canvas` (`#0F1117`)**  
  Ghostty's root terminal background corresponds to the deepest canvas in the identity.
- **`foreground` -> `semantic.content.primary` (`#E6E2D6`)**  
  Primary warm-white text optimized for sustained reading on dark surfaces.
- **`cursor-color` -> `semantic.interaction.focus` (`#72EAD5`)**  
  The electric cyan accent marks active attention and pointer focus.
- **`cursor-text` -> `semantic.interaction.onFocus` (`#0F1117`)**  
  Guarantees high contrast (12.98:1) for any character located under the cursor block.
- **`selection-background` -> `semantic.surface.selection` (`#242B3D`)**  
  A quiet surface highlighting selected text without pulling attention like the focus cursor.
- **`selection-foreground` -> `semantic.content.primary` (`#E6E2D6`)**  
  Retains clean 10.9:1 contrast across selected text blocks.

## ANSI 0–15 Projections

Terminal applications (TUIs, shells, CLI utilities) rely on the standard 16 ANSI colors. These are mapped directly from `projections.ansi`:

- Regular ANSI (0–7): surface black, error red, string green, warning yellow, function blue, keyword purple, focus cyan, primary white.
- Bright ANSI (8–15): subtle content bright-black, bright variants for status/syntax, and `#FFFFFF` for maximum white.

## Derived Mappings (Ghostty-Specific UI)

Ghostty includes terminal-specific interaction chrome that does not exist in core design systems. Rather than adding arbitrary hex values or altering upstream tokens, these are derived from existing Static Noise roles:

- **`split-divider-color` -> `semantic.outline.strong` (`#6E7588`)**  
  Terminal pane splits require structural clarity. `outline.strong` preserves visibility across panes without competing with the active cyan focus cursor.
- **`search-background` -> `primitives.accentDim.yellow` (`#443B25`)**  
  Ghostty search matches must be discoverable without being overwhelming. Dim yellow provides clear highlight boxes that maintain 8.5:1 contrast against primary text.
- **`search-foreground` -> `semantic.content.primary` (`#E6E2D6`)**  
  Keeps matching text legible without inverting the entire screen palette.
- **`search-selected-background` -> `semantic.interaction.focus` (`#72EAD5`)**  
  The currently focused search result uses the electric focus accent.
- **`search-selected-foreground` -> `semantic.interaction.onFocus` (`#0F1117`)**  
  Ensures the focused match text remains crisp and readable.

## Extended Palette Generation

Ghostty `1.3+` supports `palette-generate = true`. When set, Ghostty interpolates colors 16–255 from the 16 ANSI colors defined above. This avoids carrying hundreds of lines of static color definitions while ensuring the full 256-color cube harmonizes with Static Noise.
