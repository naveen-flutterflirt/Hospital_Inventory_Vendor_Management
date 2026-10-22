export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && !process.env.NEXT_PUBLIC_API_URL?.includes(hostname)) {
      return `https://${hostname}/api/v1`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const AUTH_TOKEN_KEY = 'hospital_crm_token';
export const AUTH_USER_KEY = 'hospital_crm_auth_user';

export interface LoginPayload {
  email: string;
  password: string;
  branch?: string;
  rememberMe?: boolean;
}

export interface ApiUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch: string;
  avatar_initials?: string;
  badge?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export const api = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  },

  /**
   * Send HTTP request with automatic Bearer token injection
   */
  async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({
        success: response.ok,
        message: response.statusText,
      }));

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Request failed with status ${response.status}`,
          errors: data.errors,
        };
      }

      return data;
    } catch (err: unknown) {
      const isFetchError = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
      if (isFetchError) {
        console.warn(`[Hospital CRM API]: Backend server is unreachable at ${url}. Start it by running 'npm run dev' inside 'crm-backend' directory on port 5001.`);
      } else {
        console.warn(`[API Network Error] ${url}:`, err);
      }
      return {
        success: false,
        message: 'Backend server is offline or unreachable on port 5001. Please ensure "crm-backend" is running.',
      };
    }
  },

  // Auth endpoints
  async login(payload: LoginPayload) {
    return this.request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe() {
    return this.request<ApiUser>('/auth/me', {
      method: 'GET',
    });
  },

  async logout() {
    return this.request<null>('/auth/logout', {
      method: 'POST',
    });
  },

  // Settings Endpoints
  settings: {
    async getProfile() {
      return api.request<UserProfileData>('/settings/profile', { method: 'GET' });
    },
    async updateProfile(data: { name: string; phone?: string | null }) {
      return api.request<UserProfileData>('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async changePassword(data: { current_password: string; new_password: string }) {
      return api.request<null>('/settings/security/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async toggle2FA(enabled: boolean) {
      return api.request<{ two_factor_enabled: boolean }>('/settings/security/2fa/toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
    },
    async getSessions() {
      return api.request<UserSession[]>('/settings/security/sessions', { method: 'GET' });
    },
    async revokeSession(id: number) {
      return api.request<null>(`/settings/security/sessions/${id}`, { method: 'DELETE' });
    },
    async getWorkflows() {
      return api.request<ApprovalWorkflow[]>('/settings/workflows', { method: 'GET' });
    },
    async updateWorkflows(workflows: Array<{ id: number; threshold_amount: number; auto_approve_below: boolean }>) {
      return api.request<ApprovalWorkflow[]>('/settings/workflows', {
        method: 'PUT',
        body: JSON.stringify({ workflows }),
      });
    },
    async getNotifications() {
      return api.request<NotificationPreferences>('/settings/notifications', { method: 'GET' });
    },
    async updateNotifications(data: Partial<NotificationPreferences>) {
      return api.request<NotificationPreferences>('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async getIntegrations() {
      return api.request<SystemIntegration[]>('/settings/integrations', { method: 'GET' });
    },
    async updateIntegrations(integrations: Array<{ integration_key: string; endpoint_url?: string | null; is_enabled: boolean }>) {
      return api.request<SystemIntegration[]>('/settings/integrations', {
        method: 'PUT',
        body: JSON.stringify({ integrations }),
      });
    },
    async testIntegration(integration_key: string) {
      return api.request<{
        integration_key: string;
        name: string;
        status: string;
        latency_ms: number;
        timestamp: string;
      }>('/settings/integrations/test', {
        method: 'POST',
        body: JSON.stringify({ integration_key }),
      });
    },
  },

  // Reports & Analytics Endpoints
  reports: {
    async getKpis() {
      return api.request<ReportKpisResponse>('/reports/kpis', { method: 'GET' });
    },
    async getTrends() {
      return api.request<ReportTrendsResponse>('/reports/trends', { method: 'GET' });
    },
    async getGeneratedReports() {
      return api.request<GeneratedReportItem[]>('/reports/generated', { method: 'GET' });
    },
    async generateCustomReport(data: {
      dataSource: string;
      startDate: string;
      endDate: string;
      format: 'csv' | 'pdf';
    }) {
      return api.request<GeneratedReportItem>('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async scheduleReport(data: {
      reportType: string;
      frequency: 'Daily' | 'Weekly' | 'Monthly';
      deliveryTime: string;
      recipients: string;
      attachPdf: boolean;
    }) {
      return api.request<ScheduledReportItem>('/reports/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getDownloadUrl(reportCode: string) {
      return `${API_BASE_URL}/reports/download/${reportCode}`;
    },
  },

  // Notifications Endpoints
  notifications: {
    async getNotifications() {
      return api.request<{ notifications: NotificationItem[]; unread_count: number }>('/notifications', {
        method: 'GET',
      });
    },
    async getUnreadCount() {
      return api.request<{ unread_count: number }>('/notifications/unread-count', {
        method: 'GET',
      });
    },
    async markAsRead(id: number) {
      return api.request<{ notification: { id: number; is_read: boolean }; unread_count: number }>(
        `/notifications/${id}/read`,
        { method: 'PATCH' }
      );
    },
    async markAllRead() {
      return api.request<{ updated_count: number; unread_count: number }>('/notifications/mark-all-read', {
        method: 'PATCH',
      });
    },
  },

  // Assets & AMC Endpoints
  assets: {
    async getKpis() {
      return api.request<AssetKpisResponse>('/assets/kpis', { method: 'GET' });
    },
    async getAssets(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      department?: string;
    }) {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params?.department && params.department !== 'All') searchParams.set('department', params.department);

      const qs = searchParams.toString();
      return api.request<AssetListResponse>(`/assets${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async searchSuggestions(query: string) {
      return api.request<AssetItem[]>(`/assets/search-suggestions?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });
    },
    async registerAsset(data: {
      name: string;
      serialNo: string;
      department: string;
      vendorName: string;
      purchaseCost: number;
      amcExpiryDate?: string;
      status?: 'Active' | 'In Maintenance' | 'Out of Service';
    }) {
      return api.request<AssetItem>('/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async logMaintenance(data: {
      assetId: number | string;
      maintenanceType: 'preventive' | 'breakdown' | 'calibration' | 'safety_audit';
      serviceDate: string;
      cost?: number;
      issueDescription?: string;
      technicianName?: string;
      vendorName?: string;
    }) {
      return api.request<{
        ticket: {
          id: number;
          ticket_number: string;
          maintenance_type: string;
          service_date: string;
          status: string;
          cost: number | string;
        };
        asset: {
          id: number;
          asset_tag: string;
          name: string;
          status: string;
        };
      }>('/assets/maintenance', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Invoices & Payments Endpoints
  invoices: {
    async getKpis() {
      return api.request<InvoiceKpisResponse>('/invoices/kpis', { method: 'GET' });
    },
    async getInvoices(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }) {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const qs = searchParams.toString();
      return api.request<InvoiceListResponse>(`/invoices${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getLookups() {
      return api.request<InvoiceLookupResponse>('/invoices/lookups', { method: 'GET' });
    },
    async getPendingSettlement(search?: string) {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.request<PendingSettlementItem[]>(`/invoices/pending-settlement${qs}`, { method: 'GET' });
    },
    async logInvoice(data: {
      vendorName: string;
      poRef: string;
      amount: number;
      dueDate: string;
      notes?: string;
      documentUrl?: string;
    }) {
      return api.request<{
        invoice: {
          id: number;
          invoice_number: string;
          vendor: string;
          po_ref: string;
          amount: number;
          status: string;
          three_way_match: string;
        };
      }>('/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async settlePayment(data: {
      invoiceId: number | string;
      paymentMethod: string;
      paymentRef: string;
      paymentDate: string;
      notes?: string;
    }) {
      return api.request<{
        payment: {
          transaction_ref: string;
          invoice_number: string;
          amount: number;
          amount_formatted: string;
          vendor_name: string;
          payment_method: string;
          payment_ref: string;
          payment_date: string;
          status: string;
        };
      }>('/invoices/settle', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Vendor Management Endpoints
  vendors: {
    async getKpis() {
      return api.request<VendorKpisResponse>('/vendors/kpis', { method: 'GET' });
    },
    async getVendors(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      category?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }) {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params?.category && params.category !== 'All') searchParams.set('category', params.category);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const qs = searchParams.toString();
      return api.request<VendorListResponse>(`/vendors${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getVendorById(id: number | string) {
      return api.request<{ vendor: VendorItem; recent_pos: any[] }>(`/vendors/${id}`, { method: 'GET' });
    },
    async createVendor(data: {
      name: string;
      category: string;
      gstin: string;
      contactEmail?: string;
      phone?: string;
      paymentTerms?: string;
      notes?: string;
    }) {
      return api.request<{ vendor: VendorItem }>('/vendors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updateVendorStatus(id: number | string, status: string, reason?: string) {
      return api.request<{ vendor: VendorItem }>(`/vendors/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
    },
  },

  // Issues & Transfers Endpoints
  transfers: {
    async getKpis() {
      return api.request<TransferKpisResponse>('/transfers/kpis', { method: 'GET' });
    },
    async getTransfers(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }) {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params?.type && params.type !== 'All') searchParams.set('type', params.type);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const qs = searchParams.toString();
      return api.request<TransferListResponse>(`/transfers${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getLookups() {
      return api.request<TransferLookupsResponse>('/transfers/lookups', { method: 'GET' });
    },
    async getTransferById(id: number | string) {
      return api.request<{ transfer: StockTransferItem; items: any[] }>(`/transfers/${id}`, { method: 'GET' });
    },
    async createTransfer(data: {
      fromStore: string;
      toStore: string;
      items: Array<{ itemId?: number; itemCode?: string; itemName: string; quantity: number; batchNo?: string; uom?: string }>;
      notes?: string;
    }) {
      return api.request<{ transfer: StockTransferItem }>('/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async createIssue(data: {
      issueType: 'ward' | 'patient';
      target: string;
      fromStore?: string;
      items: Array<{ itemId?: number; itemCode?: string; itemName: string; quantity: number; batchNo?: string; uom?: string }>;
      notes?: string;
    }) {
      return api.request<{ transfer: StockTransferItem }>('/transfers/issue', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updateStatus(id: number | string, status: string, notes?: string) {
      return api.request<{ transfer: StockTransferItem }>(`/transfers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
  },

  // Goods Receipt & Quality Control (GRN & QC) Endpoints
  grn: {
    async getKpis() {
      return api.request<GrnKpisResponse>('/grn/kpis', { method: 'GET' });
    },
    async getGRNs(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }) {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.search) sp.set('search', params.search);
      if (params?.status && params.status !== 'All') sp.set('status', params.status);
      if (params?.sortBy) sp.set('sortBy', params.sortBy);
      if (params?.sortOrder) sp.set('sortOrder', params.sortOrder);

      const qs = sp.toString();
      return api.request<GrnListResponse>(`/grn${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getLookups() {
      return api.request<GrnLookupsResponse>('/grn/lookups', { method: 'GET' });
    },
    async getGrnById(id: number | string) {
      return api.request<GrnDetail>(`/grn/${id}`, { method: 'GET' });
    },
    async scanDelivery(data: { barcode: string; poRef?: string; vendorId?: number; invoiceNo?: string; temperature?: number }) {
      return api.request<{
        scanned: { rawBarcode: string; gtin: string; batchNo: string; expiryDate: string; serialNo: string };
        grnId: number;
        grnNumber: string;
        status: string;
      }>('/grn/scan', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async createGrn(data: {
      poRef: string;
      vendorId: number;
      invoiceNo?: string;
      temperatureCelsius?: number;
      shortageNotes?: string;
      inspector?: string;
      items: Array<{
        itemId?: number;
        itemCode: string;
        itemName: string;
        batchNo: string;
        expiryDate: string;
        orderedQuantity: number;
        receivedQuantity: number;
        unitPrice?: number;
        uom?: string;
      }>;
    }) {
      return api.request<any>('/grn', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async processQc(id: number | string, data: {
      decision: 'Passed' | 'Partial' | 'Rejected';
      inspector: string;
      qcNotes?: string;
      debitNoteRef?: string;
      itemDecisions?: Array<{
        id: number;
        acceptedQuantity: number;
        rejectedQuantity: number;
        qcStatus?: string;
      }>;
    }) {
      return api.request<{
        grnId: number;
        status: string;
        inspector: string;
        debitNoteRef?: string | null;
        qcNotes?: string;
      }>(`/grn/${id}/qc`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Purchase Orders (PO) Endpoints
  purchaseOrders: {
    async getKpis() {
      return api.request<PoKpisResponse>('/purchase-orders/kpis', { method: 'GET' });
    },
    async getPurchaseOrders(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }) {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.search) sp.set('search', params.search);
      if (params?.status && params.status !== 'All') sp.set('status', params.status);
      if (params?.type && params.type !== 'All') sp.set('type', params.type);
      if (params?.sortBy) sp.set('sortBy', params.sortBy);
      if (params?.sortOrder) sp.set('sortOrder', params.sortOrder);

      const qs = sp.toString();
      return api.request<PoListResponse>(`/purchase-orders${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getLookups() {
      return api.request<PoLookupsResponse>('/purchase-orders/lookups', { method: 'GET' });
    },
    async getPoById(id: number | string) {
      return api.request<PoDetail>(`/purchase-orders/${id}`, { method: 'GET' });
    },
    async createPurchaseOrder(data: {
      vendorId: number;
      poType: string;
      paymentTerms?: string;
      dueDate?: string;
      expectedDeliveryDate?: string;
      notes?: string;
      shippingAddress?: string;
      billingAddress?: string;
      items: Array<{
        itemId?: number;
        itemCode: string;
        itemName: string;
        quantity: number;
        unitPrice: number;
        taxPercent?: number;
        uom?: string;
      }>;
    }) {
      return api.request<{ poNumber: string; id: number; status: string; totalValue: number }>('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updatePoStatus(id: number | string, status: string, notes?: string, approvedBy?: string) {
      return api.request<{ poNumber: string; status: string; statusClass: string; approvedBy?: string }>(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, approvedBy }),
      });
    },
  },

  // RFQ & Quotes Endpoints
  rfqQuotes: {
    async getRfqs() {
      return api.request<RfqSummaryItem[]>('/rfq-quotes', { method: 'GET' });
    },
    async getRfqComparison(id: string | number) {
      return api.request<RfqComparisonResponse>(`/rfq-quotes/${id}`, { method: 'GET' });
    },
    async negotiate(id: string | number, data: {
      vendorId: number;
      message?: string;
      targetRates?: Array<{ rfqItemId: number; targetRate: number }>;
    }) {
      return api.request<{ rfqNumber: string; vendorId: number; vendorName: string; status: string }>(`/rfq-quotes/${id}/negotiate`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async awardAndCreatePo(id: string | number, data: {
      vendorId: number;
      paymentTerms?: string;
      notes?: string;
    }) {
      return api.request<{
        rfqNumber: string;
        poNumber: string;
        poId: number;
        awardedVendor: string;
        totalAmount: number;
        message: string;
      }>(`/rfq-quotes/${id}/award`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async getConfig() {
      return api.request<RfqConfigResponse>('/rfq-quotes/config', { method: 'GET' });
    },
  },

  // Purchase Requests Endpoints
  purchaseRequests: {
    async getKpis() {
      return api.request<PrKpiItem[]>('/purchase-requests/kpis', { method: 'GET' });
    },
    async getLookups() {
      return api.request<PrLookups>('/purchase-requests/lookups', { method: 'GET' });
    },
    async getAll(params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      department?: string;
      source?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {}) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params.department && params.department !== 'All') searchParams.set('department', params.department);
      if (params.source && params.source !== 'All') searchParams.set('source', params.source);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const qs = searchParams.toString();
      return api.request<PrListResponse>(`/purchase-requests${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getById(id: number | string) {
      return api.request<PrDetail>(`/purchase-requests/${id}`, { method: 'GET' });
    },
    async create(data: {
      department: string;
      purchaseType?: string;
      priority?: string;
      source?: string;
      remarks?: string;
      items: Array<{
        itemId?: number;
        itemName: string;
        itemCode?: string;
        quantity: number;
        unitRate: number;
        uom?: string;
      }>;
    }) {
      return api.request<{ id: number; prNumber: string; department: string; status: string; estimatedValue: number }>('/purchase-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updateStatus(id: number | string, data: {
      status: 'Pending L1' | 'Pending CFO' | 'Approved' | 'Rejected';
      approvedBy?: string;
      rejectionReason?: string;
      remarks?: string;
    }) {
      return api.request<PrItem>(`/purchase-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async convert(id: number | string, targetType: 'PO' | 'RFQ') {
      return api.request<{ poNumber?: string; rfqNumber?: string; link: string }>(`/purchase-requests/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ targetType }),
      });
    },
  },

  // Indents (Internal Requisitions) Endpoints
  indents: {
    async getKpis() {
      return api.request<IndentKpiItem[]>('/indents/kpis', { method: 'GET' });
    },
    async getLookups() {
      return api.request<IndentLookups>('/indents/lookups', { method: 'GET' });
    },
    async getAll(params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      department?: string;
      store?: string;
      priority?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {}) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params.department && params.department !== 'All') searchParams.set('department', params.department);
      if (params.store && params.store !== 'All') searchParams.set('store', params.store);
      if (params.priority && params.priority !== 'All') searchParams.set('priority', params.priority);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const qs = searchParams.toString();
      return api.request<IndentListResponse>(`/indents${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getById(id: number | string) {
      return api.request<IndentDetail>(`/indents/${id}`, { method: 'GET' });
    },
    async create(data: {
      requestingDept: string;
      toStoreName?: string;
      priority?: 'Routine' | 'Urgent' | 'Emergency' | string;
      notes?: string;
      items: Array<{
        itemId?: number | null;
        itemName: string;
        itemCode?: string;
        quantity: number;
        uom?: string;
      }>;
    }) {
      return api.request<{ id: number; indentNumber: string; dept: string; toStore: string; status: string; itemsCount: number }>('/indents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updateStatus(id: number | string, data: {
      status: 'Pending' | 'Processing' | 'Partially Issued' | 'Completed' | 'Cancelled' | string;
      fulfilledBy?: string;
      items?: Array<{
        id: number;
        quantityIssued: number;
        status?: string;
      }>;
    }) {
      return api.request<{ id: number; indentNumber: string; status: string; fulfilledBy?: string }>(`/indents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async escalate(id: number | string) {
      return api.request<{ prId: number; prNumber: string; indentNumber: string; estimatedValue: number; alreadyEscalated?: boolean }>(`/indents/${id}/escalate`, {
        method: 'POST',
      });
    },
  },

  // Items & Formulary Endpoints
  items: {
    async getLookups() {
      return api.request<ItemLookupsResponse>('/items/lookups', { method: 'GET' });
    },
    async getAll(params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      filter?: string;
    } = {}) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.category && params.category !== 'All') searchParams.set('category', params.category);
      if (params.filter) searchParams.set('filter', params.filter);

      const qs = searchParams.toString();
      return api.request<ItemListResponse>(`/items${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    async getById(id: number | string) {
      return api.request<ItemDetailResponse>(`/items/${id}`, { method: 'GET' });
    },
    async create(data: {
      name: string;
      itemCode?: string;
      genericName?: string;
      category?: string;
      form?: string;
      hsnCode?: string;
      gstRate?: number;
      uom?: string;
      classVital?: string;
      scheduleType?: string;
      isPatientChargeable?: boolean;
      reorderLevel?: number;
      reorderQty?: number;
      lastRate?: number;
      rateContractExpiry?: string;
      initialStock?: number;
      initialBatchNumber?: string;
      binLocation?: string;
    }) {
      return api.request<{ id: number; itemCode: string; name: string; category: string }>('/items', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async adjustStock(id: number | string, data: {
      batchId?: number;
      quantityDelta: number;
      reason: string;
      binLocation?: string;
    }) {
      return api.request<{ itemId: number; itemCode: string; newOnHand: number; delta: number; reason: string }>(`/items/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Dashboard Overview Endpoints
  dashboard: {
    async getOverview() {
      return api.request<DashboardOverviewResponse>('/dashboard/overview', { method: 'GET' });
    },
    async autoCreateReorderPr() {
      return api.request<{ created: boolean; prNumber?: string; prId?: number; itemsCount?: number; totalValue?: number }>('/dashboard/auto-create-reorder-pr', {
        method: 'POST',
      });
    },
  },

  // Stores Endpoints
  stores: {
    async getStores() {
      return api.request<StoreItem[]>('/stores', { method: 'GET' });
    },
  },

  // Universal Barcode / Scanner Endpoints
  barcode: {
    async lookup(query: string, storeId?: number | null) {
      return api.request<BarcodeLookupResult>('/barcode/lookup', {
        method: 'POST',
        body: JSON.stringify({ query, storeId }),
      });
    },
  },
};

export interface AssetItem {
  id: number;
  asset_tag: string;
  name: string;
  serial_no: string;
  department: string;
  vendor_name: string;
  amc_expiry: string;
  amc_alert: boolean;
  status: 'Active' | 'In Maintenance' | 'Out of Service' | string;
  purchase_cost: number | string;
  amc_end_date?: string | null;
  created_at?: string;
}

export interface AssetPagination {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  showingStart: number;
  showingEnd: number;
}

export interface AssetListResponse {
  items: AssetItem[];
  pagination: AssetPagination;
}

export interface AssetKpiItem {
  label: string;
  value: string;
  sub: string;
  raw: number;
  alert?: boolean;
}

export interface AssetKpisResponse {
  active_assets: AssetKpiItem;
  amc_expiring_soon: AssetKpiItem;
  open_maintenance: AssetKpiItem;
  asset_value: AssetKpiItem;
}

export interface NotificationItem {
  id: number;
  user_id?: number | null;
  title: string;
  desc: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  category?: 'inventory' | 'procurement' | 'quality' | 'telemetry' | 'system';
  link?: string | null;
  read: boolean;
  time: string;
  created_at?: string;
  read_at?: string | null;
}

// Types for Reports & Analytics
export interface ReportKpisResponse {
  total_spend: { label: string; value: string; sub: string; raw: number };
  pos_generated: { label: string; value: string; sub: string; raw: number };
  inventory_value: { label: string; value: string; sub: string; raw: number };
  active_vendors: { label: string; value: string; sub: string; raw: number };
}

export interface ReportTrendsResponse {
  data: Array<{
    month: string;
    spend: number;
    po: number;
    spend_formatted: string;
    po_formatted: string;
  }>;
  max_spend: number;
  max_po: number;
}

export interface GeneratedReportItem {
  id: number;
  report_code: string;
  name: string;
  type: string;
  size: string;
  date: string;
  download_url: string;
  format?: string;
  status?: string;
  download_count?: number;
}

export interface ScheduledReportItem {
  id: number;
  template_name: string;
  frequency: string;
  delivery_time: string;
  recipients: string[];
  format: string;
  next_run_at: string;
}

// Types for Settings
export interface UserProfileData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  department: string;
  branch: string;
  avatar_initials: string;
  avatar_url: string | null;
  badge: string;
  two_factor_enabled: boolean;
  created_at: string;
}

export interface UserSession {
  id: number;
  device_info: string;
  ip_address: string;
  is_current: boolean;
  last_active: string;
  created_at: string;
}

export interface ApprovalWorkflow {
  id: number;
  level_name: string;
  approver_role: string;
  threshold_amount: number | string;
  auto_approve_below: boolean;
  requires_quotations: number;
  is_active: boolean;
}

export interface NotificationPreferences {
  stockout_email: boolean;
  stockout_sms: boolean;
  stockout_in_app: boolean;
  expiry_30_days: boolean;
  expiry_60_days: boolean;
  expiry_90_days: boolean;
  grn_discrepancy_alert: boolean;
  po_approval_required: boolean;
  weekly_digest_email: boolean;
}

export interface SystemIntegration {
  id: number;
  integration_key: string;
  name: string;
  endpoint_url: string | null;
  secret_key_masked: string;
  is_enabled: boolean;
  last_sync_status: string;
  last_sync_at: string;
}

// Types for Invoices & Payments
export interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor: string;
  vendor_id?: number | null;
  po_ref: string;
  amount: number;
  amount_formatted: string;
  due_date: string;
  due_status: string;
  status: 'Pending' | 'Processing' | 'Overdue' | 'Paid' | 'Pending GRN' | string;
  status_class: string;
  three_way_match: string;
  payment_ref?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export interface InvoicePagination {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  showingStart: number;
  showingEnd: number;
}

export interface InvoiceListResponse {
  items: InvoiceItem[];
  pagination: InvoicePagination;
}

export interface InvoiceKpiItem {
  label: string;
  value: string;
  sub: string;
  raw: number;
  alert?: boolean;
}

export interface InvoiceKpisResponse {
  total_outstanding: InvoiceKpiItem;
  overdue_payments: InvoiceKpiItem;
  awaiting_grn_match: InvoiceKpiItem;
  processed_today: InvoiceKpiItem;
}

export interface InvoiceLookupVendor {
  id: number;
  name: string;
  vendor_code: string;
  category: string;
  payment_terms: string;
}

export interface InvoiceLookupPo {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor_name: string;
  total_amount: number;
  status: string;
}

export interface InvoiceLookupResponse {
  vendors: InvoiceLookupVendor[];
  purchase_orders: InvoiceLookupPo[];
}

export interface PendingSettlementItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  amount_formatted: string;
  status: string;
  due_status: string;
}

// Types for Vendor Management
export interface VendorItem {
  id: number;
  vendor_code: string;
  name: string;
  category: string;
  contact: string;
  contact_email: string;
  phone?: string | null;
  gstin?: string | null;
  pan?: string | null;
  score: number | null;
  grade: 'A' | 'B' | 'C' | 'Unrated' | string;
  status: 'Active' | 'Onboarding' | 'Suspended' | string;
  status_class: string;
  grade_class: string;
  payment_terms: string;
  created_at?: string;
}

export interface VendorPagination {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  showingStart: number;
  showingEnd: number;
}

export interface VendorListResponse {
  items: VendorItem[];
  pagination: VendorPagination;
}

export interface VendorKpiItem {
  label: string;
  value: string;
  sub: string;
  raw: number;
  alert?: boolean;
}

export interface VendorKpisResponse {
  active_vendors: VendorKpiItem;
  pending_onboarding: VendorKpiItem;
  top_performers: VendorKpiItem;
  suspended: VendorKpiItem;
}

// Types for Issues & Stock Transfers
export interface StockTransferItem {
  id: number;
  transfer_number: string;
  type: 'Ward Issue' | 'Patient Issue' | 'Store Transfer' | 'Ward Return' | string;
  from: string;
  to: string;
  lines: number;
  date: string;
  status: 'Completed' | 'In Transit' | 'Pending' | 'Cancelled' | string;
  status_class: string;
  issued_by?: string;
  patient_id?: string | null;
  patient_name?: string | null;
  ward_name?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface TransferPagination {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  showingStart: number;
  showingEnd: number;
}

export interface TransferListResponse {
  items: StockTransferItem[];
  pagination: TransferPagination;
}

export interface TransferKpiItem {
  label: string;
  value: string;
  sub: string;
  raw: number;
  alert?: boolean;
}

export interface TransferKpisResponse {
  pending_fulfillment: TransferKpiItem;
  issued_today: TransferKpiItem;
  store_transfers: TransferKpiItem;
  ward_returns: TransferKpiItem;
}

export interface TransferLookupsResponse {
  stores: Array<{ id: number; code: string; name: string; store_type: string; branch: string }>;
  wards: string[];
  patients: Array<{ id: string; name: string; ward: string }>;
  items: Array<{ id: number; item_code: string; name: string; stock: number; uom: string; category: string }>;
}

// Types for Goods Receipt & Quality Control (GRN & QC)
export interface GrnItem {
  id: number;
  grnNumber: string;
  poRef: string;
  vendor: string;
  vendorId?: number;
  linesCount: number;
  receivedDate: string;
  status: 'Expected' | 'Pending QC' | 'QC Passed' | 'Partial Reject' | 'QC Failed' | string;
  statusClass: string;
  shortageNotes: string;
  inspector: string;
  invoiceNo?: string;
  batchNumber?: string;
  expiryDate?: string;
  temperatureCelsius?: number;
  qcNotes?: string;
  debitNoteRef?: string | null;
}

export interface GrnLineItem {
  id: number;
  itemId?: number;
  itemCode: string;
  itemName: string;
  batchNo: string;
  expiryDate: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  uom: string;
  qcStatus: string;
}

export interface GrnDetail extends GrnItem {
  vendorCode?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  items: GrnLineItem[];
}

export interface GrnPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GrnListResponse {
  grns: GrnItem[];
  pagination: GrnPagination;
}

export interface GrnKpisResponse {
  expectedToday: number;
  pendingQc: number;
  qcPassed: number;
  returnsRejects: number;
}

export interface GrnLookupsResponse {
  vendors: Array<{ id: number; name: string; vendor_code: string }>;
  purchaseOrders: Array<{ id: number; po_number: string; vendor_id: number; total_amount: number; status: string }>;
  items: Array<{ id: number; item_code: string; name: string; uom: string; unit_price: number }>;
}

export interface PoItemSummary {
  id: string;
  dbId: number;
  poNumber: string;
  vendor: string;
  vendorId: number;
  vendorCode?: string;
  vendorEmail?: string;
  type: string;
  items: number;
  value: string;
  rawValue: number;
  due: string;
  status: string;
  statusClass: string;
  paymentTerms: string;
  approvedBy?: string | null;
  createdAt: string;
}

export interface PoLineItem {
  id: number;
  itemId?: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  lineTotal: number;
  uom: string;
}

export interface PoDetail {
  id: string;
  dbId: number;
  poNumber: string;
  vendor: string;
  vendorId: number;
  vendorCode?: string;
  vendorCategory?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorAddress?: string;
  vendorGstin?: string;
  type: string;
  itemsCount: number;
  value: string;
  rawValue: number;
  due: string;
  status: string;
  statusClass: string;
  paymentTerms: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  items: PoLineItem[];
}

export interface PoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PoListResponse {
  orders: PoItemSummary[];
  pagination: PoPagination;
}

export interface PoKpiItem {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  raw: number;
}

export interface PoKpisResponse {
  open_pos: PoKpiItem;
  overdue_delivery: PoKpiItem;
  received_today: PoKpiItem;
  awaiting_approval: PoKpiItem;
}

export interface PoLookupsResponse {
  vendors: Array<{ id: number; name: string; vendor_code: string; category?: string; payment_terms?: string }>;
  items: Array<{ id: number; item_code: string; name: string; uom: string; unit_price: number; category?: string }>;
  types: string[];
}

export interface RfqSummaryItem {
  id: number;
  rfq_number: string;
  title: string;
  category: string;
  department: string;
  status: string;
  invited_count: number;
  responded_count: number;
  closes_at_label: string;
  closing_date: string;
  benchmark_total: string;
  savings_amount: string;
  savings_percent: string;
  awarded_vendor_id: number | null;
  awarded_po_id: number | null;
  created_at: string;
}

export interface RfqHeader {
  id: number;
  rfqNumber: string;
  title: string;
  category: string;
  department: string;
  status: string;
  invitedCount: number;
  respondedCount: number;
  closesAtLabel: string;
  closingDate: string;
  benchmarkTotal: number;
  benchmarkFormatted: string;
  savingsAmount: number;
  savingsPercent: number;
  savingsFormatted: string;
  awardedVendorId?: number | null;
  awardedPoId?: number | null;
  awardedAt?: string | null;
  remarks?: string;
}

export interface RfqVendorQuote {
  quoteId: number;
  vendorId: number;
  vendorName: string;
  vendorCode: string;
  quoteRef: string;
  creditTerms: string;
  deliveryLead: string;
  totalQuotedAmount: number;
  isPartial: boolean;
  vendorScore: string;
  isNewVendor: boolean;
  isAwarded: boolean;
  status: string;
}

export interface RfqItemQuoteDetail {
  quoteItemId?: number;
  quoteId?: number;
  unitPrice: number | null;
  totalPrice: number | null;
  isL1: boolean;
  isNoBid: boolean;
  displayPrice: string;
}

export interface RfqComparisonItem {
  id: number;
  itemCode: string;
  itemName: string;
  uom: string;
  quantity: number;
  lastPrice: number;
  lastPriceFormatted: string;
  targetPrice?: number | null;
  recommendedVendorId?: number;
  recommendedVendorName?: string;
  isNewVendor?: boolean;
  quotes: Record<number, RfqItemQuoteDetail>;
}

export interface RfqVendorTotal {
  vendorId: number;
  vendorName: string;
  totalAmount: number;
  displayTotal: string;
  isPartial: boolean;
  creditTerms: string;
  deliveryLead: string;
  score: string;
  isNewVendor: boolean;
  status: string;
}

export interface RfqComparisonResponse {
  rfq: RfqHeader;
  vendors: RfqVendorQuote[];
  items: RfqComparisonItem[];
  totals: {
    benchmarkTotal: number;
    benchmarkFormatted: string;
    vendorTotals: Record<number, RfqVendorTotal>;
    savingsFormatted: string;
  };
}

export interface ApprovalMatrixItem {
  id: number;
  po_value_tier: string;
  level_1: string;
  level_2: string | null;
  level_3: string | null;
  remarks?: string;
}

export interface PurchaseTypeItem {
  id: number;
  name: string;
  description: string;
}

export interface RfqConfigResponse {
  approvalMatrix: ApprovalMatrixItem[];
  purchaseTypes: PurchaseTypeItem[];
}

export interface PrKpiItem {
  id: string;
  label: string;
  value: string;
  sub: string;
  alert: boolean;
}

export interface PrLineItem {
  id: number;
  itemId?: number;
  itemName: string;
  itemCode?: string;
  quantity: number;
  uom: string;
  unitRate: number;
  totalAmount: number;
  totalAmountFormatted: string;
  stockOnHand?: number;
  category?: string;
}

export interface PrItem {
  id: number;
  prNumber: string;
  source: string;
  department: string;
  purchaseType: string;
  priority: string;
  itemsCount: number;
  estimatedValue: number;
  estimatedValueFormatted: string;
  status: 'Pending L1' | 'Pending CFO' | 'Approved' | 'Rejected' | string;
  statusClass: string;
  raisedBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  convertedToPo?: string | null;
  convertedToRfq?: string | null;
  remarks?: string;
  createdAt: string;
  age: string;
}

export interface PrDetail extends PrItem {
  items: PrLineItem[];
}

export interface PrLookups {
  departments: string[];
  purchaseTypes: string[];
  priorities: string[];
  sources: string[];
  statuses: string[];
  items: Array<{
    id: number;
    itemCode: string;
    name: string;
    category: string;
    uom: string;
    unitRate: number;
    stockOnHand: number;
  }>;
}

export interface PrListResponse {
  purchaseRequests: PrItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Indents Types
export interface IndentKpiItem {
  id: string;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}

export interface IndentLineItem {
  id: number;
  itemId?: number | null;
  itemName: string;
  itemCode: string;
  quantityRequested: number;
  quantityIssued: number;
  uom: string;
  status: string;
  category?: string;
  storeStock?: number;
}

export interface IndentItem {
  id: number;
  indentNumber: string;
  dept: string;
  toStore: string;
  items: number;
  priority: 'Routine' | 'Urgent' | 'Emergency' | string;
  status: 'Pending' | 'Processing' | 'Partially Issued' | 'Completed' | 'Cancelled' | string;
  statusClass: string;
  raisedBy: string;
  fulfilledBy?: string | null;
  fulfilledAt?: string | null;
  escalatedToPr?: string | null;
  notes?: string;
  time: string;
  createdAt: string;
}

export interface IndentDetail extends Omit<IndentItem, 'items'> {
  items: IndentLineItem[];
  itemsCount?: number;
}

export interface IndentLookups {
  departments: string[];
  stores: string[];
  priorities: string[];
  statuses: string[];
  items: Array<{
    id: number;
    itemCode: string;
    name: string;
    category: string;
    uom: string;
    stockOnHand: number;
    lastRate: number;
  }>;
}

export interface IndentListResponse {
  indents: IndentItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Items & Master Formulary Types
export interface ItemBatch {
  id: number;
  batch: string;
  store: string;
  qty: string;
  rawQty: number;
  expiry: string;
  mrp: string;
  purchaseRate: string;
  vendor: string;
  status: string;
  statusClass: string;
}

export interface ItemKpi {
  id: string;
  label: string;
  value: string;
  sub: string;
  raw?: number;
  alert?: boolean;
}

export interface ItemConsumptionWeek {
  week: string;
  value: number;
}

export interface ItemVendorRate {
  name: string;
  rate: string;
  isPrimary?: boolean;
  isAlert?: boolean;
}

export interface ItemDetailResponse {
  id: number;
  itemCode: string;
  name: string;
  genericName: string;
  category: string;
  form: string;
  hsnCode: string;
  gstRate: number;
  uom: string;
  classVital: string;
  scheduleType: string;
  isPatientChargeable: boolean;
  kpis: ItemKpi[];
  batches: ItemBatch[];
  consumptionData: ItemConsumptionWeek[];
  trend: string;
  vendors: ItemVendorRate[];
  movementLog: string[];
  suggestion?: string | null;
}

export interface FormularyItemSummary {
  id: number;
  itemCode: string;
  name: string;
  genericName: string;
  category: string;
  form: string;
  hsnCode: string;
  gstRate: number;
  uom: string;
  classVital: string;
  scheduleType: string;
  isPatientChargeable: boolean;
  totalOnHand: number;
  totalOnHandFormatted: string;
  avgDailyUse: number;
  coverDays: number;
  reorderLevel: number;
  reorderQty: number;
  lastRate: number;
  lastRateFormatted: string;
  rateContractExpiry: string;
  reorderStatus: string;
  statusBadge: string;
}

export interface ItemListResponse {
  items: FormularyItemSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ItemLookupsResponse {
  categories: string[];
  forms: string[];
  uoms: string[];
  classes: string[];
  schedules: string[];
  items: Array<{
    id: number;
    itemCode: string;
    name: string;
    genericName: string;
    category: string;
    totalOnHand: number;
    uom: string;
    lastRate: number;
  }>;
}

// Dashboard Overview Types
export interface DashboardTopStat {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  downTrend?: boolean;
  raw?: number;
}

export interface DashboardTopStats {
  stockValue: DashboardTopStat;
  daysOfStock: DashboardTopStat;
  belowReorder: DashboardTopStat;
  nearExpiry: DashboardTopStat;
  openPOs: DashboardTopStat;
  payablesDue: DashboardTopStat;
}

export interface DashboardCategorySpend {
  name: string;
  value: number;
  raw: number;
  fill: string;
}

export interface DashboardReorderAlert {
  id: number;
  item: string;
  code: string;
  store: string;
  onHand: number;
  cover: string;
  coverColor: string;
  reorderQty: number;
}

export interface DashboardExpiryBucket {
  name: string;
  value: number;
  fill: string;
}

export interface DashboardRecentPO {
  id: number;
  po: string;
  vendor: string;
  items: number;
  value: string;
  due: string;
  status: string;
  statusClass: string;
}

export interface DashboardPendingApproval {
  id: string;
  title: string;
  amount?: string;
  sub?: string;
  category?: string;
  priority?: string;
  isEmergency?: boolean;
  link: string;
}

export interface DashboardOverviewResponse {
  topStats: DashboardTopStats;
  categorySpend: DashboardCategorySpend[];
  reorderAlerts: DashboardReorderAlert[];
  expiryLadder: DashboardExpiryBucket[];
  eligibleReturnAmount: string;
  purchaseOrders: DashboardRecentPO[];
  pendingApprovals: DashboardPendingApproval[];
  unbilledConsumption: {
    value: string;
    title: string;
    desc: string;
    link: string;
  };
}

export interface StoreItem {
  id: number;
  code: string;
  name: string;
  branch: string;
  store_type: string;
  is_active: boolean;
  items_count?: number;
  batches_count?: number;
  total_stock?: number;
  manager_name?: string;
}

export interface BarcodeLookupResult {
  matchType: 'item' | 'batch' | 'po' | 'asset' | 'not_found';
  item?: {
    id: number;
    itemCode: string;
    name: string;
    genericName: string;
    category: string;
    form: string;
    uom: string;
    classVital: string;
    scheduleType: string;
    totalOnHand: number;
    avgDailyUse: string;
    targetCoverDays: string;
    reorderLevel: number;
    lastRate: string;
    rateContractExpiry?: string;
  };
  matchedBatch?: {
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    binLocation: string;
    status: string;
    purchaseRate: string;
    mrp: string;
    vendorName: string;
    storeId: number;
    storeName: string;
    storeBranch: string;
  };
  batches?: Array<{
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    binLocation: string;
    status: string;
    storeId: number;
    storeName: string;
    purchaseRate?: string;
    mrp?: string;
    vendorName?: string;
  }>;
  po?: {
    id: number;
    poNumber: string;
    vendorName: string;
    status: string;
    totalAmount: string;
    deliveryDate: string;
    items: any[];
  };
  asset?: any;
  scannedMeta: {
    rawBarcode: string;
    gtin?: string;
    batch?: string;
    expiry?: string;
    serial?: string;
  };
}


