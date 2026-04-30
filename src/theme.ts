import { createTheme, MantineColorsTuple } from '@mantine/core'

const purple: MantineColorsTuple = [
  '#f3f0ff',
  '#e5e0ff',
  '#c9bfff',
  '#a99ff0',
  '#8d82e8',
  '#7C6FE0',
  '#6f62d4',
  '#5f53c0',
  '#4f44ab',
  '#3f3596',
]
const green: MantineColorsTuple = [
  '#e6fcf0',
  '#c3f5dc',
  '#9aedc5',
  '#6de4ac',
  '#47db96',
  '#34C78A',
  '#2ab377',
  '#1f9f64',
  '#158b52',
  '#0a7740',
]
const amber: MantineColorsTuple = [
  '#fff8e1',
  '#ffecb3',
  '#ffe082',
  '#ffd54f',
  '#f5be6a',
  '#F0A429',
  '#e09520',
  '#c98318',
  '#b37110',
  '#9c5f08',
]
const red: MantineColorsTuple = [
  '#ffe8e8',
  '#ffc8c8',
  '#ffa0a0',
  '#ff7878',
  '#f06464',
  '#F05050',
  '#e04040',
  '#c83030',
  '#b02020',
  '#981010',
]
const coral: MantineColorsTuple = [
  '#fff0ec',
  '#ffd8cc',
  '#ffb8a0',
  '#ff9878',
  '#f07858',
  '#F06A50',
  '#e05a40',
  '#c84a30',
  '#b03a20',
  '#982a10',
]
const blue: MantineColorsTuple = [
  '#e8f4ff',
  '#c8e4ff',
  '#a0d0ff',
  '#78bcff',
  '#58acf9',
  '#4F9CF9',
  '#408ce0',
  '#307cc8',
  '#206cb0',
  '#105c98',
]
const teal: MantineColorsTuple = [
  '#e0faf8',
  '#b3f2ec',
  '#80e8de',
  '#4dded0',
  '#38BEC9',
  '#30b0ba',
  '#28a0aa',
  '#20909a',
  '#18808a',
  '#10707a',
]
const pink: MantineColorsTuple = [
  '#ffe8f0',
  '#ffc8d8',
  '#ffa0c0',
  '#ff78a8',
  '#ff6b9d',
  '#FF6B9D',
  '#e85a8a',
  '#d04a78',
  '#b83a66',
  '#a02a54',
]
export const theme = createTheme({
  primaryColor: 'teal',
  colors: { purple, green, amber, red, coral, blue, teal, pink },
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  other: { fontWeight: 600 },
  components: {
    Text: { defaultProps: { fw: 600 } },
    Paper: { defaultProps: { bg: 'var(--mantine-color-body)' } },
    Modal: {
      defaultProps: {
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
