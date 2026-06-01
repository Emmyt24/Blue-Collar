"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { createReview } from "@/lib/api";
import type { Review } from "@/types";

interface ReviewFormProps {
  workerId: string;
  onReviewCreated: (review: Review) => void;
}

/**
 * Star-picker form for submitting a review.
 * Calls onReviewCreated with the new review on success.
 */
export default function ReviewForm({ workerId, onReviewCreated }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Please select a rating.");
    setLoading(true);
    setError(null);
    try {
      const res = await createReview(workerId, { rating, comment: comment.trim() || undefined });
      onReviewCreated(res.data);
      setRating(0);
      setComment("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Star picker */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              size={22}
              className={(hovered || rating) >= star ? "text-yellow-400" : "text-gray-200"}
              fill={(hovered || rating) >= star ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}
