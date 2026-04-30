import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'
export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computed = useComputedColorScheme('light')

  return (
    <ActionIcon
      variant="subtle"
      size="sm"
      onClick={() => setColorScheme(computed === 'light' ? 'dark' : 'light')}
      aria-label="Toggle color scheme"
    >
      {computed === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </ActionIcon>
  )
}
