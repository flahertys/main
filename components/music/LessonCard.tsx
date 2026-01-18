import { CheckCircle2 } from 'lucide-react';

interface LessonCardProps {
  level: string;
  price: string;
  packagePrice: string;
  features: string[];
  popular?: boolean;
}

export function LessonCard({ level, price, packagePrice, features, popular }: LessonCardProps) {
  return (
    <div className={`bg-gray-900/50 border rounded-xl p-8 hover:border-[#0366d6]/50 transition-all ${
      popular ? 'border-[#0366d6] ring-2 ring-[#0366d6]/20' : 'border-gray-800'
    }`}>
      {popular && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
          Most Popular
        </div>
      )}
      
      <h3 className="text-2xl font-bold text-white mb-3">{level}</h3>
      
      <div className="mb-6">
        <p className="text-4xl font-bold text-white mb-2">{price}</p>
        <p className="text-gray-400">per lesson</p>
        <p className="text-lg text-[#0366d6] mt-2 font-semibold">{packagePrice}</p>
        <p className="text-sm text-gray-400">4-lesson package</p>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-gray-300">
            <CheckCircle2 className="w-5 h-5 text-[#0366d6] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <button className="w-full shamrock-button py-3 font-semibold">
        Book Now
      </button>
    </div>
  );
}
