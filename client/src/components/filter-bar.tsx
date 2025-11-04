import { Calendar, Building2, Truck, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients, useProviders } from '@/hooks/use-kpis';
import { useAuth } from '@/hooks/use-auth';
import type { FilterParams } from '@shared/schema';

interface FilterBarProps {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onRefresh: () => void;
  lastUpdate?: string;
  isLoading?: boolean;
}

export function FilterBar({ filters, onFiltersChange, onRefresh, lastUpdate, isLoading }: FilterBarProps) {
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const { data: providers = [] } = useProviders();

  const updateFilter = (key: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value || undefined,
    });
  };

  const canViewAllClients = user?.role === 'admin';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter - Only show for admin users */}
            {canViewAllClients && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <Select value={filters.clientId || ''} onValueChange={(value) => updateFilter('clientId', value)}>
                  <SelectTrigger className="w-auto min-w-[150px]">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Provider Filter - Only show for admin users */}
            {canViewAllClients && (
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <Select value={filters.providerId || ''} onValueChange={(value) => updateFilter('providerId', value)}>
                  <SelectTrigger className="w-auto min-w-[150px]">
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Last Update */}
            {lastUpdate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RefreshCw className="h-3 w-3" />
                <span>Actualizado: {lastUpdate}</span>
              </div>
            )}

            {/* Refresh Button */}
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </Button>

            {/* Export Button */}
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
