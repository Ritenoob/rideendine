'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  ShoppingBag,
  MessageSquare,
  FileText,
  X,
  Scale,
  Calendar,
  Filter,
} from 'lucide-react';

interface Dispute {
  id: string;
  order_id: string;
  order_number: string;
  type: 'payment' | 'delivery' | 'quality' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporter_name: string;
  reporter_email: string;
  reporter_role: 'customer' | 'chef' | 'driver';
  respondent_name?: string;
  respondent_role?: 'chef' | 'driver' | 'customer';
  subject: string;
  description: string;
  amount_cents?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution?: string;
  assigned_to?: string;
  messages?: DisputeMessage[];
}

interface DisputeMessage {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  attachments?: string[];
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDisputes, setSelectedDisputes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDisputes();
  }, [filter, priorityFilter]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await api.getDisputes({
        status: filter === 'all' ? undefined : filter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      });
      setDisputes(data.disputes);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      // Mock data
      setDisputes([
        {
          id: '1',
          order_id: 'ord-1',
          order_number: 'RND-2024-001234',
          type: 'quality',
          status: 'open',
          priority: 'high',
          reporter_name: 'John Doe',
          reporter_email: 'john@example.com',
          reporter_role: 'customer',
          respondent_name: "Maria's Kitchen",
          respondent_role: 'chef',
          subject: 'Food quality issue',
          description: 'The pasta was undercooked and the sauce was cold. Very disappointing for the price.',
          amount_cents: 4599,
          created_at: '2024-01-20T14:00:00Z',
          updated_at: '2024-01-20T14:00:00Z',
          messages: [
            {
              id: '1',
              sender_name: 'John Doe',
              sender_role: 'customer',
              message: 'The pasta was undercooked and the sauce was cold. Very disappointing for the price.',
              created_at: '2024-01-20T14:00:00Z',
            },
          ],
        },
        {
          id: '2',
          order_id: 'ord-2',
          order_number: 'RND-2024-001235',
          type: 'delivery',
          status: 'investigating',
          priority: 'medium',
          reporter_name: "Maria's Kitchen",
          reporter_email: 'maria@example.com',
          reporter_role: 'chef',
          respondent_name: 'David Chen',
          respondent_role: 'driver',
          subject: 'Late delivery',
          description: 'Driver was 45 minutes late picking up the order, causing food to sit and get cold.',
          amount_cents: 2899,
          created_at: '2024-01-19T10:00:00Z',
          updated_at: '2024-01-20T09:00:00Z',
          assigned_to: 'Admin User',
          messages: [
            {
              id: '1',
              sender_name: "Maria's Kitchen",
              sender_role: 'chef',
              message: 'Driver was 45 minutes late picking up the order, causing food to sit and get cold.',
              created_at: '2024-01-19T10:00:00Z',
            },
            {
              id: '2',
              sender_name: 'Admin User',
              sender_role: 'admin',
              message: 'We are investigating this issue. Please provide any additional details.',
              created_at: '2024-01-20T09:00:00Z',
            },
          ],
        },
        {
          id: '3',
          order_id: 'ord-3',
          order_number: 'RND-2024-001236',
          type: 'payment',
          status: 'resolved',
          priority: 'urgent',
          reporter_name: 'Sarah Johnson',
          reporter_email: 'sarah@example.com',
          reporter_role: 'customer',
          respondent_name: "Chen's Dumplings",
          respondent_role: 'chef',
          subject: 'Double charge',
          description: 'I was charged twice for the same order. Please refund one of the charges.',
          amount_cents: 2899,
          created_at: '2024-01-18T16:00:00Z',
          updated_at: '2024-01-19T10:00:00Z',
          resolved_at: '2024-01-19T10:00:00Z',
          resolution: 'Refunded the duplicate charge. Customer has been notified.',
          messages: [
            {
              id: '1',
              sender_name: 'Sarah Johnson',
              sender_role: 'customer',
              message: 'I was charged twice for the same order. Please refund one of the charges.',
              created_at: '2024-01-18T16:00:00Z',
            },
          ],
        },
        {
          id: '4',
          order_id: 'ord-4',
          order_number: 'RND-2024-001237',
          type: 'other',
          status: 'open',
          priority: 'low',
          reporter_name: 'Mike Wilson',
          reporter_email: 'mike@example.com',
          reporter_role: 'driver',
          respondent_name: 'Soul Food by James',
          respondent_role: 'chef',
          subject: 'Wrong pickup location',
          description: 'The address provided in the app was incorrect. Had to call customer for correct location.',
          created_at: '2024-01-20T08:00:00Z',
          updated_at: '2024-01-20T08:00:00Z',
          messages: [
            {
              id: '1',
              sender_name: 'Mike Wilson',
              sender_role: 'driver',
              message: 'The address provided in the app was incorrect. Had to call customer for correct location.',
              created_at: '2024-01-20T08:00:00Z',
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDetailModal(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution) return;
    setActionLoading(true);
    try {
      await api.resolveDispute(selectedDispute.id, {
        resolution,
        refund_amount: refundAmount ? parseInt(refundAmount) * 100 : undefined,
      });
      setShowResolveModal(false);
      setResolution('');
      setRefundAmount('');
      setSelectedDispute(null);
      fetchDisputes();
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, status: string) => {
    setActionLoading(true);
    try {
      await api.updateDisputeStatus(disputeId, status);
      fetchDisputes();
    } catch (error) {
      console.error('Failed to update dispute status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectDispute = (disputeId: string) => {
    const newSelected = new Set(selectedDisputes);
    if (newSelected.has(disputeId)) {
      newSelected.delete(disputeId);
    } else {
      newSelected.add(disputeId);
    }
    setSelectedDisputes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDisputes.size === filteredDisputes.length) {
      setSelectedDisputes(new Set());
    } else {
      setSelectedDisputes(new Set(filteredDisputes.map((d) => d.id)));
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedDisputes.size === 0) return;
    if (!confirm(`Update ${selectedDisputes.size} disputes to ${status}?`)) return;
    setActionLoading(true);
    try {
      await Promise.all(
        Array.from(selectedDisputes).map((id) =>
          api.updateDisputeStatus(id, status)
        )
      );
      setSelectedDisputes(new Set());
      fetchDisputes();
    } catch (error) {
      console.error('Failed to bulk update disputes:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-blue-100 text-blue-700';
      case 'delivery':
        return 'bg-purple-100 text-purple-700';
      case 'quality':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'badge-pending';
      case 'investigating':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'badge-approved';
      case 'closed':
        return 'badge-rejected';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredDisputes = disputes.filter((dispute) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      dispute.order_number.toLowerCase().includes(q) ||
      dispute.reporter_name.toLowerCase().includes(q) ||
      dispute.subject.toLowerCase().includes(q) ||
      dispute.description.toLowerCase().includes(q)
    );
  });

  const openCount = disputes.filter((d) => d.status === 'open').length;
  const investigatingCount = disputes.filter((d) => d.status === 'investigating').length;
  const resolvedCount = disputes.filter((d) => d.status === 'resolved').length;
  const urgentCount = disputes.filter((d) => d.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dispute Resolution</h1>
          <p className="text-muted text-sm">
            Manage and resolve customer disputes
          </p>
        </div>
        <div className="text-sm text-muted">
          {disputes.length} total disputes
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
            placeholder="Search disputes..."
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{urgentCount}</p>
              <p className="text-sm text-red-600">Urgent</p>
            </div>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{openCount}</p>
              <p className="text-sm text-amber-600">Open</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {investigatingCount}
              </p>
              <p className="text-sm text-blue-600">Investigating</p>
            </div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {resolvedCount}
              </p>
              <p className="text-sm text-emerald-600">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDisputes.size > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedDisputes.size === filteredDisputes.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm font-medium">
                {selectedDisputes.size} selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkUpdateStatus('investigating')}
                disabled={actionLoading}
                className="btn-secondary text-sm"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => handleBulkUpdateStatus('resolved')}
                disabled={actionLoading}
                className="btn-primary text-sm"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
        ) : filteredDisputes.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted">No disputes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header w-10">
                    <input
                      type="checkbox"
                      checked={selectedDisputes.size === filteredDisputes.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                  </th>
                  <th className="table-header">Dispute</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Reporter</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className={`hover:bg-gray-50 ${
                      dispute.priority === 'urgent' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selectedDisputes.has(dispute.id)}
                        onChange={() => handleSelectDispute(dispute.id)}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-ink">{dispute.subject}</p>
                        <p className="text-xs text-muted">
                          Order: {dispute.order_number}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${getTypeColor(
                          dispute.type
                        )}`}
                      >
                        {dispute.type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-muted" />
                          <span className="font-medium">
                            {dispute.reporter_name}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {dispute.reporter_role}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(
                          dispute.priority
                        )}`}
                      >
                        {dispute.priority}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {dispute.amount_cents ? (
                        <span className="font-medium">
                          {formatCurrency(dispute.amount_cents)}
                        </span>
                      ) : (
                        <span className="text-muted text-sm">-</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="w-3 h-3" />
                        {formatDate(dispute.created_at)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(dispute)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-muted" />
                        </button>
                        {dispute.status === 'open' && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolveModal(true);
                            }}
                            className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Resolve"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </button>
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

      {/* Detail Modal */}
      {showDetailModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink">
                  {selectedDispute.subject}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${getTypeColor(
                      selectedDispute.type
                    )}`}
                  >
                    {selectedDispute.type}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(
                      selectedDispute.priority
                    )}`}
                  >
                    {selectedDispute.priority}
                  </span>
                  <span className={`badge ${getStatusColor(selectedDispute.status)}`}>
                    {selectedDispute.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDispute(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="card bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-muted" />
                  <h4 className="font-semibold">Order Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted">Order Number</p>
                    <p className="font-medium">{selectedDispute.order_number}</p>
                  </div>
                  <div>
                    <p className="text-muted">Amount</p>
                    <p className="font-medium">
                      {selectedDispute.amount_cents
                        ? formatCurrency(selectedDispute.amount_cents)
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parties Involved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-500" />
                    <h4 className="font-semibold">Reporter</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedDispute.reporter_name}</p>
                    <p className="text-muted">{selectedDispute.reporter_email}</p>
                    <span className="badge badge-pending text-xs">
                      {selectedDispute.reporter_role}
                    </span>
                  </div>
                </div>
                {selectedDispute.respondent_name && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-purple-500" />
                      <h4 className="font-semibold">Respondent</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {selectedDispute.respondent_name}
                      </p>
                      <span className="badge badge-pending text-xs">
                        {selectedDispute.respondent_role}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-muted" />
                  <h4 className="font-semibold">Description</h4>
                </div>
                <p className="text-sm text-gray-700">
                  {selectedDispute.description}
                </p>
              </div>

              {/* Messages */}
              {selectedDispute.messages && selectedDispute.messages.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-muted" />
                    <h4 className="font-semibold">Messages</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedDispute.messages.map((message) => (
                      <div
                        key={message.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-muted">
                            {formatDateTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedDispute.resolution && (
                <div className="card bg-emerald-50 border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-700">Resolution</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedDispute.resolution}
                  </p>
                  {selectedDispute.resolved_at && (
                    <p className="text-xs text-muted mt-2">
                      Resolved on {formatDateTime(selectedDispute.resolved_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedDispute.status === 'open' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedDispute(selectedDispute);
                      setShowResolveModal(true);
                    }}
                    className="flex-1 btn-primary"
                  >
                    Resolve Dispute
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDispute.id, 'investigating')}
                    disabled={actionLoading}
                    className="flex-1 btn-secondary"
                  >
                    Start Investigation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-ink">Resolve Dispute</h3>
              </div>
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setResolution('');
                  setRefundAmount('');
                  setSelectedDispute(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              Resolving dispute for{' '}
              <span className="font-medium text-ink">
                {selectedDispute.order_number}
              </span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Resolution
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this dispute was resolved..."
                  rows={4}
                  className="input"
                />
              </div>
              {selectedDispute.amount_cents && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Refund Amount (optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max={(selectedDispute.amount_cents / 100).toFixed(2)}
                      className="input pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Max: {formatCurrency(selectedDispute.amount_cents)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setResolution('');
                  setRefundAmount('');
                  setSelectedDispute(null);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution || actionLoading}
                className="flex-1 btn-primary"
              >
                {actionLoading ? 'Resolving...' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
