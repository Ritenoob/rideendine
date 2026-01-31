'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  Eye,
  Ban,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  ChefHat,
  Truck,
  User,
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
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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
        },
      ]);
      setTotal(250);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    try {
      await api.suspendUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
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
            placeholder="Search by name or email..."
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="chef">Chefs</option>
          <option value="driver">Drivers</option>
          <option value="admin">Admins</option>
        </select>
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
                  <th className="table-header">Activity</th>
                  <th className="table-header">Status</th>
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
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Calendar className="w-3 h-3" />
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
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
                      <div className="space-y-1">
                        {user.total_orders !== undefined && (
                          <p className="text-sm">
                            {user.total_orders} orders
                          </p>
                        )}
                        {user.total_spent !== undefined && (
                          <p className="text-xs text-muted">
                            {formatCurrency(user.total_spent)} spent
                          </p>
                        )}
                      </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-muted" />
                        </button>
                        {user.is_active && user.role !== 'admin' && (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
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

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-muted">
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of{' '}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
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
    </div>
  );
}
