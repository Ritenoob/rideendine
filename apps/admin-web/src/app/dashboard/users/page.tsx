'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  ChefHat,
  Truck,
  User,
  X,
  ShoppingBag,
  DollarSign,
  MapPin,
  Shield,
} from 'lucide-react';

interface UserAccount {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'chef' | 'driver' | 'admin';
  is_active: boolean;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
  address?: string;
  last_login?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers({
        role: filter === 'all' ? undefined : filter,
        search: search || undefined,
        page,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Mock data
      setUsers([
        {
          id: '1',
          email: 'john@example.com',
          phone: '+1 234-567-8900',
          first_name: 'John',
          last_name: 'Doe',
          role: 'customer',
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          total_orders: 12,
          total_spent: 34500,
          address: '123 Main St, Hamilton, ON',
          last_login: '2024-01-20T14:30:00Z',
        },
        {
          id: '2',
          email: 'maria@example.com',
          phone: '+1 234-567-8901',
          first_name: 'Maria',
          last_name: 'Garcia',
          role: 'chef',
          is_active: true,
          created_at: '2024-01-10T10:00:00Z',
          total_orders: 156,
          address: '456 Oak Ave, Burlington, ON',
          last_login: '2024-01-20T09:15:00Z',
        },
        {
          id: '3',
          email: 'david@example.com',
          phone: '+1 234-567-8902',
          first_name: 'David',
          last_name: 'Chen',
          role: 'driver',
          is_active: true,
          created_at: '2024-01-12T10:00:00Z',
          total_orders: 245,
          address: '789 Pine Rd, Oakville, ON',
          last_login: '2024-01-20T12:45:00Z',
        },
        {
          id: '4',
          email: 'suspended@example.com',
          phone: '+1 234-567-8903',
          first_name: 'Sarah',
          last_name: 'Wilson',
          role: 'customer',
          is_active: false,
          created_at: '2024-01-05T10:00:00Z',
          total_orders: 3,
          total_spent: 8500,
          address: '321 Elm St, Toronto, ON',
          last_login: '2024-01-10T16:20:00Z',
        },
        {
          id: '5',
          email: 'admin@ridendine.com',
          phone: '+1 234-567-8904',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          is_active: true,
          created_at: '2023-12-01T10:00:00Z',
          last_login: '2024-01-20T08:00:00Z',
        },
      ]);
      setTotal(250);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    setActionLoading(true);
    try {
      await api.suspendUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (userId: string) => {
    if (!confirm('Are you sure you want to activate this user?')) return;
    setActionLoading(true);
    try {
      await api.activateUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to activate user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (user: UserAccount) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(q) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(q)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'chef':
        return <ChefHat className="w-4 h-4" />;
      case 'driver':
        return <Truck className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chef':
        return 'bg-orange-100 text-orange-700';
      case 'driver':
        return 'bg-purple-100 text-purple-700';
      case 'admin':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="text-muted text-sm">
            View and manage all platform users
          </p>
        </div>
        <div className="text-sm text-muted">
          {total.toLocaleString()} total users
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or email..."
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="input w-full sm:w-48"
          aria-label="Filter by role"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="chef">Chefs</option>
          <option value="driver">Drivers</option>
          <option value="admin">Admins</option>
        </select>
        <button type="button" onClick={handleSearch} className="btn-primary">
          Search
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {users.filter((u) => u.role === 'customer').length}
              </p>
              <p className="text-sm text-muted">Customers</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {users.filter((u) => u.role === 'chef').length}
              </p>
              <p className="text-sm text-muted">Chefs</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {users.filter((u) => u.role === 'driver').length}
              </p>
              <p className="text-sm text-muted">Drivers</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{users.length}</p>
              <p className="text-sm text-muted">Total Shown</p>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">User</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-semibold text-muted">
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-ink">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          user.is_active ? 'badge-approved' : 'badge-rejected'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-muted" />
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            {user.is_active ? (
                              <button
                                type="button"
                                onClick={() => handleSuspend(user.id)}
                                disabled={actionLoading}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Suspend User"
                              >
                                <Ban className="w-4 h-4 text-red-600" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivate(user.id)}
                                disabled={actionLoading}
                                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Activate User"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </button>
                            )}
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

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-muted">
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of{' '}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-muted">
                  {selectedUser.first_name[0]}
                  {selectedUser.last_name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${getRoleColor(
                        selectedUser.role
                      )}`}
                    >
                      {getRoleIcon(selectedUser.role)}
                      {selectedUser.role}
                    </span>
                    <span
                      className={`badge text-xs ${
                        selectedUser.is_active ? 'badge-approved' : 'badge-rejected'
                      }`}
                    >
                      {selectedUser.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="font-semibold text-ink mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-muted" />
                    <div>
                      <p className="text-xs text-muted">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-muted" />
                    <div>
                      <p className="text-xs text-muted">Phone</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  </div>
                  {selectedUser.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                      <MapPin className="w-5 h-5 text-muted" />
                      <div>
                        <p className="text-xs text-muted">Address</p>
                        <p className="font-medium">{selectedUser.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <h4 className="font-semibold text-ink mb-3">Activity</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedUser.total_orders !== undefined && (
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700">
                        {selectedUser.total_orders}
                      </p>
                      <p className="text-xs text-blue-600">
                        {selectedUser.role === 'customer' ? 'Orders Placed' : 'Orders Completed'}
                      </p>
                    </div>
                  )}
                  {selectedUser.total_spent !== undefined && (
                    <div className="p-4 bg-emerald-50 rounded-xl text-center">
                      <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(selectedUser.total_spent)}
                      </p>
                      <p className="text-xs text-emerald-600">Total Spent</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">
                      {formatDate(selectedUser.created_at)}
                    </p>
                    <p className="text-xs text-gray-600">Joined</p>
                  </div>
                  {selectedUser.last_login && (
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <User className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">
                        {formatDateTime(selectedUser.last_login)}
                      </p>
                      <p className="text-xs text-gray-600">Last Login</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedUser.role !== 'admin' && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-ink mb-3">Actions</h4>
                  <div className="flex gap-3">
                    {selectedUser.is_active ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleSuspend(selectedUser.id);
                          setShowDetailModal(false);
                        }}
                        disabled={actionLoading}
                        className="btn-danger flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Suspend User
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleActivate(selectedUser.id);
                          setShowDetailModal(false);
                        }}
                        disabled={actionLoading}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Activate User
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
