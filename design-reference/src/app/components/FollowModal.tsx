import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { UserPlus, Check } from 'lucide-react';
import { UserProfile } from '../data/users';

interface FollowModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowModal({ user, isOpen, onClose }: FollowModalProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    setIsFollowing(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isFollowing ? 'Вы подписаны!' : `Подписаться на ${user.name}`}
          </DialogTitle>
          <DialogDescription>
            {isFollowing
              ? 'Теперь вы будете получать уведомления о новых оценках и рецензиях этого пользователя'
              : 'Вы будете получать уведомления о новой активности пользователя'
            }
          </DialogDescription>
        </DialogHeader>

        {!isFollowing ? (
          <>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-gray-600">
                    {user.stats.booksRated} книг оценено
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {user.bio || 'Активный участник сообщества BookRating'}
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Отмена
              </Button>
              <Button onClick={handleFollow} className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Подписаться
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600">Подписка оформлена успешно</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
