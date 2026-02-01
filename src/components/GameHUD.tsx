import React from 'react';
import { MAX_ELIXIR } from '../types/game';
import type { GameState } from '../types/game';
import { RotateCcw } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, onRestart }) => {
  const { elixir, turn, status, winner } = gameState;

  return (
    <div className="w-full max-w-[500px] mx-auto mb-4 flex flex-col gap-2">
      {/* Header with Turn and Status */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${turn === 'w' ? 'bg-white border-2 border-black' : 'bg-black'}`} />
          <span className="font-bold text-stone-700">
            {turn === 'w' ? 'White' : 'Black'}'s Turn
          </span>
        </div>

        {status !== 'playing' && (
           <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
             {status === 'checkmate' ? `Checkmate! ${winner === 'w' ? 'White' : 'Black'} Wins` : status}
           </div>
        )}

        <button
          onClick={onRestart}
          className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
          title="Restart Game"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Elixir Bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* White */}
        <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-sm flex flex-col items-center">
             <span className="text-xs font-bold text-stone-400 uppercase mb-1">White Elixir</span>
             <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden relative">
                <div
                    className="absolute left-0 top-0 bottom-0 bg-purple-500 transition-all duration-300"
                    style={{ width: `${(elixir.w / MAX_ELIXIR) * 100}%` }}
                />
             </div>
             <span className="text-purple-600 font-bold text-lg mt-1">{elixir.w}/{MAX_ELIXIR}</span>
        </div>

        {/* Black */}
         <div className="bg-black p-2 rounded-lg border border-stone-800 shadow-sm flex flex-col items-center text-white">
             <span className="text-xs font-bold text-stone-500 uppercase mb-1">Black Elixir</span>
             <div className="w-full h-4 bg-stone-800 rounded-full overflow-hidden relative">
                <div
                    className="absolute left-0 top-0 bottom-0 bg-purple-500 transition-all duration-300"
                    style={{ width: `${(elixir.b / MAX_ELIXIR) * 100}%` }}
                />
             </div>
             <span className="text-purple-400 font-bold text-lg mt-1">{elixir.b}/{MAX_ELIXIR}</span>
        </div>
      </div>
    </div>
  );
};
