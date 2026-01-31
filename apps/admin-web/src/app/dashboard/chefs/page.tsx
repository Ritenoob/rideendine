'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  ChefHat,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Star,
  Phone,
  Mail,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

interface Chef {
  id: string;
  business_name: string;
  user_email: string;
  user_phone: string;
  address: string;
  cuisine_type: string[];
  rating: number;
  total_orders: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  documents?: string[];
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [selectedChefs, setSelectedChefs] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Debounce search to reduce API calls
  const debouncedSearch = useDebounce(search, 300);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const setActionLoading = useCallback((id: string, isLoading: boolean) => {
    setLoadingActions(prev => {
      const next = new Set(prev);
      if (isLoading) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const fetchChefs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getChefs({
        status: filter === 'all' ? undefined : filter,
        search: debouncedSearch || undefined,
      });
      setChefs(data.chefs);
    } catch (error) {
      console.error('Failed to fetch chefs:', error);
      // Mock data for demo
      setChefs([
        {
          id: '1',
          business_name: "Maria's Kitchen",
          user_email: 'maria@example.com',
          user_phone: '+1 234-567-8900',
          address: '123 Main St, Hamilton, ON',
          cuisine_type: ['Italian', 'Mediterranean'],
          rating: 0,
          total_orders: 0,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          business_name: "Chen's Dumplings",
          user_email: 'chen@example.com',
          user_phone: '+1 234-567-8901',
          address: '456 Oak Ave, Burlington, ON',
          cuisine_type: ['Chinese', 'Asian'],
          rating: 4.8,
          total_orders: 156,
          verification_status: 'approved',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchChefs();
  }, [fetchChefs]);

  const handleApprove = useCallback(async (chef: Chef) => {
    setActionLoading(chef.id, true);
    try {
      await api.approveChef(chef.id);
      showToast(`${chef.business_name} approved successfully`, 'success');
      fetchChefs();
    } catch (error) {
      console.error('Failed to approve chef:', error);
      showToast('Failed to approve chef', 'error');
    } finally {
      setActionLoading(chef.id, false);
    }
  }, [fetchChefs, setActionLoading, showToast]);

  const handleReject = useCallback(async () => {
    if (!selectedChef || !rejectReason) return;
    setActionLoading(selectedChef.id, true);
    try {
      await api.rejectChef(selectedChef.id, rejectReason);
      showToast(`${selectedChef.business_name} rejected`, 'success');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedChef(null);
      fetchChefs();
    } catch (error) {
      console.error('Failed to reject chef:', error);
      showToast('Failed to reject chef', 'error');
    } finally {
      if (selectedChef) {
        setActionLoading(selectedChef.id, false);
      }
    }
  }, [selectedChef, rejectReason, fetchChefs, setActionLoading, showToast]);

  const handleSelectChef = useCallback((chefId: string) => {
    setSelectedChefs(prev => {
      const next = new Set(prev);
      if (next.has(chefId)) {
        next.delete(chefId);
      } else {
        next.add(chefId);
      }
      return next;
    });
  }, []);

  // Memoized filtered chefs for local search (API also supports search)
  const filteredChefs = useMemo(() => {
    if (!search) return chefs;
    const q = search.toLowerCase();
    return chefs.filter(chef =>
      chef.business_name.toLowerCase().includes(q) ||
      chef.user_email.toLowerCase().includes(q) ||
      chef.address.toLowerCase().includes(q)
    );
  }, [chefs, search]);

  const handleSelectAll = useCallback(() => {
    setSelectedChefs(prev => {
      if (prev.size === filteredChefs.length) {
        return new Set();
      }
      return new Set(filteredChefs.map(c => c.id));
    });
  }, [filteredChefs]);

  const handleBulkApprove = useCallback(async () => {
    if (selectedChefs.size === 0) return;
    if (!confirm(`Approve ${selectedChefs.size} chefs?`)) return;
    setActionLoading('bulk', true);
    try {
      await Promise.all(
        Array.from(selectedChefs).map(id => api.approveChef(id))
      );
      showToast(`${selectedChefs.size} chefs approved`, 'success');
      setSelectedChefs(new Set());
      fetchChefs();
    } catch (error) {
      console.error('Failed to bulk approve chefs:', error);
      showToast('Failed to approve some chefs', 'error');
    } finally {
      setActionLoading('bulk', false);
    }
  }, [selectedChefs, fetchChefs, setActionLoading, showToast]);

  const handleBulkReject = useCallback(async () => {
    if (selectedChefs.size === 0) return;
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading('bulk', true);
    try {
      await Promise.all(
        Array.from(selectedChefs).map(id => api.rejectChef(id, reason))
      );
      showToast(`${selectedChefs.size} chefs rejected`, 'success');
      setSelectedChefs(new Set());
      fetchChefs();
    } catch (error) {
      console.error('Failed to bulk reject chefs:', error);
      showToast('Failed to reject some chefs', 'error');
    } finally {
      setActionLoading('bulk', false);
    }
  }, [selectedChefs, fetchChefs, setActionLoading, showToast]);

  // Memoized stats for performance
  const stats = useMemo(() => ({
    pending: chefs.filter(c => c.verification_status === 'pending').length,
    approved: chefs.filter(c => c.verification_status === 'approved').length,
    rejected: chefs.filter(c => c.verification_status === 'rejected').length,
    total: chefs.length,
  }), [chefs]);

  const isBulkLoading = loadingActions.has('bulk');
  const isAllSelected = selectedChefs.size === filteredChefs.length && filteredChefs.length > 0;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Chef Management</h1>
          <p className="text-muted text-sm">
            Review applications and manage home chefs
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or address..."
            className="input pl-10"
            aria-label="Search chefs"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-sm text-amber-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
              <p className="text-sm text-emerald-600">Approved</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-muted" />
            <div>
              <p className="text-2xl font-bold text-ink">{stats.total}</p>
              <p className="text-sm text-muted">Total Chefs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedChefs.size > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded accent-blue-500"
                aria-label="Select all"
              />
              <span className="text-sm font-medium">
                {selectedChefs.size} selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={isBulkLoading}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {isBulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                disabled={isBulkLoading}
                className="btn-danger text-sm flex items-center gap-2"
              >
                {isBulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chef List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading chefs...</span>
          </div>
        ) : filteredChefs.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted">No chefs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded accent-blue-500"
                      aria-label="Select all chefs"
                    />
                  </th>
                  <th className="table-header">Business</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Cuisine</th>
                  <th className="table-header">Stats</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChefs.map((chef) => {
                  const isChefLoading = loadingActions.has(chef.id);
                  return (
                    <tr key={chef.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <input
                          type="checkbox"
                          checked={selectedChefs.has(chef.id)}
                          onChange={() => handleSelectChef(chef.id)}
                          className="w-4 h-4 rounded accent-blue-500"
                          aria-label={`Select ${chef.business_name}`}
                        />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-ink">
                              {chef.business_name}
                            </p>
                            <p className="text-xs text-muted">
                              Applied{' '}
                              {new Date(chef.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Mail className="w-3 h-3" />
                            {chef.user_email}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Phone className="w-3 h-3" />
                            {chef.user_phone}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-muted" />
                          {chef.address}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {chef.cuisine_type.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">
                              {chef.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted">
                            {chef.total_orders} orders
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${
                            chef.verification_status === 'approved'
                              ? 'badge-approved'
                              : chef.verification_status === 'rejected'
                              ? 'badge-rejected'
                              : 'badge-pending'
                          }`}
                        >
                          {chef.verification_status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                            aria-label={`View details for ${chef.business_name}`}
                          >
                            <Eye className="w-4 h-4 text-muted" />
                          </button>
                          {chef.verification_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(chef)}
                                disabled={isChefLoading}
                                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                                aria-label={`Approve ${chef.business_name}`}
                              >
                                {isChefLoading ? (
                                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedChef(chef);
                                  setShowRejectModal(true);
                                }}
                                disabled={isChefLoading}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                                aria-label={`Reject ${chef.business_name}`}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedChef && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 id="reject-modal-title" className="text-lg font-bold text-ink">
                Reject Application
              </h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              Rejecting application for{' '}
              <span className="font-medium text-ink">
                {selectedChef.business_name}
              </span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (will be sent to applicant)..."
              rows={4}
              className="input mb-4"
              aria-label="Rejection reason"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || loadingActions.has(selectedChef.id)}
                className="flex-1 btn-danger flex items-center justify-center gap-2"
              >
                {loadingActions.has(selectedChef.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
