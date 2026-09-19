# Static Noise for Ghostty

Static Noise adapter for the [Ghostty](https://ghostty.org) terminal emulator.

This project consumes a pinned release of [Static Noise](https://github.com/hcastillaq/static-noise) and translates its semantic color tokens into an installable Ghostty theme.

## Requirements

- Ghostty `1.3.0` or newer (supports `palette-generate = true` and extended palette derivations).
- macOS, Linux, or any platform running Ghostty.

## Quick Install

### One-line curl install (Latest release)

Download the latest official release asset directly into your Ghostty themes folder:

```bash
mkdir -p ~/.config/ghostty/themes
curl -fsSL -o ~/.config/ghostty/themes/"Static Noise" \
  https://github.com/hcastillaq/static-noise.ghostty/releases/latest/download/Static%20Noise
```

### Apply in Ghostty

Open your Ghostty configuration (`~/.config/ghostty/config`) and add:

```ini
theme = Static Noise
```

Reload Ghostty (`Cmd+Shift+,` on macOS or restart the terminal).

## Visual Identity Mapping

Static Noise avoids pure blacks and balances deep surfaces with an electric focus cursor and readable syntax accents.

| Ghostty configuration key | Static Noise token | Purpose |
|---|---|---|
| `background` | `semantic.surface.canvas` | Root dark canvas (`#0F1117`) |
| `foreground` | `semantic.content.primary` | Primary high-readability text (`#E6E2D6`) |
| `cursor-color` | `semantic.interaction.focus` | Electric cyan focus cursor (`#72EAD5`) |
| `cursor-text` | `semantic.interaction.onFocus` | Text under active cursor (`#0F1117`) |
| `selection-background` | `semantic.surface.selection` | Neutral non-focus selection (`#242B3D`) |
| `selection-foreground` | `semantic.content.primary` | High-contrast selected text (`#E6E2D6`) |
| `split-divider-color` | `semantic.outline.strong` | Visible structural boundary (`#6E7588`) |
| `search-background` | `primitives.accentDim.yellow` | Muted warning surface for passive search |
| `search-foreground` | `semantic.content.primary` | Content on search matches |
| `search-selected-background` | `semantic.interaction.focus` | Active focused search match |
| `search-selected-foreground` | `semantic.interaction.onFocus` | Text on active search match |
| `palette` (0–15) | `projections.ansi.*` | Base 16 ANSI palette |
| `palette-generate` | `true` | Ghostty auto-derives 16–255 from ANSI colors |

Detailed mapping decisions are documented in [`docs/mapping.md`](docs/mapping.md).

## Development

Build the theme into `dist/Static Noise`:

```bash
npm run generate
```

Run the unit test suite:

```bash
npm test
```

Validate syntax with Ghostty (optional, if `ghostty` is installed locally):

```bash
npm run validate:ghostty
```

## Updating Static Noise

The source of truth for upstream palette releases is `static-noise.lock.json`. Updates are strictly manual; no command will rewrite your lock. See [`docs/updating.md`](docs/updating.md) for the maintainer workflow.

## License

MIT © Hernan Castilla
