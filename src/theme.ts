import { createTheme, MantineColorsTuple, rem } from '@mantine/core'

// ─── Color Palettes ───────────────────────────────────────────────────────────

const teal: MantineColorsTuple = [
  '#e0faf8',
  '#b3f2ec',
  '#7fe8de',
  '#4dddd0',
  '#2acfc2',
  '#1ab8ac',
  '#13a89c',
  '#0d948a',
  '#077f76',
  '#026b63',
]

const blue: MantineColorsTuple = [
  '#e8f4ff',
  '#c5e2ff',
  '#9bcbff',
  '#6db3ff',
  '#479eff',
  '#2e8ef7',
  '#1a7fe8',
  '#0f6ed0',
  '#085db6',
  '#024d99',
]

const coral: MantineColorsTuple = [
  '#fff0ec',
  '#ffd8cc',
  '#ffb8a0',
  '#ff9478',
  '#ff7458',
  '#f06048',
  '#de5038',
  '#c44030',
  '#a83028',
  '#8e2020',
]

const amber: MantineColorsTuple = [
  '#fff8e1',
  '#ffedbb',
  '#ffe08f',
  '#ffd163',
  '#ffc040',
  '#f0a429',
  '#dc8c1a',
  '#c4740e',
  '#a85e06',
  '#8e4a00',
]

const green: MantineColorsTuple = [
  '#e6faf0',
  '#bff2d8',
  '#8de8bc',
  '#57dd9e',
  '#2ed385',
  '#1abc72',
  '#12a862',
  '#0a9454',
  '#047e46',
  '#006838',
]

const purple: MantineColorsTuple = [
  '#f3f0ff',
  '#e5deff',
  '#ccbfff',
  '#b09aff',
  '#9478f8',
  '#7c5feb',
  '#6e52d8',
  '#5f44c2',
  '#5038aa',
  '#422c92',
]

const pink: MantineColorsTuple = [
  '#ffe8f4',
  '#ffc8e4',
  '#ffa0ce',
  '#ff78b8',
  '#ff58a8',
  '#f04494',
  '#dc3482',
  '#c42470',
  '#aa1460',
  '#920450',
]

const navy: MantineColorsTuple = [
  '#e8eef8',
  '#c8d6ee',
  '#a0b8e0',
  '#7498d0',
  '#4e7cbf',
  '#3264ac',
  '#245298',
  '#183f82',
  '#0e2e6c',
  '#071f56',
]

// ─── Theme ────────────────────────────────────────────────────────────────────

