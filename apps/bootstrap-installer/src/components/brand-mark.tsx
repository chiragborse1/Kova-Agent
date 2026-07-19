import { cn } from '../lib/utils'

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

// Brand badge: Kova logo on a white tile, identical in light/dark.
export function BrandMark({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('inline-flex size-14 shrink-0 items-center justify-center rounded-md bg-white', className)} {...props}>
      <img alt="" className="size-full object-contain" src={assetPath('kova-logo.png')} />
    </span>
  )
}
