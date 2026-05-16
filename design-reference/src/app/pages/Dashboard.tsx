import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import ProfileHeader from '../components/ProfileHeader';
import ProfileStatsBar from '../components/ProfileStatsBar';
import TasteGraph from '../components/TasteGraph';
import RatingHistoryItem from '../components/RatingHistoryItem';
import ReviewPreviewCard from '../components/ReviewPreviewCard';
import { getCurrentUser, getUserRatings } from '../data/users';
import { reviews, books } from '../data/books';
import {
  BookOpen,
  AlertCircle,
  Target,
  TrendingUp,
  Award,
  Flame,
  Star,
  Crown,
  BookMarked,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const currentUser = getCurrentUser();
  const userRatings = getUserRatings(currentUser.id);
  const userReviews = reviews.filter(r => r.authorName === currentUser.name);

  // Состояние: новый пользователь без оценок
  const isNewUser = userRatings.length === 0;

  // Reading goals
  const yearlyGoal = 50;
  const booksThisYear = currentUser.stats.booksRated;
  const goalProgress = (booksThisYear / yearlyGoal) * 100;

  // Streak
  const currentStreak = 7;

  // Achievements
  const achievements = [
    { id: 1, icon: Star, label: 'Первая оценка', unlocked: userRatings.length >= 1, color: 'text-yellow-500' },
    { id: 2, icon: BookMarked, label: '10 книг', unlocked: userRatings.length >= 10, color: 'text-blue-500' },
    { id: 3, icon: Crown, label: 'Критик', unlocked: userReviews.length >= 5, color: 'text-purple-500' },
    { id: 4, icon: Flame, label: 'Неделя подряд', unlocked: currentStreak >= 7, color: 'text-orange-500' },
  ];

  // Favorite genres (mock data)
  const favoriteGenres = [
    { name: 'Фантастика', count: 12, color: 'bg-blue-500' },
    { name: 'Детектив', count: 8, color: 'bg-purple-500' },
    { name: 'Классика', count: 6, color: 'bg-indigo-500' },
  ];

  // Recommendations
  const recommendations = books.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Profile Header */}
      <ProfileHeader user={currentUser} isOwnProfile={true} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{currentUser.stats.booksRated}</div>
            <div className="text-sm text-blue-700">Книг оценено</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">{currentUser.stats.avgRating}</div>
            <div className="text-sm text-purple-700">Средний балл</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <BookMarked className="w-8 h-8 text-pink-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-pink-900">{currentUser.stats.reviewsWritten}</div>
            <div className="text-sm text-pink-700">Рецензий</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{currentStreak}</div>
            <div className="text-sm text-orange-700">Дней подряд</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Taste Profile */}
          <Card className="border-2 border-indigo-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Ваш профиль читателя
              </CardTitle>
              <p className="text-sm text-gray-600">
                Средние значения по критериям "84"
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {!isNewUser ? (
                <>
                  <TasteGraph
                    architecture={currentUser.tasteProfile.architecture}
                    characters={currentUser.tasteProfile.characters}
                    language={currentUser.tasteProfile.language}
                    idea={currentUser.tasteProfile.idea}
                    vibe={currentUser.tasteProfile.vibe}
                    size="medium"
                  />
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Architecture:</span>
                      <span className="font-semibold text-indigo-600">{currentUser.tasteProfile.architecture.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Characters:</span>
                      <span className="font-semibold text-purple-600">{currentUser.tasteProfile.characters.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Language:</span>
                      <span className="font-semibold text-pink-600">{currentUser.tasteProfile.language.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Idea:</span>
                      <span className="font-semibold text-blue-600">{currentUser.tasteProfile.idea.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Vibe:</span>
                      <span className="font-semibold text-green-600">{currentUser.tasteProfile.vibe.toFixed(1)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">
                    Профиль вкуса формируется после первой оценки
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reading Goal */}
          <Card className="border-2 border-green-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Годовая цель чтения
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{booksThisYear} / {yearlyGoal} книг</span>
                  <span className="text-sm text-gray-600">{Math.round(goalProgress)}%</span>
                </div>
                <Progress value={goalProgress} className="h-3" />
              </div>
              <p className="text-xs text-gray-600">
                Осталось {yearlyGoal - booksThisYear} книг до достижения цели
              </p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-2 border-yellow-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Достижения
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg text-center transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200'
                        : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                    }`}
                  >
                    <achievement.icon className={`w-8 h-8 mx-auto mb-2 ${achievement.unlocked ? achievement.color : 'text-gray-400'}`} />
                    <div className="text-xs font-medium">{achievement.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Genres */}
          <Card className="border-2 border-purple-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Любимые жанры
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {favoriteGenres.map((genre, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{genre.name}</span>
                      <span className="text-sm text-gray-600">{genre.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${genre.color} transition-all`}
                        style={{ width: `${(genre.count / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Ratings */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Последние оценки</CardTitle>
                {userRatings.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/catalog">Оценить ещё</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {userRatings.length > 0 ? (
                <div className="space-y-4">
                  {userRatings.slice(0, 4).map((rating) => (
                    <RatingHistoryItem
                      key={rating.id}
                      rating={rating}
                      showActions={true}
                    />
                  ))}
                  {userRatings.length > 4 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/profile/ratings">Посмотреть все оценки ({userRatings.length})</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Вы ещё не оценили ни одной книги
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Начните с каталога, чтобы сформировать ваш читательский профиль
                  </p>
                  <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Link to="/catalog">Перейти в каталог</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Последние рецензии</CardTitle>
                {userReviews.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/catalog">Написать рецензию</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {userReviews.length > 0 ? (
                <div className="space-y-4">
                  {userReviews.slice(0, 3).map((review) => (
                    <ReviewPreviewCard
                      key={review.id}
                      review={review}
                      showBook={true}
                    />
                  ))}
                  {userReviews.length > 3 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/profile/reviews">Посмотреть все рецензии ({userReviews.length})</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50">
                  <p className="text-gray-600 text-sm">
                    Вы ещё не написали рецензий
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="shadow-md border-2 border-indigo-100">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Рекомендации для вас
              </CardTitle>
              <p className="text-sm text-gray-600">
                На основе вашего вкусового профиля
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((book) => (
                  <Link
                    key={book.id}
                    to={`/book/${book.id}`}
                    className="group block p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="aspect-[2/3] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md mb-3"></div>
                    <h4 className="font-semibold text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{book.author}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Box */}
      <Card className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-md">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 text-indigo-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Как формируется ваш профиль вкуса
          </h3>
          <div className="text-sm text-indigo-800 space-y-1">
            <p>
              • <strong>Средний балл</strong> — среднее арифметическое всех ваших итоговых оценок по системе "84"
            </p>
            <p>
              • <strong>Профиль вкуса (A, C, L, I, V)</strong> — средние значения по каждому критерию из всех ваших оценок
            </p>
            <p>
              • Чем больше книг вы оцените, тем точнее система определит ваши предпочтения
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}