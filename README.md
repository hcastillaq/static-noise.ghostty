# Static Noise for Ghostty

Static Noise adapter for the [Ghostty](https://ghostty.org) terminal emulator.

This project consumes a pinned release of [Static Noise](https://github.com/hcastillaq/static-noise) and translates its semantic color tokens into a ready-to-use Ghostty configuration.

## Requirements

- Ghostty `1.3.0` or newer (supports `palette-generate = true` and extended palette derivations).
- macOS, Linux, or any environment running Ghostty.

## Quick Install

1. Copy the generated theme file into your Ghostty themes folder:

```bash
mkdir -p ~/.config/ghostty/themes
cp "dist/Static Noise" ~/.config/ghostty/themes/
```

2. Open your Ghostty configuration (`~/.config/ghostty/config`) and add:

```ini
theme = Static Noise
```

3. Reload Ghostty (`Cmd+Shift+,` on macOS or restart the application).

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

## Development and Verification

Run the full offline verification suite:

```bash
npm test
```

Check that the committed theme matches the current snapshot:

```bash
npm run check:generated
```

Validate syntax against Ghostty's official validator:

```bash
npm run validate:ghostty
```

Run all project checks together:

```bash
npm run check
```

## Updating Static Noise

The source of truth for upstream palette releases is `static-noise.lock.json`. Updates are strictly manual; no command will rewrite your lock. See [`docs/updating.md`](docs/updating.md) for the maintainer workflow.

## License

MIT © Hernan Castilla
