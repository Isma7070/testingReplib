import { FileText, Settings, Users, Plus, Edit, Trash2, Shield, X, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthManager } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

export function QuickActions() {
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAlertsConfig, setShowAlertsConfig] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'client' as 'admin' | 'client',
    clientId: ''
  });
  const [editUserData, setEditUserData] = useState({
    username: '',
    email: '',
    role: 'client' as 'admin' | 'client',
    clientId: ''
  });
  const [alertThresholds, setAlertThresholds] = useState({
    DOH: { warning: 5, critical: 3 },
    DAMAGES: { warning: 2, critical: 5 },
    IRA: { warning: 85, critical: 80 },
    D2S: { warning: 3, critical: 5 },
    OTD: { warning: 95, critical: 90 },
    PICKING: { warning: 98, critical: 95 },
    LEADTIME: { warning: 3, critical: 5 },
    READYOT: { warning: 95, critical: 90 },
    PRODUCTIVITY: { warning: 80, critical: 70 },
    OTIF: { warning: 95, critical: 90 }
  });
  const [exportConfig, setExportConfig] = useState({
    kpis: [] as string[],
    format: 'csv' as 'csv' | 'excel',
    dateRange: '30d' as string,
    clientId: 'all',
    providerId: 'all',
    includeDetails: true,
    includeTrends: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/v1/users'],
    queryFn: async () => {
      const response = await fetch('/api/v1/users', {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
    enabled: showUserManagement,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/v1/clients'],
    queryFn: async () => {
      const response = await fetch('/api/v1/clients', {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: showNewUserModal || showExportModal,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['/api/v1/providers'],
    queryFn: async () => {
      const response = await fetch('/api/v1/providers', {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch providers');
      return response.json();
    },
    enabled: showExportModal,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuario creado exitosamente",
        description: "El nuevo usuario ha sido agregado al sistema",
      });
      setShowNewUserModal(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        role: 'client',
        clientId: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear usuario",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: any }) => {
      const response = await fetch(`/api/v1/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuario actualizado exitosamente",
        description: "Los cambios han sido guardados",
      });
      setShowEditUserModal(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado exitosamente",
        description: "El usuario ha sido removido del sistema",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar usuario",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const saveAlertConfigMutation = useMutation({
    mutationFn: async (thresholds: typeof alertThresholds) => {
      const response = await fetch('/api/v1/alerts/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify(thresholds),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save alert configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "Los umbrales de alertas han sido actualizados",
      });
      setShowAlertsConfig(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar configuración",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: async (config: typeof exportConfig) => {
      const params = new URLSearchParams({
        format: config.format,
        dateRange: config.dateRange,
        includeDetails: config.includeDetails.toString(),
        includeTrends: config.includeTrends.toString(),
        ...(config.kpis.length > 0 && { kpis: config.kpis.join(',') })
      });

      // Only add client/provider if not "all"
      if (config.clientId && config.clientId !== 'all') {
        params.append('clientId', config.clientId);
      }
      if (config.providerId && config.providerId !== 'all') {
        params.append('providerId', config.providerId);
      }

      const response = await fetch(`/api/v1/reports/export?${params}`, {
        method: 'GET',
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export report');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3pl-report-${new Date().toISOString().split('T')[0]}.${config.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Reporte exportado exitosamente",
        description: "El archivo se ha descargado automáticamente",
      });
      setShowExportModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al exportar reporte",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const handleUserAction = (actionType: string, index: number) => {
    switch (actionType) {
      case 'exportar':
        setShowExportModal(true);
        break;
      case 'configurar':
        setShowAlertsConfig(true);
        break;
      case 'administrar':
        setShowUserManagement(true);
        break;
      default:
        break;
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.username || !newUserData.email || !newUserData.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    const userData = {
      username: newUserData.username,
      email: newUserData.email,
      password: newUserData.password,
      role: newUserData.role,
      ...(newUserData.role === 'client' && newUserData.clientId && { clientId: newUserData.clientId })
    };

    createUserMutation.mutate(userData);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      role: user.role,
      clientId: user.clientId || ''
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !editUserData.username || !editUserData.email) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    const userData = {
      username: editUserData.username,
      email: editUserData.email,
      role: editUserData.role,
      ...(editUserData.role === 'client' && editUserData.clientId && { clientId: editUserData.clientId })
    };

    updateUserMutation.mutate({ id: editingUser.id, userData });
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleSaveAlertConfig = () => {
    saveAlertConfigMutation.mutate(alertThresholds);
  };

  const updateThreshold = (kpi: string, type: 'warning' | 'critical', value: number) => {
    setAlertThresholds(prev => ({
      ...prev,
      [kpi]: {
        ...prev[kpi as keyof typeof prev],
        [type]: value
      }
    }));
  };

  const handleExportReport = () => {
    if (exportConfig.kpis.length === 0) {
      toast({
        title: "Seleccione KPIs",
        description: "Debe seleccionar al menos un KPI para exportar",
        variant: "destructive",
      });
      return;
    }
    exportReportMutation.mutate(exportConfig);
  };

  const toggleKpiSelection = (kpi: string) => {
    setExportConfig(prev => ({
      ...prev,
      kpis: prev.kpis.includes(kpi)
        ? prev.kpis.filter(k => k !== kpi)
        : [...prev.kpis, kpi]
    }));
  };

  const selectAllKpis = () => {
    const allKpis = ['DOH', 'DAMAGES', 'IRA', 'D2S', 'OTD', 'PICKING', 'LEADTIME', 'READYOT', 'PRODUCTIVITY', 'OTIF'];
    setExportConfig(prev => ({ ...prev, kpis: allKpis }));
  };

  const clearKpiSelection = () => {
    setExportConfig(prev => ({ ...prev, kpis: [] }));
  };

  const actions = [
    {
      icon: FileText,
      title: 'Exportar Reportes',
      description: 'Generar reportes detallados de KPIs por período',
      buttonText: 'Generar Reporte',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      action: 'exportar'
    },
    {
      icon: Settings,
      title: 'Configurar Alertas',
      description: 'Personalizar umbrales y notificaciones',
      buttonText: 'Configurar',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      action: 'configurar'
    },
    {
      icon: Users,
      title: 'Gestión de Usuarios',
      description: 'Administrar accesos y permisos',
      buttonText: 'Administrar',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      action: 'administrar'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Exportar Reportes */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-900">Exportar Reportes</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Generar reportes detallados de KPIs por período</p>
          <Button 
            onClick={() => setShowExportModal(true)}
            className="w-full text-white bg-blue-600 hover:bg-blue-700"
          >
            Generar Reporte
          </Button>
        </CardContent>
      </Card>

      {/* Configurar Alertas */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-900">Configurar Alertas</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Personalizar umbrales y notificaciones</p>
          <Button 
            onClick={() => setShowAlertsConfig(true)}
            className="w-full text-white bg-green-600 hover:bg-green-700"
          >
            Configurar
          </Button>
        </CardContent>
      </Card>

      {/* Gestión de Usuarios */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-900">Gestión de Usuarios</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Administrar accesos y permisos</p>
          <Button 
            onClick={() => setShowUserManagement(true)}
            className="w-full text-white bg-yellow-600 hover:bg-yellow-700"
          >
            Administrar
          </Button>
        </CardContent>
      </Card>
      
      {/* Modal de Gestión de Usuarios */}
      <Dialog open={showUserManagement} onOpenChange={setShowUserManagement}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Administra los usuarios del sistema y sus permisos
              </p>
              <Button 
                size="sm" 
                onClick={() => setShowNewUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
            
            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm">
                <div className="col-span-3">Usuario</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Rol</div>
                <div className="col-span-2">Cliente</div>
                <div className="col-span-2">Acciones</div>
              </div>
              
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-t hover:bg-gray-50">
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">
                      {user.email}
                    </div>
                    <div className="col-span-2">
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                      {user.clientId || 'Todos'}
                    </div>
                    <div className="col-span-2">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditUser(user)}
                          disabled={updateUserMutation.isPending}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nuevo Usuario */}
      <Dialog open={showNewUserModal} onOpenChange={setShowNewUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nuevo Usuario
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario *</Label>
              <Input
                id="username"
                value={newUserData.username}
                onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Ingrese el nombre de usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value: 'admin' | 'client') => 
                  setNewUserData(prev => ({ ...prev, role: value, clientId: value === 'admin' ? '' : prev.clientId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newUserData.role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={newUserData.clientId}
                  onValueChange={(value) => setNewUserData(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients as any[]).map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewUserModal(false);
                  setNewUserData({
                    username: '',
                    email: '',
                    password: '',
                    role: 'client',
                    clientId: ''
                  });
                }}
                disabled={createUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Usuario */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Usuario
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Nombre de Usuario *</Label>
              <Input
                id="edit-username"
                value={editUserData.username}
                onChange={(e) => setEditUserData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Ingrese el nombre de usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol *</Label>
              <Select
                value={editUserData.role}
                onValueChange={(value: 'admin' | 'client') => 
                  setEditUserData(prev => ({ ...prev, role: value, clientId: value === 'admin' ? '' : prev.clientId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editUserData.role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="edit-client">Cliente</Label>
                <Select
                  value={editUserData.clientId}
                  onValueChange={(value) => setEditUserData(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients as any[]).map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setEditUserData({
                    username: '',
                    email: '',
                    role: 'client',
                    clientId: ''
                  });
                }}
                disabled={updateUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateUserMutation.isPending ? 'Actualizando...' : 'Actualizar Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuración de Alertas */}
      <Dialog open={showAlertsConfig} onOpenChange={setShowAlertsConfig}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Alertas
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Configure los umbrales de advertencia y crítico para cada KPI. Las alertas se activarán cuando los valores estén fuera de estos rangos.
            </p>
            
            <div className="grid gap-4">
              {Object.entries(alertThresholds).map(([kpi, thresholds]) => {
                const kpiNames: Record<string, string> = {
                  'DOH': 'Dias on Hand',
                  'DAMAGES': 'Recepciones Con Danos',
                  'IRA': 'IRA',
                  'D2S': 'Dock To Stock',
                  'OTD': 'Despachos OT',
                  'PICKING': 'Exactitud Picking',
                  'LEADTIME': 'Lead Time Interno',
                  'READYOT': 'Ready On Time',
                  'PRODUCTIVITY': 'Productividad',
                  'OTIF': 'OTIF'
                };
                const kpiDisplayName = kpiNames[kpi] || kpi;
                
                return (
                <div key={kpi} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">{kpiDisplayName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {kpi === 'DOH' || kpi === 'DAMAGES' || kpi === 'D2S' || kpi === 'LEADTIME' ? 'Menor es mejor' : 'Mayor es mejor'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${kpi}-warning`} className="text-yellow-600 font-medium">
                        Umbral de Advertencia
                      </Label>
                      <Input
                        id={`${kpi}-warning`}
                        type="number"
                        value={thresholds.warning}
                        onChange={(e) => updateThreshold(kpi, 'warning', Number(e.target.value))}
                        className="border-yellow-200 focus:border-yellow-400"
                        step={kpi === 'IRA' || kpi === 'OTD' || kpi === 'PICKING' || kpi === 'READYOT' || kpi === 'PRODUCTIVITY' || kpi === 'OTIF' ? '0.1' : '1'}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`${kpi}-critical`} className="text-red-600 font-medium">
                        Umbral Crítico
                      </Label>
                      <Input
                        id={`${kpi}-critical`}
                        type="number"
                        value={thresholds.critical}
                        onChange={(e) => updateThreshold(kpi, 'critical', Number(e.target.value))}
                        className="border-red-200 focus:border-red-400"
                        step={kpi === 'IRA' || kpi === 'OTD' || kpi === 'PICKING' || kpi === 'READYOT' || kpi === 'PRODUCTIVITY' || kpi === 'OTIF' ? '0.1' : '1'}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {kpi === 'DOH' && 'Días de inventario disponible'}
                    {kpi === 'DAMAGES' && 'Porcentaje de recepciones con daños'}
                    {kpi === 'IRA' && 'Porcentaje de precisión en recepción'}
                    {kpi === 'D2S' && 'Días promedio de despacho a cliente'}
                    {kpi === 'OTD' && 'Porcentaje de entregas a tiempo'}
                    {kpi === 'PICKING' && 'Precisión en el proceso de picking'}
                    {kpi === 'LEADTIME' && 'Tiempo promedio de procesamiento de órdenes'}
                    {kpi === 'READYOT' && 'Porcentaje de órdenes listas a tiempo'}
                    {kpi === 'PRODUCTIVITY' && 'Productividad del equipo operativo'}
                    {kpi === 'OTIF' && 'Órdenes perfectas (tiempo y cantidad)'}
                  </div>
                </div>
                );
              })}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAlertsConfig(false)}
                disabled={saveAlertConfigMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAlertConfig}
                disabled={saveAlertConfigMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {saveAlertConfigMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Exportación de Reportes */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Reportes de KPIs
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Configure y genere reportes detallados de los KPIs seleccionados con opciones de filtrado personalizables.
            </p>

            {/* Selección de KPIs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">KPIs a Exportar</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllKpis}
                    className="text-xs"
                  >
                    Seleccionar Todos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearKpiSelection}
                    className="text-xs"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: 'DOH', name: 'Dias on Hand' },
                  { code: 'DAMAGES', name: 'Recepciones Con Danos' },
                  { code: 'IRA', name: 'IRA' },
                  { code: 'D2S', name: 'Dock To Stock' },
                  { code: 'OTD', name: 'Despachos OT' },
                  { code: 'PICKING', name: 'Exactitud Picking' },
                  { code: 'LEADTIME', name: 'Lead Time Interno' },
                  { code: 'READYOT', name: 'Ready On Time' },
                  { code: 'PRODUCTIVITY', name: 'Productividad' },
                  { code: 'OTIF', name: 'OTIF' }
                ].map(kpi => (
                  <div key={kpi.code} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`export-${kpi.code}`}
                      checked={exportConfig.kpis.includes(kpi.code)}
                      onChange={() => toggleKpiSelection(kpi.code)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`export-${kpi.code}`} className="text-sm cursor-pointer">
                      {kpi.name}
                    </Label>
                    {exportConfig.kpis.includes(kpi.code) && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración de Filtros */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="export-dateRange">Período de Tiempo</Label>
                <Select
                  value={exportConfig.dateRange}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="export-format">Formato de Exportación</Label>
                <Select
                  value={exportConfig.format}
                  onValueChange={(value: 'csv' | 'excel') => setExportConfig(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="export-client">Cliente (Opcional)</Label>
                <Select
                  value={exportConfig.clientId}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {(clients as any[]).map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="export-provider">Proveedor (Opcional)</Label>
                <Select
                  value={exportConfig.providerId}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, providerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {(providers as any[]).map((provider: any) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opciones Adicionales */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Opciones de Contenido</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeDetails"
                    checked={exportConfig.includeDetails}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeDetails: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeDetails" className="text-sm cursor-pointer">
                    Incluir datos detallados por transacción
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeTrends"
                    checked={exportConfig.includeTrends}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeTrends: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeTrends" className="text-sm cursor-pointer">
                    Incluir datos de tendencias históricas
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                disabled={exportReportMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExportReport}
                disabled={exportReportMutation.isPending || exportConfig.kpis.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportReportMutation.isPending ? 'Exportando...' : 'Exportar Reporte'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
