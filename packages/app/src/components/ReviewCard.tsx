import type { Review } from "@/types";
import StarRating from "./StarRating";

/** Displays a single review with author info, star rating, and comment. */
export default function ReviewCard({ review }: { review: Review }) {
  const initials = `${review.author.firstName[0]}${review.author.lastName[0]}`.toUpperCase();

  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      {review.author.avatar ? (
        <img
          src={review.author.avatar}
          alt={`${review.author.firstName} ${review.author.lastName}`}
          className="h-9 w-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">
            {review.author.firstName} {review.author.lastName}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <StarRating rating={review.rating} className="mt-0.5" />
        {review.comment && (
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}
