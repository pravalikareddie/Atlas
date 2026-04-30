import { Skeleton } from '@mantine/core'

interface Props {
  count?: number
}

export function SkeletonRow({ count = 3 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={20} radius="sm" mb="sm" />
      ))}
    </>
  )
}
