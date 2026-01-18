import { CheckCircle2 } from 'lucide-react';

interface LessonCardProps {
  title: string;
  level: string;
  price: string;
  packagePrice: string;
  features: string[];
  popular?: boolean;
}

export function LessonCard({
  title,
  level,
  price,
  packagePrice,
  features,
  popular = false,
}: LessonCardProps) {
  return (
    <div className={`relative bg-gray-900/50 border rounded-xl p-8 hover:border-[#0366d6]/50 transition-all ${
      popular ? 'border-[#FF6B35]' : 'border-gray-800'
    }`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-xl text-sm font-bold">
          Most Popular
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{level}</p>
      </div>
      
      <div className="mb-6">
        <p className="text-3xl font-bold text-white mb-1">{price}</p>
        <p className="text-gray-400 text-sm">or {packagePrice} for 4 lessons</p>
      </div>
      
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-gray-300">
            <CheckCircle2 className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold">
        Book Lesson
      </button>
    </div>
  );
}
