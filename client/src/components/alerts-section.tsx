import { AlertTriangle, Clock, Target, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AuthManager } from '@/lib/auth';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KPI_CONFIG } from '@/lib/kpi-utils';
import type { Alert } from '@shared/schema';

export function AlertsSection() {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  
  const { data: alerts = [] } = useQuery({
    queryKey: ['/api/v1/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/v1/alerts', {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json() as Promise<Alert[]>;
    },
    refetchInterval: 60000,
  });

  const criticalAlerts = alerts.filter(alert => alert.severity === 'high').slice(0, 3);

  if (criticalAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (kpiCode: string) => {
    switch (kpiCode) {
      case 'OTIF':
        return Target;
      case 'D2S':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now.getTime() - alertDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `hace ${diffMins} min`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    return `hace ${diffHours}h`;
  };

  const getKpiDisplayName = (kpiCode: string) => {
    return KPI_CONFIG[kpiCode as keyof typeof KPI_CONFIG]?.label || kpiCode;
  };

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-red-50 to-yellow-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-900 mb-2">Alertas Críticas</h3>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.kpiCode);
                return (
                  <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-600">
                          Valor: {alert.value} - Umbral: {alert.threshold}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(alert.createdAt?.toString() || new Date().toISOString())}
                    </span>
                  </div>
                );
              })}
            </div>
            {alerts.length > 3 && (
              <button 
                onClick={() => setShowAllAlerts(true)}
                className="mt-4 text-sm text-red-700 hover:text-red-800 font-medium hover:underline cursor-pointer"
              >
                Ver todas las alertas ({alerts.length}) →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal for all alerts */}
      <Dialog open={showAllAlerts} onOpenChange={setShowAllAlerts}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Todas las Alertas ({alerts.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.kpiCode);
              return (
                <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-sm">{getKpiDisplayName(alert.kpiCode)}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {alert.createdAt ? formatTimeAgo(alert.createdAt.toString()) : 'Sin fecha'}
                    </span>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity === 'high' ? 'Crítica' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {alert.message}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-600">
                    <span>Valor: {alert.value}</span>
                    <span>•</span>
                    <span>Umbral: {alert.threshold}</span>
                    {alert.clientId && alert.clientId !== 'ALL' && (
                      <>
                        <span>•</span>
                        <span>Cliente: {alert.clientId}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay alertas en el sistema</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
