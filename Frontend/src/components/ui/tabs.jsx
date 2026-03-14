import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext({ value: '', onValueChange: () => {} });

function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleChange = (v) => {
    if (controlledValue === undefined) setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground gap-1',
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

function TabsTrigger({ value, className, children, ...props }) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isActive = selectedValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50 hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children, ...props }) {
  const { value: selectedValue } = React.useContext(TabsContext);
  if (selectedValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-3 animate-fade-in-up', className)}
      style={{ animationDuration: '0.3s' }}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
