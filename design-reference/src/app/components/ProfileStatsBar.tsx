import { BookOpen, FileText, Star } from 'lucide-react';

interface ProfileStatsBarProps {
  booksRated: number;
  reviewsWritten: number;
  avgRating: number;
  variant?: 'full' | 'compact';
}

export default function ProfileStatsBar({ 
  booksRated, 
  reviewsWritten, 
  avgRating,
  variant = 'full'
}: ProfileStatsBarProps) {
  const stats = [
    { 
      label: 'Оценено книг', 
      value: booksRated, 
      icon: BookOpen,
      color: 'text-indigo-600'
    },
    { 
      label: 'Написано рецензий', 
      value: reviewsWritten, 
      icon: FileText,
      color: 'text-purple-600'
    },
    { 
      label: 'Средний балл', 
      value: `${avgRating}/84`, 
      icon: Star,
      color: 'text-amber-600'
    },
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-sm">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center gap-1">
              <Icon className={`w-4 h-4 ${stat.color}`} />
              <span className="font-semibold">{stat.value}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const backgrounds = [
    'bg-gradient-to-br from-blue-50 to-indigo-100',
    'bg-gradient-to-br from-purple-50 to-pink-100',
    'bg-gradient-to-br from-amber-50 to-orange-100',
  ];

  const borders = [
    'border-blue-200',
    'border-purple-200',
    'border-amber-200',
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`text-center p-4 rounded-xl ${backgrounds[index]} border-2 ${borders[index]} shadow-sm transition-transform hover:scale-105`}
          >
            <div className="flex justify-center mb-2">
              <Icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-xs text-gray-600 mt-1 font-medium">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
