import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gold-500/20 text-gold-400 border border-gold-500/30',
        success: 'bg-success/20 text-green-400 border border-success/30',
        warning: 'bg-warning/20 text-yellow-400 border border-warning/30',
        danger: 'bg-danger/20 text-red-400 border border-danger/30',
        info: 'bg-info/20 text-blue-400 border border-info/30',
        secondary: 'bg-dark-700 text-dark-300 border border-dark-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
