import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';

/**
 * Reusable DataTable component with sorting and pagination
 * @param {{data: Array, columns: Array, onRowClick: Function, isLoading: boolean, emptyMessage: string}} props
 */
export function DataTable({
  data = [],
  columns = [],
  onRowClick = null,
  isLoading = false,
  emptyMessage = 'No data available',
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <TableComponent>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.sortable ? 'cursor-pointer' : ''}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortConfig.key === column.key && (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow
              key={row._id || row.id}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <TableCell key={`${row._id}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableComponent>
    </div>
  );
}

export default DataTable;
