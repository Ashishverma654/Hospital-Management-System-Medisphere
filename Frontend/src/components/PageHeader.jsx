import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeInUp } from '../lib/animation-variants';

/**
 * Consistent page header with breadcrumbs, title, subtitle, and optional action buttons.
 *
 * @param {string}  title
 * @param {string}  [subtitle]
 * @param {Array<{label:string, to?:string}>} [breadcrumbs]
 * @param {React.ReactNode} [actions] – Right-side buttons / controls
 */
export default function PageHeader({ title, subtitle, breadcrumbs, actions, className }) {
  return (
    <motion.div
      {...fadeInUp}
      className={cn('mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4', className)}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">{actions}</div>}
    </motion.div>
  );
}
