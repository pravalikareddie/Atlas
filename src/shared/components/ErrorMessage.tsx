import { Alert } from '@mantine/core'

interface Props {
  message: string
}

export function ErrorMessage({ message }: Props) {
  return (
    <Alert color="red" variant="light">
      {message}
    </Alert>
  )
}
