"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Package, Search, RefreshCw, Plus, SlidersHorizontal, ArrowRightLeft, 
  ShoppingCart, AlertTriangle, Loader2, LayoutGrid, TableProperties, X
} from 'lucide-react';
import { api, ItemDetailResponse, ItemLookupsResponse, FormularyItemSummary } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import NewPRModal from '@/components/dashboard/NewPRModal';
import NewTransferModal from '@/components/dashboard/NewTransferModal';
import AdjustStockModal from '@/components/dashboard/AdjustStockModal';
import NewItemModal from '@/components/dashboard/NewItemModal';
import { SkeletonTableRows, SkeletonDetailDrawer } from '@/components/ui/Skeleton';

export default function ItemsAndStockPage() {
  const { toast } = useToast();

  // View mode: 'profile' (detailed item stock & batches) or 'catalog' (full items table)
  const [viewMode, setViewMode] = useState<'profile' | 'catalog'>('profile');

  // Modals state
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);

  // Lookups and catalog list
  const [lookups, setLookups] = useState<ItemLookupsResponse | null>(null);
  const [catalogItems, setCatalogItems] = useState<FormularyItemSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | string>('DRG-00412');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Item detail state
  const [itemDetail, setItemDetail] = useState<ItemDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // 1. Fetch lookups & items master
  const loadLookups = useCallback(async () => {
    try {
      const res = await api.items.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
      }
    } catch (err) {
      console.error('Failed to load item lookups:', err);
    }
  }, []);

  // 2. Fetch catalog list (with search & category filter)
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await api.items.getAll({
        search: searchQuery,
        category: categoryFilter,
        limit: 100,
      });
      if (res.success && res.data) {
        setCatalogItems(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load catalog items:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  // 3. Fetch single item detail
  const loadItemDetail = useCallback(async (id: number | string) => {
    setLoading(true);
    try {
      const res = await api.items.getById(id);
      if (res.success && res.data) {
        setItemDetail(res.data);
        setSelectedItemId(res.data.id);
      } else {
        toast.error('Failed to load item profile', 'Error');
      }
    } catch (err: any) {
      console.error('Failed to load item detail:', err);
      toast.error(err.message || 'Error loading item profile', 'Error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Load item detail when selectedItemId changes
  useEffect(() => {
    if (selectedItemId) {
      loadItemDetail(selectedItemId);
    }
  }, [selectedItemId, loadItemDetail]);

  // Handle category filter click
  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat);

    // Filter available items in lookups matching this category
    const allItems = lookups?.items || [];
    const matching = allItems.filter(it => cat === 'All' || it.category === cat);

    // If there are matching items, automatically switch the active item to the first matching item!
    if (matching.length > 0) {
      // If currently selected item is already in this category, keep it; otherwise switch to first matching
      const currentItemMatches = matching.some(it => it.id === selectedItemId || it.itemCode === selectedItemId);
      if (!currentItemMatches) {
        setSelectedItemId(matching[0].id);
      }
    }
  };

  // Filtered items for dropdown based on active category & search
  const availableDropdownItems = (lookups?.items || []).filter(it => {
    const matchesCategory = categoryFilter === 'All' || it.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      it.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (it.genericName && it.genericName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Pharmacy', 'Consumables', 'Implants', 'Lab Supplies', 'Radiology'];

  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans">
      <Header />

      {/* Modals */}
      <NewPRModal 
        isOpen={prModalOpen} 
        onClose={() => setPrModalOpen(false)} 
        onSuccess={() => {
          if (itemDetail) loadItemDetail(itemDetail.id);
        }}
      />
      <NewTransferModal 
        isOpen={transferModalOpen} 
        onClose={() => setTransferModalOpen(false)} 
        onSuccess={() => {
          if (itemDetail) loadItemDetail(itemDetail.id);
        }}
      />
      {itemDetail && (
        <AdjustStockModal
          itemId={itemDetail.id}
          itemCode={itemDetail.itemCode}
          itemName={itemDetail.name}
          uom={itemDetail.uom}
          batches={itemDetail.batches}
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          onSuccess={() => {
            loadItemDetail(itemDetail.id);
            loadLookups();
            loadCatalog();
          }}
        />
      )}
      <NewItemModal
        isOpen={newItemModalOpen}
        onClose={() => setNewItemModalOpen(false)}
        onSuccess={() => {
          loadLookups();
          loadCatalog();
        }}
      />

      {/* Top Filter Bar: Category Tabs, Search, and View Mode Toggle */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-3 sm:p-4 flex flex-col gap-3">
        {/* Row 1: Category Filter Tabs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap border",
                  categoryFilter === cat
                    ? "bg-[#127670]/15 text-[#127670] border-[#127670]/30 shadow-xs font-bold"
                    : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"
                )}
              >
                {cat}
                {cat !== 'All' && lookups && (
                  <span className="ml-1.5 text-[11px] opacity-70">
                    ({lookups.items.filter(it => it.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right Controls: View Mode & Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('profile')}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  viewMode === 'profile'
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
                title="Detailed Stock & FEFO Batches View"
              >
                <LayoutGrid size={13} /> Item Profile
              </button>
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  viewMode === 'catalog'
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
                title="Full Master Formulary Catalog"
              >
                <TableProperties size={13} /> All Items ({catalogItems.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (itemDetail) loadItemDetail(itemDetail.id);
                loadLookups();
                loadCatalog();
              }}
              title="Refresh Data"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={cn((loading || catalogLoading) && "animate-spin")} />
            </button>

            <button
              type="button"
              onClick={() => setNewItemModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-[12px] sm:text-[13px] font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} /> Add Item
            </button>
          </div>
        </div>

        {/* Row 2: Search Input & Item Quick Selector (in Profile view) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          {/* Search box */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={`Search ${categoryFilter === 'All' ? 'all items' : categoryFilter} by name, code, generic formulation...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-[13px] w-full text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Item Selector Dropdown */}
          <div className="w-full sm:w-80 shrink-0">
            <select
              value={selectedItemId ? String(selectedItemId) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedItemId(e.target.value);
                  if (viewMode === 'catalog') {
                    setViewMode('profile');
                  }
                }
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] font-medium cursor-pointer truncate"
            >
              {availableDropdownItems.length === 0 ? (
                <option value="">No items found in {categoryFilter}</option>
              ) : (
                availableDropdownItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.itemCode} — {it.name} ({it.category}) · Stock: {it.totalOnHand}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Catalog Table View */}
      {viewMode === 'catalog' ? (
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Package size={17} className="text-[#127670]" /> Hospital Master Formulary Catalog
              </h2>
              <p className="text-[12px] text-slate-500">
                Showing {catalogItems.length} items in category: <span className="font-semibold text-slate-700">{categoryFilter}</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                  <th className="py-3 px-4 font-medium">Item Code</th>
                  <th className="py-3 px-4 font-medium">Item Trade Name</th>
                  <th className="py-3 px-4 font-medium">Generic Formulation</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium text-right">In-Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Cover (Days)</th>
                  <th className="py-3 px-4 font-medium text-right">Reorder Lvl</th>
                  <th className="py-3 px-4 font-medium text-right">Last Rate</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {catalogLoading ? (
                  <SkeletonTableRows rows={8} columns={10} />
                ) : catalogItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-[14px] font-medium text-slate-600">No items found</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">Try selecting "All" or adjusting search query.</p>
                    </td>
                  </tr>
                ) : (
                  catalogItems.map((it) => (
                    <tr 
                      key={it.id} 
                      onClick={() => {
                        setSelectedItemId(it.id);
                        setViewMode('profile');
                      }}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors cursor-pointer group",
                        selectedItemId === it.id && "bg-[#127670]/5"
                      )}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#127670] group-hover:underline">
                        {it.itemCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {it.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {it.genericName || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {it.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {it.totalOnHandFormatted} <span className="text-[11px] font-normal text-slate-500">{it.uom}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span className={cn(
                          it.coverDays < 15 ? "text-rose-600 font-bold" : "text-slate-700"
                        )}>
                          {it.coverDays} d
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {it.reorderLevel.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {it.lastRateFormatted}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", it.statusBadge)}>
                          {it.reorderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemId(it.id);
                            setViewMode('profile');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#127670] bg-[#127670]/10 hover:bg-[#127670]/20 rounded-md transition-colors cursor-pointer"
                        >
                          View Details &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* VIEW MODE 2: Item Profile & Batches View */}
      {viewMode === 'profile' && (
        <>
          {loading && !itemDetail ? (
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
              <SkeletonDetailDrawer />
            </div>
          ) : itemDetail ? (
            <>
              {/* Item Header Card */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#127670]/10 flex items-center justify-center flex-shrink-0 text-[#127670] font-bold text-base sm:text-lg">
                      {itemDetail.category === 'Pharmacy' ? 'Rx' : 
                       itemDetail.category === 'Consumables' ? 'Sg' :
                       itemDetail.category === 'Implants' ? 'Im' : 'Lab'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                          {itemDetail.name}
                        </h1>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-[#D94432] bg-[#D94432]/10 px-2 py-0.5 rounded cursor-default">
                          {itemDetail.classVital}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded cursor-default">
                          {itemDetail.scheduleType}
                        </span>
                        {itemDetail.isPatientChargeable && (
                          <span className="text-[10px] sm:text-[11px] font-semibold text-[#127670] bg-[#127670]/10 px-2 py-0.5 rounded cursor-default">
                            Patient chargeable
                          </span>
                        )}
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded cursor-default">
                          {itemDetail.category}
                        </span>
                      </div>
                      <p className="text-[12px] sm:text-[13px] text-slate-500 leading-relaxed">
                        Item code <span className="font-semibold text-slate-700">{itemDetail.itemCode}</span> &middot; Generic: <span className="font-medium text-slate-700">{itemDetail.genericName}</span> &middot; Form: {itemDetail.form} &middot; HSN {itemDetail.hsnCode} &middot; GST {itemDetail.gstRate}% &middot; UoM: {itemDetail.uom} &middot; Formulary ✓
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
                    <button 
                      type="button"
                      onClick={() => setTransferModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer gap-1.5"
                    >
                      <ArrowRightLeft size={14} className="text-slate-500" /> Transfer
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAdjustModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer gap-1.5"
                    >
                      <SlidersHorizontal size={14} className="text-slate-500" /> Adjust Stock
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPrModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-[#125F5C] text-white rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm cursor-pointer whitespace-nowrap gap-1.5"
                    >
                      <ShoppingCart size={14} /> Raise PR
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Cards (Live metrics from PostgreSQL) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
                {itemDetail.kpis.map((kpi, i) => (
                  <div 
                    key={kpi.id || i} 
                    className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-[11px] sm:text-[13px] text-slate-500 font-medium mb-1 truncate">{kpi.label}</h3>
                    <p className={cn(
                      "text-lg sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1 truncate",
                      kpi.alert ? "text-[#D94432]" : "text-slate-800"
                    )}>
                      {kpi.value}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Main Content Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column (Batches Table) */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[14px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Package size={16} className="text-[#127670]" /> Batches — FEFO order (first expiry, first out)
                      </h2>
                      <span className="text-[12px] text-slate-500 font-medium">
                        {itemDetail.batches.length} active batches
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px] text-left whitespace-nowrap">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                            <th className="py-2.5 px-3 font-medium">Batch</th>
                            <th className="py-2.5 px-3 font-medium">Store / bin</th>
                            <th className="py-2.5 px-3 font-medium text-right">Qty</th>
                            <th className="py-2.5 px-3 font-medium">Expiry</th>
                            <th className="py-2.5 px-3 font-medium text-right">MRP</th>
                            <th className="py-2.5 px-3 font-medium">Vendor</th>
                            <th className="py-2.5 px-3 font-medium text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {itemDetail.batches.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-800 font-mono text-[12px]">
                                {row.batch}
                              </td>
                              <td className="py-3 px-3 text-slate-600 font-medium">
                                {row.store}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-800">
                                {row.qty}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                {row.expiry}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-600 font-medium">
                                {row.mrp}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                {row.vendor}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap", row.statusClass)}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {itemDetail.suggestion && (
                      <div className="mt-4 text-[13px] text-slate-600 bg-amber-50/70 p-3 rounded-lg border border-amber-200/60 flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-slate-700">
                          {itemDetail.suggestion}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  {/* Consumption Chart */}
                  <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
                    <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Consumption — 12 weeks</h2>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={itemDetail.consumptionData}>
                          <RechartsTooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                          />
                          <Bar dataKey="value" fill="#99C9C4" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-3 font-medium">
                      {itemDetail.trend}
                    </p>
                  </div>

                  {/* Vendors & Rates */}
                  <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
                    <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Approved vendors & rates</h2>
                    <div className="space-y-3 text-[13px]">
                      {itemDetail.vendors.map((vnd, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-slate-600">{vnd.name}</span>
                          <span className={cn(
                            "font-semibold",
                            vnd.isAlert ? "text-[#D94432]" : "text-slate-800"
                          )}>
                            {vnd.rate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Movement log */}
                  <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
                    <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Movement log</h2>
                    <div className="space-y-3 text-[12px] text-slate-600 leading-relaxed">
                      {itemDetail.movementLog.map((log, idx) => (
                        <p key={idx}>{log}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
