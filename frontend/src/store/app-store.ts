import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Dataset, DashboardStats, User, Notification, DeletedDataset, DatasetPreview, APIConnection, APISyncLog } from '@/types';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Dashboard state
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;
  
  // Datasets state
  datasets: Dataset[];
  uploadingDatasets: Dataset[];
  deletedDatasets: DeletedDataset[];
  previewData: DatasetPreview | null;
  isPreviewLoading: boolean;
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  addUploadingDataset: (dataset: Dataset) => void;
  updateUploadingDataset: (id: string, updates: Partial<Dataset>) => void;
  removeUploadingDataset: (id: string) => void;
  setDeletedDatasets: (datasets: DeletedDataset[]) => void;
  setPreviewData: (data: DatasetPreview | null) => void;
  setIsPreviewLoading: (loading: boolean) => void;
  
  // API Connections state
  apiConnections: APIConnection[];
  syncLogs: Record<number, APISyncLog[]>;
  setAPIConnections: (connections: APIConnection[]) => void;
  addAPIConnection: (connection: APIConnection) => void;
  updateAPIConnection: (id: number, updates: Partial<APIConnection>) => void;
  removeAPIConnection: (id: number) => void;
  setSyncLogs: (connectionId: number, logs: APISyncLog[]) => void;
  
  // Notifications state
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      stats: {
        totalRecords: 0,
        activeTables: 0,
        queriesToday: 0,
        aiInsights: 0,
      },
      datasets: [],
      uploadingDatasets: [],
      deletedDatasets: [],
      previewData: null,
      isPreviewLoading: false,
      apiConnections: [],
      syncLogs: {},
      notifications: [],
      sidebarOpen: false,
      isLoading: false,
      
      // User actions
      setUser: (user) => set({ user }, false, 'setUser'),
      
      // Dashboard actions
      setStats: (stats) => set({ stats }, false, 'setStats'),
      
      // Dataset actions
      setDatasets: (datasets) => set({ datasets }, false, 'setDatasets'),
      addDataset: (dataset) => 
        set((state) => ({ 
          datasets: [...state.datasets, dataset] 
        }), false, 'addDataset'),
      removeDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id)
        }), false, 'removeDataset'),
      updateDataset: (id, updates) =>
        set((state) => ({
          datasets: state.datasets.map((d) => 
            d.id === id ? { ...d, ...updates } : d
          )
        }), false, 'updateDataset'),
      
      // Uploading datasets actions
      addUploadingDataset: (dataset) =>
        set((state) => ({
          uploadingDatasets: [...state.uploadingDatasets, dataset]
        }), false, 'addUploadingDataset'),
      updateUploadingDataset: (id, updates) =>
        set((state) => ({
          uploadingDatasets: state.uploadingDatasets.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          )
        }), false, 'updateUploadingDataset'),
      removeUploadingDataset: (id) =>
        set((state) => ({
          uploadingDatasets: state.uploadingDatasets.filter((d) => d.id !== id)
        }), false, 'removeUploadingDataset'),
      
      // Deleted datasets actions
      setDeletedDatasets: (deletedDatasets) => 
        set({ deletedDatasets }, false, 'setDeletedDatasets'),
      
      // Preview actions
      setPreviewData: (previewData) => set({ previewData }, false, 'setPreviewData'),
      setIsPreviewLoading: (isPreviewLoading) => set({ isPreviewLoading }, false, 'setIsPreviewLoading'),
      
      // API Connections actions
      setAPIConnections: (apiConnections) => set({ apiConnections }, false, 'setAPIConnections'),
      addAPIConnection: (connection) =>
        set((state) => ({
          apiConnections: [...state.apiConnections, connection]
        }), false, 'addAPIConnection'),
      updateAPIConnection: (id, updates) =>
        set((state) => ({
          apiConnections: state.apiConnections.map((conn) =>
            conn.id === id ? { ...conn, ...updates } : conn
          )
        }), false, 'updateAPIConnection'),
      removeAPIConnection: (id) =>
        set((state) => ({
          apiConnections: state.apiConnections.filter((conn) => conn.id !== id)
        }), false, 'removeAPIConnection'),
      setSyncLogs: (connectionId, logs) =>
        set((state) => ({
          syncLogs: { ...state.syncLogs, [connectionId]: logs }
        }), false, 'setSyncLogs'),
      
      // Notification actions
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(7);
        const timestamp = new Date().toISOString();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id, timestamp }]
        }), false, 'addNotification');
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }), false, 'removeNotification'),
      clearNotifications: () => set({ notifications: [] }, false, 'clearNotifications'),
      
      // UI actions
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }, false, 'setSidebarOpen'),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar'),
      
      // Loading actions
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
    }),
    { name: 'reportzy-store' }
  )
);
