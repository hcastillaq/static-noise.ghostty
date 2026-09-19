/**
 * Direct semantic-to-Ghostty mapping.
 * Each entry references an unambiguous semantic intention in Static Noise.
 */
export const ghosttyCoreMapping = {
  background: {
    tokenPath: 'semantic.surface.canvas',
    description: 'Root dark canvas for terminal background.'
  },
  foreground: {
    tokenPath: 'semantic.content.primary',
    description: 'Primary text for regular high-contrast reading.'
  },
  'cursor-color': {
    tokenPath: 'semantic.interaction.focus',
    description: 'Active attention focus accent for cursor block.'
  },
  'cursor-text': {
    tokenPath: 'semantic.interaction.onFocus',
    description: 'Text rendered underneath active cursor.'
  },
  'selection-background': {
    tokenPath: 'semantic.surface.selection',
    description: 'Non-focus surface highlighting selected text.'
  },
  'selection-foreground': {
    tokenPath: 'semantic.content.primary',
    description: 'Readable text within selected regions.'
  }
};

/**
 * Derived local mappings for Ghostty chrome features not covered directly by Static Noise.
 * Kept strictly mapped to existing semantic or primitive tokens without arbitrary hex values.
 */
export const ghosttyDerivedMapping = {
  'split-divider-color': {
    tokenPath: 'semantic.outline.strong',
    description: 'Structural boundary for pane splits without competing with cursor focus.'
  },
  'search-background': {
    tokenPath: 'primitives.accentDim.yellow',
    description: 'Dimmed attention background for passive search matches.'
  },
  'search-foreground': {
    tokenPath: 'semantic.content.primary',
    description: 'Readable primary text over passive search background.'
  },
  'search-selected-background': {
    tokenPath: 'semantic.interaction.focus',
    description: 'Cyan attention accent on active focused search match.'
  },
  'search-selected-foreground': {
    tokenPath: 'semantic.interaction.onFocus',
    description: 'Text drawn on active focused search match.'
  }
};

/**
 * Canonical 16-color ANSI projection slot names in index order (0 to 15).
 */
export const GHOSTTY_ANSI_NAMES = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite'
];
