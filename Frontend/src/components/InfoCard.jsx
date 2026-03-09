import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

/**
 * InfoCard component for displaying metrics
 * @param {{icon: React.ReactNode, title: string, value: string|number, subtitle: string}} props
 */
export function InfoCard({ icon, title, value, subtitle }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default InfoCard;
