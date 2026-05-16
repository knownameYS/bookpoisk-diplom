import { Link } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Heart } from 'lucide-react';
import { Review } from '../data/books';
import { books } from '../data/books';

interface ReviewPreviewCardProps {
  review: Review;
  showBook?: boolean;
}

export default function ReviewPreviewCard({ 
  review, 
  showBook = false 
}: ReviewPreviewCardProps) {
  const dateFormatted = new Date(review.date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const book = books.find(b => b.id === review.bookId);

  return (
    <Card className="hover:shadow-lg transition-all border-2 border-gray-100 hover:border-indigo-200 bg-gradient-to-br from-white to-gray-50/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {showBook && book && (
              <Link
                to={`/book/${review.bookId}`}
                className="font-semibold hover:text-indigo-600 transition-colors block mb-2 text-base"
              >
                {book.title}
              </Link>
            )}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur-sm opacity-50"></div>
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                  {review.rating}/84
                </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">{dateFormatted}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mb-4">
          {review.text}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button className="flex items-center gap-1 hover:text-red-500 transition-colors group">
            <Heart className="w-4 h-4 group-hover:fill-red-500" />
            <span className="font-medium">{review.likes}</span>
          </button>
          <Link
            to={`/book/${review.bookId}`}
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
          >
            Читать полностью →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}