export const theme = createTheme({
  primaryColor: 'teal',

  colors: { teal, blue, coral, amber, green, purple, pink, navy },

  // Typography — Nunito for warmth, JetBrains Mono for data
  fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', monospace",

  fontSizes: {
    xs: rem(13),
    sm: rem(15),
    md: rem(17),
    lg: rem(19),
    xl: rem(22),
  },

  lineHeights: {
    xs: '1.4',
    sm: '1.5',
    md: '1.6',
    lg: '1.7',
    xl: '1.8',
  },

  radius: {
    xs: rem(4),
    sm: rem(8),
    md: rem(12),
    lg: rem(16),
    xl: rem(24),
  },

  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },

  shadows: {
    xs: '0 1px 3px rgba(0,0,0,0.05)',
    sm: '0 2px 8px rgba(0,0,0,0.08)',
    md: '0 4px 16px rgba(0,0,0,0.1)',
    lg: '0 8px 32px rgba(0,0,0,0.12)',
    xl: '0 16px 48px rgba(0,0,0,0.16)',
  },

  other: {
    // Gradients — use these everywhere, never hardcode
    gradients: {
      primary:
        'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
      warm: 'linear-gradient(135deg, var(--mantine-color-coral-5), var(--mantine-color-amber-4))',
      cool: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-purple-5))',
      growth:
        'linear-gradient(135deg, var(--mantine-color-green-6), var(--mantine-color-teal-5))',
      dark: 'linear-gradient(135deg, var(--mantine-color-navy-9), var(--mantine-color-navy-8))',
      reset:
        'linear-gradient(180deg, var(--mantine-color-navy-9) 0%, var(--mantine-color-navy-8) 100%)',
      finance:
        'linear-gradient(135deg, var(--mantine-color-purple-6), var(--mantine-color-blue-5))',
      health:
        'linear-gradient(135deg, var(--mantine-color-green-6), var(--mantine-color-teal-5))',
      living:
        'linear-gradient(135deg, var(--mantine-color-coral-5), var(--mantine-color-pink-4))',
      goals:
        'linear-gradient(135deg, var(--mantine-color-amber-5), var(--mantine-color-coral-4))',
    },

    // Life area colors — single source of truth
    areaColors: {
      work: 'var(--mantine-color-blue-5)',
      personal: 'var(--mantine-color-coral-5)',
      money: 'var(--mantine-color-violet-5)',
      health: 'var(--mantine-color-green-5)',
      learning: 'var(--mantine-color-teal-5)',
      sleep: 'var(--mantine-color-indigo-5)',
      projects: 'var(--mantine-color-orange-5)',
      living: 'var(--mantine-color-coral-5)',
      growth: 'var(--mantine-color-teal-5)',
    },

    // Score card surfaces (navy dark theme)
    // Health metric chart colors
    metricColors: {
      mood: amber[5],
      energy: blue[5],
      sleep: purple[5],
      water: teal[5],
    },

    scoreCard: {
      bg: 'var(--mantine-color-navy-9)',
      bgGradient:
        'linear-gradient(135deg, var(--mantine-color-navy-9), var(--mantine-color-navy-8))',
      headerGradient:
        'linear-gradient(180deg, var(--mantine-color-navy-8), var(--mantine-color-navy-9))',
      border: 'var(--mantine-color-navy-7)',
      borderSubtle: 'rgba(255,255,255,0.06)',
      textPrimary: 'var(--mantine-color-white)',
      textSecondary: 'rgba(255,255,255,0.65)',
      textTertiary: 'rgba(255,255,255,0.4)',
      textMuted: 'rgba(255,255,255,0.3)',
      ringBg: 'rgba(255,255,255,0.06)',
      metricBg: 'rgba(255,255,255,0.02)',
      metricBorder: 'rgba(255,255,255,0.04)',
    },

    // Score thresholds
    scoreThresholds: {
      great: 70,
      okay: 40,
    },

    // Reset mode breathe cycles before skip appears
    breatheCyclesBeforeSkip: 2,

    // Life score weights (must sum to 1)
    lifeScoreWeights: {
      work: 0.2,
      finance: 0.2,
      health: 0.2,
      growth: 0.15,
      goals: 0.15,
      living: 0.1,
    },

    // Max tasks per area for score calculation
    lifeScoreMaxTasks: {
      work: 7,
      personal: 5,
      routine: 5,
    },
  },

  components: {
    Text: {
      defaultProps: { fw: 500 },
    },

    Paper: {
      defaultProps: { bg: 'var(--mantine-color-body)' },
      styles: {
        root: {
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        },
      },
    },

    Button: {
      defaultProps: { radius: 'xl' },
    },

    ActionIcon: {
      defaultProps: { radius: 'xl' },
    },

    TextInput: {
      defaultProps: { radius: 'lg' },
    },

    Select: {
      defaultProps: { radius: 'lg' },
    },

    Textarea: {
      defaultProps: { radius: 'lg' },
    },

    Modal: {
      defaultProps: {
        radius: 'xl',
        styles: {
          content: { background: 'var(--mantine-color-body)' },
          header: { background: 'var(--mantine-color-body)' },
        },
      },
    },

    Drawer: {
      defaultProps: {
        styles: {
          content: { background: 'var(--mantine-color-body)' },
          header: { background: 'var(--mantine-color-body)' },
        },
      },
    },

    Badge: {
      defaultProps: { radius: 'xl' },
    },

    AppShell: {
      defaultProps: {
        styles: {
          main: { background: 'var(--mantine-color-default-hover)' },
          navbar: {
            background: 'var(--mantine-color-body)',
            borderRight: '1px solid var(--mantine-color-default-border)',
          },
        },
      },
    },
  },
})
