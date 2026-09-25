'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartData {
  name: string;
  score: number;
}

interface TrendChartProps {
  data: ChartData[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={8} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#020617', 
              border: '1px solid #1e293b', 
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '12px'
            }} 
          />
          <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
