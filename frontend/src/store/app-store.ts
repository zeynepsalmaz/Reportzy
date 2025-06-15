import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Dataset, DashboardStats, User, Notification } from '@/types';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Dashboard state
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;
  
  // Datasets state
  datasets: Dataset[];
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  
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
