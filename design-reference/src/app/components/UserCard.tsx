import { Link } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import TasteGraph from './TasteGraph';
import { UserProfile } from '../data/users';

interface UserCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact';
}

export default function UserCard({ user, variant = 'default' }: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  if (variant === 'compact') {
    return (
      <Link to={`/user/${user.id}`} className="block group">
        <Card className="hover:shadow-lg transition-all border-2 border-transparent hover:border-indigo-200 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-indigo-100 ring-offset-2 group-hover:ring-indigo-300 transition-all">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-indigo-600 transition-colors">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {user.stats.booksRated} книг • <span className="font-semibold text-indigo-600">{user.stats.avgRating}/84</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="hover:shadow-2xl transition-all border-2 border-indigo-100 hover:border-indigo-300 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <Avatar className="w-20 h-20 relative ring-4 ring-white shadow-xl">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600 transition-colors">
            {user.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
            <span className="font-medium">{user.stats.booksRated} книг</span>
            <span>•</span>
            <span className="font-semibold text-indigo-600">{user.stats.avgRating}/84</span>
          </div>
          {user.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{user.bio}</p>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2 text-center font-semibold">
            Профиль вкуса
          </h4>
          <TasteGraph
            architecture={user.tasteProfile.architecture}
            characters={user.tasteProfile.characters}
            language={user.tasteProfile.language}
            idea={user.tasteProfile.idea}
            vibe={user.tasteProfile.vibe}
            size="small"
          />
        </div>

        <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md" variant="default">
          <Link to={`/user/${user.id}`}>Открыть профиль</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
