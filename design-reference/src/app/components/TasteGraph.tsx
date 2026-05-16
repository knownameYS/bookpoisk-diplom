import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface TasteGraphProps {
  architecture: number;
  characters: number;
  language: number;
  idea: number;
  vibe: number;
  size?: 'small' | 'medium' | 'large';
}

export default function TasteGraph({ 
  architecture, 
  characters, 
  language, 
  idea, 
  vibe,
  size = 'medium' 
}: TasteGraphProps) {
  const data = [
    { criterion: 'A', value: architecture, fullName: 'Architecture' },
    { criterion: 'C', value: characters, fullName: 'Characters' },
    { criterion: 'L', value: language, fullName: 'Language' },
    { criterion: 'I', value: idea, fullName: 'Idea' },
    { criterion: 'V', value: vibe, fullName: 'Vibe' },
  ];

  const heights = {
    small: 150,
    medium: 250,
    large: 350,
  };

  return (
    <div style={{ width: '100%', height: heights[size] }} className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg opacity-30 blur-xl"></div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <defs>
            <linearGradient id="colorTaste" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="50%" stopColor="#a855f7" stopOpacity={0.6}/>
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
          <PolarGrid stroke="#e0e7ff" strokeWidth={1.5} />
          <PolarAngleAxis
            dataKey="criterion"
            tick={{ fill: '#4f46e5', fontSize: 14, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            stroke="#c7d2fe"
          />
          <Radar
            name="Taste Profile"
            dataKey="value"
            stroke="url(#colorTaste)"
            fill="url(#colorTaste)"
            fillOpacity={0.5}
            strokeWidth={3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
