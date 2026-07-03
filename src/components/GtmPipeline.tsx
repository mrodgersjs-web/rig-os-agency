'use client';

import { useState } from 'react';

interface Deal {
  id: string;
  name: string;
  stage: 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  owner: string;
  company?: string;
}

const mockDeals: Deal[] = [
  { id: '1', name: 'AI Operations Overhaul', stage: 'won', value: 85000, owner: 'Mike R.' },
  { id: '2', name: 'Strategy Consulting', stage: 'negotiation', value: 42000, owner: 'Sarah J.' },
  { id: '3', name: 'DevOps Automation', stage: 'proposal', value: 38000, owner: 'Mike R.' },
  { id: '4', name: 'Security Audit', stage: 'qualified', value: 28000, owner: 'Sarah J.' },
];

export default function GtmPipeline() {
  const [filter, setFilter] = useState<string>('all');
  
  const stages: Deal['stage'][] = ['qualified', 'proposal', 'negotiation', 'won', 'lost'];
  
  const getStageColor = (stage: Deal['stage']) => {
    switch(stage) {
      case 'won': return '#10b981'; // emerald-500
      case 'negotiation': return '#f59e0b'; // amber-500
      case 'proposal': return '#8b5cf6'; // violet-500
      default: return '#3b82f6'; // blue-500
    }
  };

  const filteredDeals = filter === 'all' ? mockDeals : mockDeals.filter(d => d.stage === filter);
  
  const stageCounts: Record<string, number> = {};
  stages.forEach(s => { stageCounts[s] = 0; });
  for (const deal of mockDeals) { stageCounts[deal.stage]++; }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">GTM Pipeline</h1>
      
      {/* Stage Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All ({mockDeals.length})
        </button>
        {stages.map(stage => (
          <button 
            key={stage}
            onClick={() => setFilter(stage)}
            style={{ borderColor: getStageColor(stage) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${filter === stage ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {stage.charAt(0).toUpperCase() + stage.slice(1)} ({stageCounts[stage]})
          </button>
        ))}
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-5 gap-4">
        {stages.map(stage => (
          <div key={stage} className="opacity-60 border-t-2 pt-3" style={{ borderColor: getStageColor(stage) }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide">{stage.charAt(0).toUpperCase() + stage.slice(1)}</h2>
            
            {/* Column Total */}
            {filter === 'all' && (
              <p className="text-xs text-gray-500 mb-4">
                ${(filteredDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0) / 1000)}k
              </p>
            )}

            {/* Deals in Stage */}
            <div className="space-y-3">
              {filteredDeals.filter(d => d.stage === stage).map(deal => (
                <div 
                  key={deal.id}
                  className="p-4 bg-white rounded-lg shadow border-l-2"
                  style={{ borderColor: getStageColor(stage) }}
                >
                  <h3 className="font-semibold text-gray-900">{deal.name}</h3>
                  {deal.company && (
                    <p className="text-sm text-gray-500 mt-1">@{deal.company}</p>
                  )}
                  <div className="flex justify-between mt-2">
                    <span className="text-lg font-bold">${(deal.value / 1000).toFixed(0)}k</span>
                    <span className="text-xs text-gray-400">{deal.owner}</span>
                  </div>
                </div>
              ))}

              {stageCounts[stage] === 0 && (
                <p className="text-sm text-gray-400 italic">No deals</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-sm text-gray-500">Total Pipeline</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">${(mockDeals.reduce((sum, d) => sum + d.value, 0) / 1000)}k</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Win Rate</p>
          <div className={`border-t-2 pt-3 mt-1 ${mockDeals.length ? 'opacity-75' : 'opacity-40'}`} style={{ borderColor: '#10b981' }}>
            <p className="text-sm text-gray-500">Won / Total</p>
            <div className={`border-b pt-2 mt-1`} style={{ borderColor: '#d35d8e' }}>
              {(() => { const won = mockDeals.filter(d => d.stage === 'won').length; return `${(won * 100 / Math.max(mockDeals.length, 1)).toFixed(0)}%`; })()}{()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
