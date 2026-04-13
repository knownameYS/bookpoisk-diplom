import { Link, useNavigate } from "react-router";
import { BookOpen, Library, Search, User, LogOut, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, FormEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getCurrentUser } from "../data/users";

export default function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = getCurrentUser();
  const isLoggedIn = true; // В реальности это будет из контекста авторизации

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BookRating
              </span>
              <span className="text-xs text-gray-500">Система "84"</span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="search"
                placeholder="Поиск книг и авторов..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <nav className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              asChild
            >
              <Link to="/search">
                <Search className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="ghost" asChild className="hidden sm:flex hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <Link to="/catalog">
                <Library className="w-4 h-4 mr-2" />
                Каталог
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden">
              <Link to="/catalog">
                <Library className="w-4 h-4" />
              </Link>
            </Button>
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative hover:bg-indigo-50 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-indigo-200 ring-offset-2">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Рейтинг: {currentUser.stats.avgRating}/84
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Мой профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/users">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Все пользователи
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                asChild
                className="border-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
              >
                <Link to="/login">Войти</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}