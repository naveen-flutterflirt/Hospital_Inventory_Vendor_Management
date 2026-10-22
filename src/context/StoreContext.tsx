"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, StoreItem } from '@/lib/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface StoreContextType {
  stores: StoreItem[];
  activeStore: string;
  activeStoreCode: string;
  selectedStore: StoreItem | null;
  isLoading: boolean;
  setActiveStore: (storeNameOrCode: string) => void;
  refreshStores: () => Promise<void>;
  getStoreDisplayName: (nameOrCode: string) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'crm_active_store';

const fallbackStores: StoreItem[] = [
  {
    id: 1,
    code: 'STR-CENTRAL',
    name: 'Central Warehouse & Main Drug Store',
    branch: 'Main Campus',
    store_type: 'Central',
    is_active: true,
    items_count: 14,
    batches_count: 31,
    total_stock: 9948,
    manager_name: 'Dr. Rajesh Sharma',
  },
  {
    id: 2,
    code: 'STR-PHARMA',
    name: 'Apex Pharmacy & Cold Chain Store',
    branch: 'Block A',
    store_type: 'Pharmacy',
    is_active: true,
    items_count: 14,
    batches_count: 16,
    total_stock: 1797,
    manager_name: 'Ananya Sen',
  },
  {
    id: 3,
    code: 'STR-ICU',
    name: 'ICU Sub-Store & Emergency Stock',
    branch: 'Trauma Wing',
    store_type: 'ICU',
    is_active: true,
    items_count: 13,
    batches_count: 15,
    total_stock: 1685,
    manager_name: 'Store In-Charge',
  },
  {
    id: 4,
    code: 'STR-OT',
    name: 'OT & Critical Care Sub-Store',
    branch: 'Surgical Block',
    store_type: 'OT',
    is_active: true,
    items_count: 4,
    batches_count: 4,
    total_stock: 320,
    manager_name: 'Vikram Malhotra',
  },
  {
    id: 5,
    code: 'STR-WARDS',
    name: 'General Wards Dispensing Store',
    branch: 'Inpatient Tower',
    store_type: 'Wards',
    is_active: true,
    items_count: 1,
    batches_count: 3,
    total_stock: 1200,
    manager_name: 'Store In-Charge',
  },
  {
    id: 6,
    code: 'STR-EMG',
    name: 'Emergency & Trauma Triage Store',
    branch: 'Ground Floor ER',
    store_type: 'Emergency',
    is_active: true,
    items_count: 0,
    batches_count: 0,
    total_stock: 0,
    manager_name: 'Store In-Charge',
  },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreItem[]>(fallbackStores);
  const [activeStore, setActiveStoreState] = useState<string>('Apex Pharmacy & Cold Chain Store');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to format short name for buttons/headers (e.g. 'Apex Pharmacy')
  const getStoreDisplayName = useCallback((fullName: string) => {
    if (!fullName || fullName === 'All' || fullName === 'ALL') return 'All Stores';
    if (fullName.includes('Apex Pharmacy')) return 'Apex Pharmacy';
    if (fullName.includes('Central Warehouse')) return 'Central Warehouse';
    if (fullName.includes('ICU')) return 'ICU Store';
    if (fullName.includes('OT')) return 'OT Store';
    if (fullName.includes('General Wards')) return 'General Wards';
    if (fullName.includes('Emergency')) return 'Emergency Store';
    return fullName.split('&')[0].trim();
  }, []);

  // Fetch real stores from backend
  const fetchStores = useCallback(async () => {
    try {
      const res = await api.stores.getStores();
      if (res.success && res.data && res.data.length > 0) {
        setStores(res.data);
      }
    } catch (err) {
      console.warn('Using fallback stores, backend query failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize active store from localStorage or User profile or default
  useEffect(() => {
    fetchStores();

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setActiveStoreState(saved);
      } else if (user?.branch) {
        setActiveStoreState(user.branch);
      } else {
        // Default to Apex Pharmacy (matching the screenshot)
        setActiveStoreState('Apex Pharmacy & Cold Chain Store');
      }
    }
  }, [fetchStores, user?.branch]);

  const setActiveStore = (storeIdentifier: string) => {
    setActiveStoreState(storeIdentifier);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, storeIdentifier);
    }

    const matchedStore = stores.find(
      s => s.name === storeIdentifier || s.code === storeIdentifier || s.id === Number(storeIdentifier)
    );

    const displayName = matchedStore ? matchedStore.name : (storeIdentifier === 'All' ? 'All Stores' : storeIdentifier);
    toast.info(`Active inventory context set to ${displayName}`, 'Store Context Updated');
  };

  const selectedStore = stores.find(
    s => s.name === activeStore || s.code === activeStore || s.id === Number(activeStore)
  ) || null;

  const activeStoreCode = selectedStore ? selectedStore.code : (activeStore === 'All' ? 'ALL' : 'STR-PHARMA');

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        activeStoreCode,
        selectedStore,
        isLoading,
        setActiveStore,
        refreshStores: fetchStores,
        getStoreDisplayName,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
