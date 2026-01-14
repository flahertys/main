"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StatCardProps } from "@/types";

export function StatCard({ title, value, change, icon, trend = 'neutral' }: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card className="border-gray-800 bg-gray-900/70 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          {icon && <div className="text-purple-400">{icon}</div>}
        </div>
        {change && (
          <div className={`flex items-center text-sm ${getTrendColor()}`}>
            {TrendIcon && <TrendIcon className="w-4 h-4 mr-1" />}
            <span>{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
