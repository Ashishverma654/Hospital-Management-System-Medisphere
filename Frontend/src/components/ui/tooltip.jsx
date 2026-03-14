import * as React from 'react';
import { cn } from '@/lib/utils';

const TooltipContext = React.createContext({ open: false, setOpen: () => {} });

function TooltipProvider({ children }) {
  return <>{children}</>;
}

function Tooltip({ children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({ children, asChild, ...props }) {
  const { setOpen } = React.useContext(TooltipContext);
  const child = asChild ? React.Children.only(children) : <span {...props}>{children}</span>;

  return React.cloneElement(child, {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  });
}

function TooltipContent({ children, className, side = 'top', ...props }) {
  const { open } = React.useContext(TooltipContext);
  if (!open) return null;

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={cn(
        'absolute z-50 animate-fade-in px-3 py-1.5 text-xs font-medium rounded-lg',
        'bg-foreground text-background shadow-lg',
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
