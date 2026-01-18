import { Heart, Share2, Play } from 'lucide-react';

interface ArtistShowcaseProps {
  artistName: string;
  genre: string;
  followers: number;
  songs: number;
}

export function ArtistShowcase({ artistName, genre, followers, songs }: ArtistShowcaseProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#0366d6]/50 transition-all">
      <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg mb-4 flex items-center justify-center">
        <Play className="w-16 h-16 text-white opacity-70" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{artistName}</h3>
      <p className="text-[#0366d6] mb-4">{genre}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>{followers} followers</span>
        <span>{songs} songs</span>
      </div>
      
      <div className="flex gap-2">
        <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2">
          <Heart className="w-4 h-4" />
          Follow
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-all">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
