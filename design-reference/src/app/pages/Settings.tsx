import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Switch } from '../components/ui/switch';
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  ChevronLeft,
  Camera,
  Save,
  Shield,
  Mail
} from 'lucide-react';
import { getCurrentUser } from '../data/users';

export default function Settings() {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance'>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Профиль', icon: User },
    { id: 'notifications' as const, label: 'Уведомления', icon: Bell },
    { id: 'privacy' as const, label: 'Приватность', icon: Shield },
    { id: 'appearance' as const, label: 'Внешний вид', icon: Palette },
  ];

  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Вернуться в профиль
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Настройки
        </h1>
        <p className="text-gray-600 mt-2">Управляйте своим аккаунтом и предпочтениями</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-2 border-indigo-100 shadow-md">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'hover:bg-indigo-50 text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Информация профиля
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 ring-4 ring-indigo-200">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{currentUser.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">Участник с {new Date(currentUser.joinDate).getFullYear()}</p>
                    <Button variant="outline" size="sm" className="border-indigo-200 hover:bg-indigo-50">
                      <Camera className="w-4 h-4 mr-2" />
                      Изменить фото
                    </Button>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя пользователя</Label>
                    <Input
                      id="name"
                      defaultValue={currentUser.name}
                      className="border-2 focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        defaultValue="user@example.com"
                        className="pl-10 border-2 focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">О себе</Label>
                    <Textarea
                      id="bio"
                      defaultValue={currentUser.bio}
                      rows={4}
                      className="border-2 focus:border-indigo-400 resize-none"
                    />
                    <p className="text-xs text-gray-500">Расскажите немного о себе и ваших читательских предпочтениях</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Веб-сайт</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="website"
                        placeholder="https://example.com"
                        className="pl-10 border-2 focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить изменения
                  </Button>
                  <Button variant="outline">Отмена</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Настройки уведомлений
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {[
                  { label: 'Email уведомления', description: 'Получать уведомления на почту' },
                  { label: 'Новые подписчики', description: 'Когда кто-то подписывается на вас' },
                  { label: 'Новые рецензии', description: 'Уведомления о новых рецензиях от подписок' },
                  { label: 'Ответы на рецензии', description: 'Когда кто-то отвечает на ваши рецензии' },
                  { label: 'Рекомендации', description: 'Персональные рекомендации книг' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-100 hover:border-indigo-200 transition-colors">
                    <div>
                      <h4 className="font-medium mb-1">{item.label}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Switch defaultChecked={index < 3} />
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Приватность и безопасность
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-100">
                    <div>
                      <h4 className="font-medium mb-1">Публичный профиль</h4>
                      <p className="text-sm text-gray-600">Ваш профиль виден всем пользователям</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-100">
                    <div>
                      <h4 className="font-medium mb-1">Показывать оценки</h4>
                      <p className="text-sm text-gray-600">Другие могут видеть ваши оценки книг</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-100">
                    <div>
                      <h4 className="font-medium mb-1">Показывать список чтения</h4>
                      <p className="text-sm text-gray-600">Делиться списком прочитанных книг</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Изменить пароль
                  </h4>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Текущий пароль" className="border-2" />
                    <Input type="password" placeholder="Новый пароль" className="border-2" />
                    <Input type="password" placeholder="Подтвердите новый пароль" className="border-2" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  Внешний вид
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Тема оформления</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Светлая', value: 'light' },
                      { label: 'Тёмная', value: 'dark' },
                      { label: 'Авто', value: 'auto' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-400 transition-all text-center font-medium"
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Цветовая схема</h4>
                  <div className="grid grid-cols-6 gap-3">
                    {['indigo', 'purple', 'pink', 'blue', 'green', 'orange'].map((color) => (
                      <button
                        key={color}
                        className={`aspect-square rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform bg-${color}-500`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-100">
                  <div>
                    <h4 className="font-medium mb-1">Компактный режим</h4>
                    <p className="text-sm text-gray-600">Уменьшить размер элементов интерфейса</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
