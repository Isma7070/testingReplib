import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { FilterBar } from '@/components/filter-bar';
import { KpiCard } from '@/components/kpi-card';
import { KpiModal } from '@/components/kpi-modal';
import { AlertsSection } from '@/components/alerts-section';
import { QuickActions } from '@/components/quick-actions';
import { useKpiOverview } from '@/hooks/use-kpis';
import { useQueryClient } from '@tanstack/react-query';
import type { KpiData, FilterParams } from '@shared/schema';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedKpi, setSelectedKpi] = useState<KpiData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<FilterParams>({
    dateRange: '30d',
    clientId: undefined,
    providerId: undefined,
  });

  const { data: kpis = [], isLoading, refetch } = useKpiOverview(filters);

  const handleKpiClick = (kpi: KpiData) => {
    setSelectedKpi(kpi);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedKpi(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdate = () => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={handleRefresh}
        lastUpdate={formatLastUpdate()}
        isLoading={isRefreshing || isLoading}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">KPI Críticos</h2>
          <p className="text-gray-600">Monitoreo en tiempo real del desempeño operativo</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.code}
              kpi={kpi}
              onClick={() => handleKpiClick(kpi)}
            />
          ))}
        </div>

        {/* Alerts Section */}
        <AlertsSection />

        {/* Quick Actions */}
        <QuickActions />
      </main>

      {/* KPI Detail Modal */}
      <KpiModal
        kpi={selectedKpi}
        filters={filters}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
