import { Link } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { UserRatingHistory } from '../data/users';

interface RatingHistoryItemProps {
  rating: UserRatingHistory;
  showActions?: boolean;
}

export default function RatingHistoryItem({ rating, showActions = false }: RatingHistoryItemProps) {
  const dateFormatted = new Date(rating.date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const criteria = [
    { label: 'A', value: rating.criteria.architecture, name: 'Architecture', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { label: 'C', value: rating.criteria.characters, name: 'Characters', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'L', value: rating.criteria.language, name: 'Language', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { label: 'I', value: rating.criteria.idea, name: 'Idea', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'V', value: rating.criteria.vibe, name: 'Vibe', color: 'bg-green-100 text-green-700 border-green-200' },
  ];

  return (
    <Card className="hover:shadow-lg transition-all border-2 border-gray-100 hover:border-indigo-200 bg-gradient-to-r from-white to-gray-50/50">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Book Cover */}
          <Link to={`/book/${rating.bookId}`} className="flex-shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg blur-sm opacity-0 group-hover:opacity-30 transition-opacity"></div>
              <img
                src={rating.bookCover}
                alt={rating.bookTitle}
                className="w-16 h-24 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-all relative ring-2 ring-white"
              />
            </div>
          </Link>

          {/* Rating Info */}
          <div className="flex-1 min-w-0">
            <Link to={`/book/${rating.bookId}`} className="block hover:text-indigo-600 transition-colors">
              <h3 className="font-semibold truncate mb-1">{rating.bookTitle}</h3>
            </Link>
            <p className="text-sm text-gray-600 mb-2 font-medium">{rating.bookAuthor}</p>

            {/* Criteria Breakdown */}
            <div className="flex flex-wrap gap-2 mb-2">
              {criteria.map((criterion) => (
                <div
                  key={criterion.label}
                  className={`flex items-center gap-1 text-xs ${criterion.color} px-2 py-1 rounded-md border font-semibold transition-transform hover:scale-105`}
                  title={criterion.name}
                >
                  <span>{criterion.label}</span>
                  <span>{criterion.value.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">{dateFormatted}</span>
            </div>
          </div>

          {/* Final Score */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl px-4 py-2 text-center min-w-[4rem] shadow-lg">
                <div className="text-2xl font-bold">{rating.finalScore}</div>
                <div className="text-xs opacity-90">/84</div>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
