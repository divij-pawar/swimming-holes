import { qualityColor, qualityLabel } from '@/lib/quality'
import type { SwimmingQuality } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  quality: SwimmingQuality | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

export function QualityBadge({ quality, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-medium leading-none',
        qualityColor(quality),
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm'
      )}
    >
      {qualityLabel(quality)}
    </span>
  )
}
