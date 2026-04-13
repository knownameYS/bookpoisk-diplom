import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Calendar, UserPlus, Mail, Settings } from 'lucide-react';
import { UserProfile } from '../data/users';
import FollowModal from './FollowModal';
import MessageModal from './MessageModal';
import { Link } from 'react-router';

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({ user, isOwnProfile = false }: ProfileHeaderProps) {
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const joinDateFormatted = new Date(user.joinDate).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-xl p-6 md:p-8 shadow-lg border border-indigo-200/50">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-2xl ring-4 ring-indigo-200/50">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white shadow-md"></div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {user.name}
            </h1>
            {user.bio && (
              <p className="text-gray-700 mb-3 max-w-2xl leading-relaxed">{user.bio}</p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>На платформе с {joinDateFormatted}</span>
            </div>
          </div>

          {isOwnProfile ? (
            <Button variant="outline" size="sm" asChild className="border-indigo-200 hover:bg-indigo-50">
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Link>
            </Button>
          ) : (
            <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
              <Button
                variant="default"
                size="sm"
                className="flex-1 sm:flex-initial bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                onClick={() => setIsFollowModalOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Подписаться
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial border-indigo-200 hover:bg-indigo-50"
                onClick={() => setIsMessageModalOpen(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Написать
              </Button>
            </div>
          )}
        </div>
      </div>

      <FollowModal
        user={user}
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
      />
      <MessageModal
        user={user}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
      />
    </>
  );
}