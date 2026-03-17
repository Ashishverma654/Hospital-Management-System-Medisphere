import { motion, useMotionValue, useTransform, animate } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { staggerItem } from '../lib/animation-variants';

/**
 * Enterprise stat card with animated counter and accent stripe.
 *
 * @param {string}  title       – Short label
 * @param {number}  value       – Numeric value (animates from 0)
 * @param {string}  [subtitle]  – Description text
 * @param {React.ElementType} [icon] – Lucide icon component
 * @param {'default'|'success'|'warning'|'danger'|'info'} [variant]
 * @param {string}  [prefix]    – e.g. "₹"
 * @param {string}  [suffix]    – e.g. "%"
 * @param {boolean} [loading]
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  prefix = '',
  suffix = '',
  loading = false,
  className,
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (loading || value === undefined || value === null) return;
    const num = typeof value === 'number' ? value : Number(value) || 0;
    const controls = animate(motionValue, num, {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    return controls.stop;
  }, [value, loading, motionValue]);

  const accentColors = {
    default: 'from-primary/30 via-primary/10 to-transparent',
    success: 'from-emerald-400/30 via-emerald-400/10 to-transparent',
    warning: 'from-amber-400/30 via-amber-400/10 to-transparent',
    danger: 'from-rose-400/30 via-rose-400/10 to-transparent',
    info: 'from-sky-400/30 via-sky-400/10 to-transparent',
  };

  const barColors = {
    default: 'from-primary to-secondary',
    success: 'from-emerald-400 to-emerald-600',
    warning: 'from-amber-400 to-amber-600',
    danger: 'from-rose-400 to-rose-600',
    info: 'from-sky-400 to-sky-600',
  };

  const iconBgColors = {
    default: 'bg-primary/15 text-primary',
    success: 'bg-emerald-500/15 text-emerald-600',
    warning: 'bg-amber-500/15 text-amber-600',
    danger: 'bg-rose-500/15 text-rose-600',
    info: 'bg-sky-500/15 text-sky-600',
  };

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg',
        className
      )}
    >
      {/* accent haze */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', accentColors[variant])} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground truncate">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 rounded-lg bg-muted animate-shimmer" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {prefix}
              <motion.span>{rounded}</motion.span>
              {suffix}
            </p>
          )}
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', iconBgColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full w-2/3 rounded-full bg-gradient-to-r', barColors[variant])} />
      </div>
    </motion.div>
  );
}
