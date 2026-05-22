'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface LanguageData {
  name: string;
  value: number;
}

interface LanguageShareChartProps {
  data: LanguageData[];
}

const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

export default function LanguageShareChart({ data }: LanguageShareChartProps) {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={8} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
