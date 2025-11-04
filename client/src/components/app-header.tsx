import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { AuthManager } from '@/lib/auth';
import { useState } from 'react';
import type { Alert } from '@shared/schema';

export function AppHeader() {
  const { user, logout } = useAuth();
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

  const criticalAlerts = alerts.filter(alert => alert.severity === 'high');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-600 rounded flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard 3PL</h1>
            </div>
            <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
              Producción
            </Badge>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <Bell className="h-5 w-5" />
                  {criticalAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {criticalAlerts.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 border-b">
                  <h3 className="text-sm font-semibold">Notificaciones</h3>
                  <p className="text-xs text-gray-500">{alerts.length} alertas totales</p>
                </div>
                {alerts.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {alerts.slice(0, 10).map((alert) => (
                      <DropdownMenuItem key={alert.id} className="flex flex-col items-start p-3 cursor-default">
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-500' :
                            alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-medium text-sm">{alert.kpiCode}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {alert.createdAt ? new Date(alert.createdAt.toString()).toLocaleDateString() : 'Sin fecha'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                        {alert.clientId && alert.clientId !== 'ALL' && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2">
                            Cliente: {alert.clientId}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                    {alerts.length > 10 && (
                      <div className="px-3 py-2 text-center border-t">
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          onClick={() => setShowAllAlerts(true)}
                        >
                          +{alerts.length - 10} alertas más
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay alertas</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.username.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.username || 'Usuario'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <span className="font-semibold text-sm">{alert.kpiCode}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {alert.createdAt ? new Date(alert.createdAt.toString()).toLocaleDateString() : 'Sin fecha'}
                  </span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity === 'high' ? 'Crítica' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  {alert.message}
                </p>
                {alert.clientId && alert.clientId !== 'ALL' && (
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Cliente: {alert.clientId}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay alertas en el sistema</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
