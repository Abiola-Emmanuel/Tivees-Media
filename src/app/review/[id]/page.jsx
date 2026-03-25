"use client";

import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { BiLike, BiComment, BiSend, BiSmile, BiImage } from 'react-icons/bi';
import { MdKeyboardArrowDown, MdOutlineRateReview } from 'react-icons/md';
import { BiFilter } from 'react-icons/bi';
import Navbar from "@/components/Navbar";

const ReviewPage = ({ params }) => {
  const { id } = use(params);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('write');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const MAX_CHARS = 1000;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(
          `${url}/api/v1/users/movies/${id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        if (response.data.status === "SUCCESS") {
          setMovie(response.data.movie);
        }

        try {
          const reviewsResponse = await axios.get(
            `${url}/api/v1/users/movies/${id}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            }
          );

          if (reviewsResponse.data.status === "SUCCESS") {
            setReviews(reviewsResponse.data.reviews);
          }
        } catch (reviewErr) {
          console.log("Reviews endpoint not available");
          setReviews([]);
        }
      } catch (err) {
        console.error("Error fetching details:", err);
        setError("Failed to load movie details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id, url]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setReviewText(text);
      setCharacterCount(text.length);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!userRating) {
      alert('Please provide a rating');
      return;
    }
    if (!reviewText.trim()) {
      alert('Please write your review');
      return;
    }

    setIsSubmitting(true);

    try {
      const authToken = localStorage.getItem("authToken");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user._id) {
        alert('User not logged in. Please log in first.');
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${url}/api/v1/users/movies/reviews`,
        {
          rating: userRating,
          userId: user._id,
          comment: reviewText,
          movieId: id
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === "SUCCESS") {
        setUserRating(0);
        setReviewText('');
        setCharacterCount(0);
        setSuccessMessage(response.data.message || 'Review submitted successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
        setActiveTab('read');
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      console.error("Error response data:", err.response?.data);

      const errorMsg = err.response?.data?.message || 'Failed to submit review. Please try again.';
      setSubmitError(errorMsg);

      setTimeout(() => setSubmitError(''), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ rating, interactive = false, onRatingChange, onHover }) => {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && onHover?.(star)}
            onMouseLeave={() => interactive && onHover?.(0)}
            className={`transition-all duration-200 ${interactive ? 'cursor-pointer transform hover:scale-110' : 'cursor-default'}`}
          >
            {(interactive ? hoverRating || rating : rating) >= star ? (
              <AiFillStar className="text-[#e50000] drop-shadow-glow" size={32} />
            ) : (
              <AiOutlineStar className="text-gray-500" size={32} />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-[#e50000] text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-400 mb-4">{error || 'Movie not found'}</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-[#e50000] rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141414] to-black text-white font-sans">
      <Navbar />

      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border border-green-500">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-2 text-green-100 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {submitError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border border-red-500">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{submitError}</span>
            <button
              onClick={() => setSubmitError('')}
              className="ml-2 text-red-100 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-10" />
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <div className="w-24 h-32 bg-[#262626] rounded-xl overflow-hidden shadow-2xl hidden md:block">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                width={96}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{movie.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                <span>{movie.releaseDate}</span>
                <span>•</span>
                <span>{movie.duration} min</span>
                <span>•</span>
                <span>{movie.genre}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('write')}
            className={`pb-3 px-4 font-semibold transition-all relative ${activeTab === 'write'
              ? 'text-[#e50000]'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-2">
              <MdOutlineRateReview size={20} />
              Write Review
            </div>
            {activeTab === 'write' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e50000] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`pb-3 px-4 font-semibold transition-all relative ${activeTab === 'read'
              ? 'text-[#e50000]'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-2">
              <BiComment size={20} />
              Read Reviews ({reviews?.length || 0})
            </div>
            {activeTab === 'read' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e50000] rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Share Your Thoughts</h2>
                <p className="text-gray-400">What did you think about {movie.title}?</p>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-8">
                {/* Rating Section */}
                <div className="text-center py-6 bg-[#141414] rounded-xl">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Your Rating
                  </label>
                  <div className="flex justify-center">
                    <RatingStars
                      rating={userRating}
                      interactive={true}
                      onRatingChange={setUserRating}
                      onHover={setHoverRating}
                    />
                  </div>
                  {userRating > 0 && (
                    <p className="mt-3 text-sm text-[#e50000]">
                      You rated this {userRating}/5
                    </p>
                  )}
                </div>


                {/* Review Text */}
                <div>
                  <label htmlFor="review" className="block text-sm font-medium text-gray-400 mb-2">
                    Your Review *
                  </label>
                  <div className="relative">
                    <textarea
                      id="review"
                      placeholder="Share your experience... What did you like or dislike? Would you recommend it?"
                      value={reviewText}
                      onChange={handleTextChange}
                      className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-base focus:outline-none focus:border-[#fff] focus:ring-1 focus:ring-[#fff] transition-all resize-none"
                      rows={8}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                      {characterCount}/{MAX_CHARS}
                    </div>
                  </div>
                </div>


                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#e50000] hover:bg-red-700 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <BiSend size={20} />
                      Publish Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'read' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">All Reviews</h3>
              <button className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors px-4 py-2 bg-[#0f0f0f] rounded-lg border border-white/10">
                <BiFilter size={18} />
                Filter
              </button>
            </div>

            {(reviews || []).length === 0 ? (
              <div className="text-center py-16 bg-[#0f0f0f] rounded-2xl border border-white/10">
                <p className="text-gray-400 mb-4">No reviews yet</p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="px-6 py-2 bg-[#e50000] rounded-lg hover:bg-red-700 transition-colors"
                >
                  Be the first to review
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div key={index} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <RatingStars rating={review.rating} />
                        </div>
                        <p className="text-sm text-gray-500">
                          {review.user?.email || 'Anonymous'} • {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="text-gray-500 hover:text-[#e50000] transition-colors">
                        <BiLike size={20} />
                      </button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{review.review}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;