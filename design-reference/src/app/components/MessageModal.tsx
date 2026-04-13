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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Mail, Send, Check } from 'lucide-react';
import { UserProfile } from '../data/users';

interface MessageModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageModal({ user, isOpen, onClose }: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setIsSent(true);
      setTimeout(() => {
        setMessage('');
        setIsSent(false);
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setMessage('');
    setIsSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isSent ? 'Сообщение отправлено!' : `Написать ${user.name}`}
          </DialogTitle>
          <DialogDescription>
            {isSent
              ? 'Пользователь получит уведомление о вашем сообщении'
              : 'Отправьте личное сообщение пользователю'
            }
          </DialogDescription>
        </DialogHeader>

        {!isSent ? (
          <>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-indigo-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600">
                    Средний рейтинг: {user.stats.avgRating}/84
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Ваше сообщение</Label>
                <Textarea
                  id="message"
                  placeholder="Напишите что-нибудь интересное..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-gray-500">
                  {message.length}/500 символов
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Отмена
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600">Сообщение успешно отправлено</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
