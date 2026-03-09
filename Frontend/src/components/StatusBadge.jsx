import { Badge } from './ui/badge';
import { getStatusColor } from '../utils/formatters';

/**
 * Status badge component with predefined colors
 * @param {{status: string, children: any}} props
 */
export function StatusBadge({ status, children }) {
  const colors = getStatusColor(status);

  return (
    <Badge className={`${colors.bg} ${colors.text} text-xs font-semibold`}>
      {children || status}
    </Badge>
  );
}

export default StatusBadge;
