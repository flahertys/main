import { Music, Award, Star } from 'lucide-react';

interface InstructorProfileProps {
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  image?: string;
}

export function InstructorProfile({ name, specialty, experience, rating }: InstructorProfileProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#0366d6]/50 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Music className="w-10 h-10 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
          <p className="text-[#0366d6] mb-2">{specialty}</p>
          
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                }`}
              />
            ))}
            <span className="text-sm text-gray-400 ml-2">({rating}.0)</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-gray-400 mb-4">
        <Award className="w-5 h-5" />
        <span className="text-sm">{experience} experience</span>
      </div>
      
      <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-all font-medium">
        View Profile
      </button>
    </div>
  );
}
