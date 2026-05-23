import { useState, useEffect } from 'react';
import { HiStar } from 'react-icons/hi2';
import api from '../services/api';
import Pagination from '../components/Pagination';

const PER_PAGE = 10;

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.request('/admin/reviews')
      .then((res) => setReviews(res.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(reviews.length / PER_PAGE);
  const paginated = reviews.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Reviews & Ratings</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-amber-500">{avgRating}</p>
          <p className="text-xs text-gray-500 mt-1">Avg Rating</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Reviews</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{reviews.filter((r) => r.rating >= 4).length}</p>
          <p className="text-xs text-gray-500 mt-1">4+ Stars</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No reviews yet</div>
        ) : (
          <>
          <div className="divide-y divide-gray-100">
            {paginated.map((review) => (
              <div key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{review.user?.name || 'Customer'}</p>
                    <p className="text-[10px] text-gray-400">Order #{review.order?.order_number}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <HiStar key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {review.review && (
                  <p className="text-sm text-gray-600 italic">"{review.review}"</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(review.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default Reviews;
