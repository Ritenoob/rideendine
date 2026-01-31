'use client';

import { useEffect, useState } from 'react';
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

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchChefs();
  }, [filter]);

  const fetchChefs = async () => {
    setLoading(true);
    try {
      const data = await api.getChefs({
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
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
  };

  const handleApprove = async (chef: Chef) => {
    setActionLoading(true);
    try {
      await api.approveChef(chef.id);
      fetchChefs();
    } catch (error) {
      console.error('Failed to approve chef:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedChef || !rejectReason) return;
    setActionLoading(true);
    try {
      await api.rejectChef(selectedChef.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedChef(null);
      fetchChefs();
    } catch (error) {
      console.error('Failed to reject chef:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredChefs = chefs.filter((chef) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      chef.business_name.toLowerCase().includes(q) ||
      chef.user_email.toLowerCase().includes(q) ||
      chef.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
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
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
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
              <p className="text-2xl font-bold text-amber-700">
                {chefs.filter((c) => c.verification_status === 'pending').length}
              </p>
              <p className="text-sm text-amber-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {chefs.filter((c) => c.verification_status === 'approved').length}
              </p>
              <p className="text-sm text-emerald-600">Approved</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">
                {chefs.filter((c) => c.verification_status === 'rejected').length}
              </p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-muted" />
            <div>
              <p className="text-2xl font-bold text-ink">{chefs.length}</p>
              <p className="text-sm text-muted">Total Chefs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chef List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
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
                {filteredChefs.map((chef) => (
                  <tr key={chef.id} className="hover:bg-gray-50">
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
                        >
                          <Eye className="w-4 h-4 text-muted" />
                        </button>
                        {chef.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(chef)}
                              disabled={actionLoading}
                              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedChef(chef);
                                setShowRejectModal(true);
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedChef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">Reject Application</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
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
                disabled={!rejectReason || actionLoading}
                className="flex-1 btn-danger"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
