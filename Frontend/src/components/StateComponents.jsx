import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Loading skeleton component
 */
export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Error state component
 */
export function ErrorState({ title = 'Error', message = 'Something went wrong', onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <CardTitle className="text-red-800">{title}</CardTitle>
        </div>
        <CardDescription className="text-red-700">{message}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <button
            onClick={onRetry}
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Try again
          </button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ icon: Icon, title = 'No data', message = 'There is nothing to show here.' }) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="items-center text-center">
        {Icon && <Icon className="w-12 h-12 text-gray-400 mb-4" />}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
