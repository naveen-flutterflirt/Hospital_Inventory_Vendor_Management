"use client";

import React from 'react';
import Header from '@/components/dashboard/Header';
import TopStats from '@/components/dashboard/TopStats';
import CategorySpendChart from '@/components/dashboard/CategorySpendChart';
import ReorderAlerts from '@/components/dashboard/ReorderAlerts';
import ExpiryLadderChart from '@/components/dashboard/ExpiryLadderChart';
import PurchaseOrdersTable from '@/components/dashboard/PurchaseOrdersTable';
import PendingApprovals from '@/components/dashboard/PendingApprovals';

export default function Dashboard() {
  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans">
      <Header />
      <TopStats />

      {/* Middle Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4">
          <CategorySpendChart />
        </div>
        <div className="xl:col-span-5">
          <ReorderAlerts />
        </div>
        <div className="xl:col-span-3">
          <ExpiryLadderChart />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PurchaseOrdersTable />
        </div>
        <div className="lg:col-span-1">
          <PendingApprovals />
        </div>
      </div>
    </div>
  );
}
