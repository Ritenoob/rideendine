'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Truck,
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
  Car,
  FileText,
} from 'lucide-react';

interface Driver {
  id: string;
  user_id: string;
  user_email: string;
  user_phone: string;
  user_name: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  rating: number;
  total_deliveries: number;
  is_available: boolean;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await api.getDrivers({
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
      });
      setDrivers(data.drivers);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      // Mock data for demo
      setDrivers([
        {
          id: '1',
          user_id: 'u1',
          user_email: 'john@example.com',
          user_phone: '+1 234-567-8900',
          user_name: 'John Smith',
          vehicle_type: 'car',
          vehicle_make: 'Toyota',
          vehicle_model: 'Corolla',
          vehicle_year: 2020,
          license_plate: 'ABC 123',
          rating: 4.9,
          total_deliveries: 245,
          is_available: true,
          is_verified: true,
          verification_status: 'approved',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'u2',
          user_email: 'sarah@example.com',
          user_phone: '+1 234-567-8901',
          user_name: 'Sarah Johnson',
          vehicle_type: 'car',
          vehicle_make: 'Honda',
          vehicle_model: 'Civic',
          vehicle_year: 2019,
          license_plate: 'XYZ 789',
          rating: 0,
          total_deliveries: 0,
          is_available: false,
          is_verified: false,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driver: Driver) => {
    setActionLoading(true);
    try {
      await api.approveDriver(driver.id);
      fetchDrivers();
    } catch (error) {
      console.error('Failed to approve driver:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDriver || !rejectReason) return;
    setActionLoading(true);
    try {
      await api.rejectDriver(selectedDriver.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedDriver(null);
      fetchDrivers();
    } catch (error) {
      console.error('Failed to reject driver:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      driver.user_name.toLowerCase().includes(q) ||
      driver.user_email.toLowerCase().includes(q) ||
      driver.license_plate.toLowerCase().includes(q)
    );
  });

  const activeCount = drivers.filter((d) => d.is_available).length;
  const pendingCount = drivers.filter(
    (d) => d.verification_status === 'pending'
  ).length;
  const verifiedCount = drivers.filter(
    (d) => d.verification_status === 'approved'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Driver Management</h1>
          <p className="text-muted text-sm">
            Manage driver applications and fleet
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
            placeholder="Search by name, email, or license plate..."
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">All Drivers</option>
          <option value="pending">Pending Approval</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
              <p className="text-sm text-emerald-600">Currently Online</p>
            </div>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-sm text-amber-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{verifiedCount}</p>
              <p className="text-sm text-blue-600">Verified</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-muted" />
            <div>
              <p className="text-2xl font-bold text-ink">{drivers.length}</p>
              <p className="text-sm text-muted">Total Drivers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted">No drivers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Driver</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Stats</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-ink">
                            {driver.user_name}
                          </p>
                          <p className="text-xs text-muted">
                            Applied{' '}
                            {new Date(driver.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Mail className="w-3 h-3" />
                          {driver.user_email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Phone className="w-3 h-3" />
                          {driver.user_phone}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Car className="w-4 h-4 text-muted" />
                          <span className="font-medium">
                            {driver.vehicle_year} {driver.vehicle_make}{' '}
                            {driver.vehicle_model}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          Plate: {driver.license_plate}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="font-medium">
                            {driver.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {driver.total_deliveries} deliveries
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <span
                          className={`badge ${
                            driver.verification_status === 'approved'
                              ? 'badge-approved'
                              : driver.verification_status === 'rejected'
                              ? 'badge-rejected'
                              : 'badge-pending'
                          }`}
                        >
                          {driver.verification_status}
                        </span>
                        {driver.is_verified && (
                          <span
                            className={`badge ml-1 ${
                              driver.is_available
                                ? 'badge-active'
                                : 'badge-inactive'
                            }`}
                          >
                            {driver.is_available ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Documents"
                        >
                          <FileText className="w-4 h-4 text-muted" />
                        </button>
                        {driver.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(driver)}
                              disabled={actionLoading}
                              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDriver(driver);
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
      {showRejectModal && selectedDriver && (
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
                {selectedDriver.user_name}
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
