'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Star,
  Trash2,
  Flag,
  FlagOff,
  ChefHat,
  Truck,
  User,
  MessageSquare,
  X,
  AlertTriangle,
  Search,
} from 'lucide-react';

interface Review {
  id: string;
  order_id: string;
  reviewer_name: string;
  reviewee_type: 'chef' | 'driver';
  reviewee_name: string;
  rating: number;
  comment: string;
  is_flagged: boolean;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFlagged, setShowFlagged] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [filter, showFlagged]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getReviews({
        type: filter === 'all' ? undefined : filter,
        flagged: showFlagged || undefined,
      });
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      // Mock data
      setReviews([
        {
          id: '1',
          order_id: 'RND-2024-001234',
          reviewer_name: 'John Doe',
          reviewee_type: 'chef',
          reviewee_name: "Maria's Kitchen",
          rating: 5,
          comment:
            'Amazing food! The pasta was perfectly cooked and the sauce was incredible. Will definitely order again!',
          is_flagged: false,
          created_at: '2024-01-20T14:00:00Z',
        },
        {
          id: '2',
          order_id: 'RND-2024-001235',
          reviewer_name: 'Sarah Johnson',
          reviewee_type: 'driver',
          reviewee_name: 'David Chen',
          rating: 4,
          comment: 'Quick delivery, very professional. Food was still hot when it arrived.',
          is_flagged: false,
          created_at: '2024-01-20T13:00:00Z',
        },
        {
          id: '3',
          order_id: 'RND-2024-001236',
          reviewer_name: 'Mike Wilson',
          reviewee_type: 'chef',
          reviewee_name: "Chen's Dumplings",
          rating: 2,
          comment:
            'Very disappointed. The order was wrong and when I tried to contact them they were rude.',
          is_flagged: true,
          created_at: '2024-01-19T18:00:00Z',
        },
        {
          id: '4',
          order_id: 'RND-2024-001237',
          reviewer_name: 'Emily Brown',
          reviewee_type: 'driver',
          reviewee_name: 'Tom Wilson',
          rating: 1,
          comment: 'Driver was very late and food was cold. Terrible experience!',
          is_flagged: true,
          created_at: '2024-01-19T16:00:00Z',
        },
        {
          id: '5',
          order_id: 'RND-2024-001238',
          reviewer_name: 'Alex Turner',
          reviewee_type: 'chef',
          reviewee_name: 'Soul Food by James',
          rating: 5,
          comment: 'Best fried chicken I have ever had! Absolutely amazing.',
          is_flagged: false,
          created_at: '2024-01-18T12:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview || !deleteReason) return;
    setActionLoading(true);
    try {
      await api.removeReview(selectedReview.id, deleteReason);
      setShowDeleteModal(false);
      setDeleteReason('');
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFlag = async (review: Review) => {
    setActionLoading(true);
    try {
      if (review.is_flagged) {
        await api.unflagReview(review.id);
      } else {
        await api.flagReview(review.id);
      }
      // Update local state optimistically
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_flagged: !r.is_flagged } : r
        )
      );
    } catch (error) {
      console.error('Failed to update flag status:', error);
      // Optimistically update in mock mode
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_flagged: !r.is_flagged } : r
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Filter reviews by search
  const filteredReviews = reviews.filter((review) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      review.reviewer_name.toLowerCase().includes(q) ||
      review.reviewee_name.toLowerCase().includes(q) ||
      review.comment.toLowerCase().includes(q) ||
      review.order_id.toLowerCase().includes(q)
    );
  });

  const avgRating =
    filteredReviews.length > 0
      ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: filteredReviews.filter((r) => r.rating === rating).length,
    percentage:
      filteredReviews.length > 0
        ? (filteredReviews.filter((r) => r.rating === rating).length / filteredReviews.length) *
          100
        : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Review Management</h1>
          <p className="text-muted text-sm">Moderate and manage user reviews</p>
        </div>
        <div className="text-sm text-muted">
          {filteredReviews.length} reviews
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
            placeholder="Search reviews..."
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
          title="Filter by review type"
          aria-label="Filter by review type"
        >
          <option value="all">All Reviews</option>
          <option value="chef">Chef Reviews</option>
          <option value="driver">Driver Reviews</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-xl px-4 py-2">
          <input
            type="checkbox"
            checked={showFlagged}
            onChange={(e) => setShowFlagged(e.target.checked)}
            className="w-4 h-4 rounded accent-red-500"
          />
          <Flag className="w-4 h-4 text-red-500" />
          <span className="text-sm">Flagged only</span>
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Average Rating</h3>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-ink">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-muted">/ 5.0</span>
          </div>
          <p className="text-sm text-muted mt-2">
            Based on {filteredReviews.length} reviews
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-2">
                <span className="text-sm w-8">{item.rating}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-8">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Review Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Chef Reviews</span>
              </div>
              <span className="font-semibold">
                {filteredReviews.filter((r) => r.reviewee_type === 'chef').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Driver Reviews</span>
              </div>
              <span className="font-semibold">
                {filteredReviews.filter((r) => r.reviewee_type === 'driver').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" />
                <span className="text-sm">Flagged</span>
              </div>
              <span className="font-semibold text-red-600">
                {filteredReviews.filter((r) => r.is_flagged).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className={`p-4 rounded-xl border ${
                  review.is_flagged
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {review.reviewer_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>Order: {review.order_id}</span>
                        <span>-</span>
                        <span>
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.is_flagged && (
                      <span className="badge badge-rejected flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Flagged
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleFlag(review)}
                      disabled={actionLoading}
                      className={`p-2 rounded-lg transition-colors ${
                        review.is_flagged
                          ? 'hover:bg-emerald-100 text-emerald-600'
                          : 'hover:bg-amber-100 text-amber-600'
                      }`}
                      title={review.is_flagged ? 'Unflag Review' : 'Flag Review'}
                    >
                      {review.is_flagged ? (
                        <FlagOff className="w-4 h-4" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove Review"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {review.reviewee_type === 'chef' ? (
                      <ChefHat className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Truck className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="font-medium">{review.reviewee_name}</span>
                  </div>
                  {renderStars(review.rating)}
                  <span className="text-sm text-muted">({review.rating}/5)</span>
                </div>

                <p className="text-sm text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-ink">Remove Review</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                  setSelectedReview(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              This review will be permanently removed and the reviewer will be
              notified.
            </p>
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(selectedReview.rating)}
                <span className="text-sm text-muted">
                  by {selectedReview.reviewer_name}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                &ldquo;{selectedReview.comment}&rdquo;
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1">
                Reason for removal
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter the reason for removing this review..."
                rows={3}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                  setSelectedReview(null);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!deleteReason || actionLoading}
                className="flex-1 btn-danger flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {actionLoading ? 'Removing...' : 'Remove Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
