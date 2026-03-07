/**
 * Reusable placeholder for routes that are not yet fully implemented.
 */
export default function PlaceholderPage({ title, description = 'This section is under development.' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
