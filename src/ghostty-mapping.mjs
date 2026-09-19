export const ghosttyCoreMapping = {
  background: {
    tokenPath: 'semantic.surface.canvas',
    kind: 'direct',
    description: 'Lienzo raíz oscuro de Static Noise.'
  },
  foreground: {
    tokenPath: 'semantic.content.primary',
    kind: 'direct',
    description: 'Texto principal y lectura prioritaria.'
  },
  'cursor-color': {
    tokenPath: 'semantic.interaction.focus',
    kind: 'direct',
    description: 'Color de foco activo y cursor.'
  },
  'cursor-text': {
    tokenPath: 'semantic.interaction.onFocus',
    kind: 'direct',
    description: 'Texto dibujado sobre la superficie de foco.'
  },
  'selection-background': {
    tokenPath: 'semantic.surface.selection',
    kind: 'direct',
    description: 'Superficie neutral de selección sin foco.'
  },
  'selection-foreground': {
    tokenPath: 'semantic.content.primary',
    kind: 'direct',
    description: 'Contenido principal legible dentro de la selección.'
  }
};

export const ghosttyDerivedMapping = {
  'split-divider-color': {
    tokenPath: 'semantic.outline.strong',
    kind: 'derived',
    description: 'Divisor estructural visible que no compite con el cursor de foco.'
  },
  'search-background': {
    tokenPath: 'primitives.accentDim.yellow',
    kind: 'derived',
    description: 'Fondo tenue de atención para coincidencias pasivas de búsqueda.'
  },
  'search-foreground': {
    tokenPath: 'semantic.content.primary',
    kind: 'derived',
    description: 'Texto principal sobre fondo de búsqueda tenue.'
  },
  'search-selected-background': {
    tokenPath: 'semantic.interaction.focus',
    kind: 'derived',
    description: 'Coincidencia activa enfocada con el acento de atención de Static Noise.'
  },
  'search-selected-foreground': {
    tokenPath: 'semantic.interaction.onFocus',
    kind: 'derived',
    description: 'Texto contrastado sobre la coincidencia activa enfocada.'
  }
};

export const ghosttyAnsiIndices = [
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
