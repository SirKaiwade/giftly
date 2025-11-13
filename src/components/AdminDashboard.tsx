import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Gift, Users, DollarSign, ExternalLink, Search, Filter, Wallet, AlertTriangle, CreditCard } from 'lucide-react';
import { Contribution, RegistryItem, Registry } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import RedemptionModal from './RedemptionModal';

type AdminDashboardProps = {
  registryId: string;
  registry: Registry;
  items: RegistryItem[];
  contributions: Contribution[];
};

const AdminDashboard = ({ registryId, registry, items, contributions }: AdminDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [balance, setBalance] = useState<number | null>(null);
  const [flaggedTransactions, setFlaggedTransactions] = useState<any[]>([]);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Safety checks for empty arrays
  const safeContributions = contributions || [];
  const safeItems = items || [];

  // Fetch balance and flagged transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get balance
        const { data: balanceData } = await supabase
          .from('registry_balances')
          .select('balance_cents')
          .eq('registry_id', registryId)
          .single();

        if (balanceData) {
          setBalance(balanceData.balance_cents);
        } else {
          setBalance(0);
        }

        // Get flagged transactions
        const { data: flaggedData } = await supabase
          .from('flagged_transactions')
          .select(`
            *,
            contributions:contribution_id (
              id,
              contributor_name,
              contributor_email,
              amount,
              created_at
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (flaggedData) {
          setFlaggedTransactions(flaggedData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [registryId]);

  const totalRaised = safeContributions
    .filter(c => c.payment_status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalGoal = safeItems.reduce((sum, item) => sum + item.price_amount, 0);
  const progressPercent = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

  const contributionCount = safeContributions.filter(c => c.payment_status === 'paid').length;
  const uniqueContributors = new Set(
    safeContributions.filter(c => c.payment_status === 'paid').map(c => c.contributor_email || c.contributor_name)
  ).size;

  const filteredContributions = safeContributions.filter(c => {
    const matchesSearch =
      (c.contributor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contributor_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Item', 'Amount', 'Status', 'Message'];
    const rows = safeContributions.map(c => {
      const item = safeItems.find(i => i.id === c.item_id);
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
        {/* Platform Balance Card - Prominent */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6 mb-8 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-6 h-6 text-green-700" />
                <span className="text-sm font-medium text-gray-700">Platform Balance</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {balance !== null ? formatCurrency(balance) : 'Loading...'}
              </p>
              <p className="text-sm text-gray-600">
                Available for redemption as Amazon or Visa gift cards
              </p>
            </div>
            <button
              onClick={() => setShowRedemptionModal(true)}
              disabled={!balance || balance === 0}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>Redeem</span>
            </button>
          </div>
        </div>

        {/* Flagged Transactions Alert */}
        {flaggedTransactions.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  {flaggedTransactions.length} transaction{flaggedTransactions.length !== 1 ? 's' : ''} flagged for review
                </h3>
                <p className="text-sm text-yellow-700">
                  Some contributions require manual review before processing. Check the Flagged Transactions section below.
                </p>
              </div>
            </div>
          </div>
        )}

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
            <p className="text-3xl font-bold text-gray-900">{safeItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {safeItems.filter(i => i.is_fulfilled).length} fulfilled
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
                    const item = safeItems.find(i => i.id === contribution.item_id);
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

        {/* Flagged Transactions Section */}
        {flaggedTransactions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Flagged Transactions</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contributor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flag Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flaggedTransactions.map((flagged) => {
                    const contrib = flagged.contributions;
                    return (
                      <tr key={flagged.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contrib?.contributor_name || 'Unknown'}
                          </div>
                          {contrib?.contributor_email && (
                            <div className="text-sm text-gray-500">{contrib.contributor_email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {contrib ? formatCurrency(contrib.amount) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {flagged.flag_reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {contrib ? new Date(contrib.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                await supabase
                                  .from('flagged_transactions')
                                  .update({ status: 'approved' })
                                  .eq('id', flagged.id);
                                setFlaggedTransactions(flaggedTransactions.filter(f => f.id !== flagged.id));
                              }}
                              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await supabase
                                  .from('flagged_transactions')
                                  .update({ status: 'rejected' })
                                  .eq('id', flagged.id);
                                setFlaggedTransactions(flaggedTransactions.filter(f => f.id !== flagged.id));
                              }}
                              className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Performance</h2>
          <div className="space-y-4">
            {safeItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items in this registry yet.</p>
            ) : (
              safeItems.map((item) => {
                const itemContributions = safeContributions.filter(
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
            })
            )}
          </div>
        </div>
      </div>

      {/* Redemption Modal */}
      {showRedemptionModal && balance !== null && (
        <RedemptionModal
          registry={registry}
          currentBalance={balance}
          onClose={() => setShowRedemptionModal(false)}
          onSuccess={() => {
            setShowRedemptionModal(false);
            // Refresh balance
            supabase
              .from('registry_balances')
              .select('balance_cents')
              .eq('registry_id', registryId)
              .single()
              .then(({ data }) => {
                if (data) setBalance(data.balance_cents);
              });
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
