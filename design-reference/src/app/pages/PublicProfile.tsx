import { useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import ProfileHeader from '../components/ProfileHeader';
import ProfileStatsBar from '../components/ProfileStatsBar';
import TasteGraph from '../components/TasteGraph';
import RatingHistoryItem from '../components/RatingHistoryItem';
import ReviewPreviewCard from '../components/ReviewPreviewCard';
import { getUserById, getUserRatings } from '../data/users';
import { reviews } from '../data/books';
import { AlertCircle } from 'lucide-react';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const user = id ? getUserById(id) : undefined;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Пользователь не найден</h1>
        <p className="text-gray-600 mb-6">
          Возможно, профиль был удалён или ссылка неверна
        </p>
        <Button asChild>
          <Link to="/users">Перейти к списку пользователей</Link>
        </Button>
      </div>
    );
  }

  const userRatings = getUserRatings(user.id);
  const userReviews = reviews.filter(r => r.authorName === user.name);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <ProfileHeader user={user} isOwnProfile={false} />

      {/* Stats Section */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <ProfileStatsBar
            booksRated={user.stats.booksRated}
            reviewsWritten={user.stats.reviewsWritten}
            avgRating={user.stats.avgRating}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Taste Profile */}
        <Card className="lg:col-span-1 border-2 border-indigo-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-lg">Профиль читателя</CardTitle>
            <p className="text-sm text-gray-600">
              Средние оценки по критериям
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <TasteGraph
              architecture={user.tasteProfile.architecture}
              characters={user.tasteProfile.characters}
              language={user.tasteProfile.language}
              idea={user.tasteProfile.idea}
              vibe={user.tasteProfile.vibe}
              size="medium"
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Architecture:</span>
                <span className="font-semibold text-indigo-600">{user.tasteProfile.architecture.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Characters:</span>
                <span className="font-semibold text-purple-600">{user.tasteProfile.characters.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Language:</span>
                <span className="font-semibold text-pink-600">{user.tasteProfile.language.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Idea:</span>
                <span className="font-semibold text-blue-600">{user.tasteProfile.idea.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vibe:</span>
                <span className="font-semibold text-green-600">{user.tasteProfile.vibe.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ratings */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="text-lg">Оценки пользователя</CardTitle>
            </CardHeader>
            <CardContent>
              {userRatings.length > 0 ? (
                <div className="space-y-4">
                  {userRatings.slice(0, 4).map((rating) => (
                    <RatingHistoryItem
                      key={rating.id}
                      rating={rating}
                      showActions={false}
                    />
                  ))}
                  {userRatings.length > 4 && (
                    <p className="text-center text-sm text-gray-600 pt-2">
                      И ещё {userRatings.length - 4} оценок
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-600">
                  Пользователь пока не оценил ни одной книги
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="text-lg">Рецензии пользователя</CardTitle>
            </CardHeader>
            <CardContent>
              {userReviews.length > 0 ? (
                <div className="space-y-4">
                  {userReviews.slice(0, 3).map((review) => (
                    <ReviewPreviewCard
                      key={review.id}
                      review={review}
                      showBook={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-600">
                  Пользователь пока не написал рецензий
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}