import React, { useState } from 'react';
import { Download, TrendingUp, Gift, Users, DollarSign, ExternalLink, Search, Filter } from 'lucide-react';
import { Contribution, RegistryItem } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/helpers';

type AdminDashboardProps = {
  registryId: string;
  items: RegistryItem[];
  contributions: Contribution[];
};

const AdminDashboard = ({ registryId, items, contributions }: AdminDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');

  const totalRaised = contributions
    .filter(c => c.payment_status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalGoal = items.reduce((sum, item) => sum + item.price_amount, 0);
  const progressPercent = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

  const contributionCount = contributions.filter(c => c.payment_status === 'paid').length;
  const uniqueContributors = new Set(
    contributions.filter(c => c.payment_status === 'paid').map(c => c.contributor_email || c.contributor_name)
  ).size;

  const filteredContributions = contributions.filter(c => {
    const matchesSearch =
      c.contributor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contributor_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Item', 'Amount', 'Status', 'Message'];
    const rows = contributions.map(c => {
      const item = items.find(i => i.id === c.item_id);
      return [
        new Date(c.created_at).toLocaleDateString(),
        c.contributor_name,
        c.contributor_email,
        item?.title || 'General',
        (c.amount / 100).toFixed(2),
        c.payment_status,
        c.message.replace(/,/g, ';'),
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registry-contributions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registry Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and track your contributions</p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Raised</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRaised)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {progressPercent.toFixed(1)}% of {formatCurrency(totalGoal)} goal
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Contributions</span>
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{contributionCount}</p>
            <p className="text-xs text-gray-500 mt-1">Total contributions received</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Contributors</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{uniqueContributors}</p>
            <p className="text-xs text-gray-500 mt-1">Unique contributors</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Registry Items</span>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {items.filter(i => i.is_fulfilled).length} fulfilled
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Recent Contributions</h2>
              <div className="flex space-x-3">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contributors..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContributions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No contributions found
                    </td>
                  </tr>
                ) : (
                  filteredContributions.map((contribution) => {
                    const item = items.find(i => i.id === contribution.item_id);
                    return (
                      <tr key={contribution.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contribution.contributor_name}
                          </div>
                          {contribution.contributor_email && (
                            <div className="text-sm text-gray-500">
                              {contribution.contributor_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {item?.title || 'General Fund'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(contribution.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              contribution.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : contribution.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {contribution.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(contribution.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {contribution.message ? (
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {contribution.message}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No message</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Performance</h2>
          <div className="space-y-4">
            {items.map((item) => {
              const itemContributions = contributions.filter(
                c => c.item_id === item.id && c.payment_status === 'paid'
              );
              const itemTotal = itemContributions.reduce((sum, c) => sum + c.amount, 0);
              const itemProgress =
                item.price_amount > 0 ? (itemTotal / item.price_amount) * 100 : 0;

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(itemTotal)} of {formatCurrency(item.price_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {itemProgress.toFixed(0)}%
                      </span>
                      <p className="text-xs text-gray-500">
                        {itemContributions.length} contributions
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(itemProgress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
