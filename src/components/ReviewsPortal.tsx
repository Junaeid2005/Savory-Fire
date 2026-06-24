import React, { useState, useEffect } from "react";
import { Star, MessageSquare, PenTool, CheckCircle2, AlertCircle, Trash2, ShieldCheck, Heart } from "lucide-react";
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface Review {
  id: string;
  userId: string;
  userEmail: string;
  displayName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface ReviewsPortalProps {
  userId: string | null;
  userEmail: string | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
}

export default function ReviewsPortal({ userId, userEmail, isAdmin, onOpenAuth }: ReviewsPortalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "reviews"),
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];

        // নতুন রিভিউ সবার উপরে দেখাবে
        fetched.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setReviews(fetched);
        setLoading(false);
      },
      (err) => {
        setError("Unable to load reviews.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !userEmail) {
      onOpenAuth();
      return;
    }

    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, "reviews"), {
        userId,
        userEmail,
        displayName: displayName.trim() || userEmail.split("@")[0],
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      
      setSuccess("Thank you! Your review has been posted.");
      setComment("");
      setDisplayName("");
      setRating(5);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!isAdmin || !window.confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (err) {
      console.error(err);
    }
  };

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Gourmet Guest Reviews
          </h2>
          <p className="text-xs text-gray-500 mt-1">Read authentic food reviews from our customers.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-950 font-mono">
          {totalReviews} Total Reviews (Avg: {averageRating})
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Review Input Form */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
          {userId ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="p-2 border rounded-lg text-xs"
                />
              </div>
              <textarea
                required
                rows={3}
                placeholder="Share your dining experience!"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs"
              />
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
                Post Review
              </button>
            </form>
          ) : (
            <div className="text-center py-6 text-gray-500 text-xs">
              Please log in to submit a review.
            </div>
          )}
        </div>
      </div>

      {/* Reviews List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs">{r.displayName}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-3.5 h-3.5 ${star <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-100"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 italic">"{r.comment}"</p>
            </div>
            {isAdmin && (
              <button onClick={() => handleDelete(r.id)} className="text-rose-500 mt-2 text-xs flex justify-end">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
