import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/admin/payments/DashboardPage';
import TransactionsPage from './pages/admin/payments/TransactionsPage';
import TransactionDetailsPage from './pages/admin/payments/TransactionDetailsPage';
import SettingsPage from './pages/admin/payments/SettingsPage';

export function AdminPaymentsRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="transacoes" element={<TransactionsPage />} />
      <Route path="transacoes/:id" element={<TransactionDetailsPage />} />
      <Route path="configuracoes" element={<SettingsPage />} />
    </Routes>
  );
}