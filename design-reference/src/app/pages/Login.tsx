import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { BookOpen, Mail, Lock, User, Github, Sparkles } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = isLogin ? "Вход — BookRating" : "Регистрация — BookRating";
  }, [isLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - in production this would call an API
    navigate('/profile');
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 -z-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full blur-3xl opacity-20 -z-10"></div>

      <div className="w-full max-w-md relative">
        {/* Floating decoration */}
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full blur-sm opacity-60 animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full blur-sm opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BookRating
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Система "84"
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "С возвращением!" : "Начните свой путь"}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? "Продолжайте оценивать книги и делиться мнениями"
              : "Присоединяйтесь к сообществу ценителей литературы"}
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-2 border-indigo-100 backdrop-blur-sm bg-white/95">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Имя пользователя</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="name"
                    placeholder="Как вас зовут?"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11 h-12 border-2 focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  id="email"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 border-2 focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Пароль</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 border-2 focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">Подтвердите пароль</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    className="pl-11 h-12 border-2 focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="rounded border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Запомнить меня</span>
                </label>
                <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors">
                  Забыли пароль?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              size="lg"
            >
              {isLogin ? "Войти в аккаунт" : "Создать аккаунт"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors"
              >
                {isLogin ? "Зарегистрируйтесь" : "Войдите"}
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500 mb-4 font-medium">
              Или продолжите с помощью
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full h-11 border-2 hover:bg-red-50 hover:border-red-300 transition-all group"
                type="button"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="group-hover:text-red-600 transition-colors">Google</span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-2 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                type="button"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Вернуться на главную
          </Link>
        </div>

        {/* Features showcase */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-indigo-100">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-xs text-gray-600 font-medium">10K+ книг</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xs text-gray-600 font-medium">Система "84"</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-pink-100">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xs text-gray-600 font-medium">5K+ читателей</div>
          </div>
        </div>
      </div>
    </div>
  );
}