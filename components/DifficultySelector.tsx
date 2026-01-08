import React from 'react';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DifficultySelectorProps {
  onSelect: (difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelect, onBack }) => {
  const { t } = useLanguage();

  const getDifficultyColor = (diff: DifficultyLevel) => {
    switch (diff) {
      case DifficultyLevel.BEGINNER:
        return 'from-green-600 to-green-700';
      case DifficultyLevel.NORMAL:
        return 'from-orange-600 to-orange-700';
      case DifficultyLevel.MASTER:
        return 'from-red-600 to-red-700';
    }
  };

  const getDifficultyIcon = (diff: DifficultyLevel) => {
    switch (diff) {
      case DifficultyLevel.BEGINNER:
        return '🌱';
      case DifficultyLevel.NORMAL:
        return '⚡';
      case DifficultyLevel.MASTER:
        return '👑';
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-heritage-black via-zinc-900 to-heritage-black relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(234, 88, 12, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)',
        }} />
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        <button
          onClick={onBack}
          className="absolute top-0 left-0 text-white/60 hover:text-white transition-colors mb-8 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t('game_exit')}
        </button>

        <h1 className="text-4xl md:text-5xl font-serif text-heritage-orange text-center mb-3 mt-12 drop-shadow-lg">
          {t('diff_select_title')}
        </h1>
        <p className="text-heritage-cream text-center mb-12 text-sm opacity-80">
          {t('home_title_2')}
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[DifficultyLevel.BEGINNER, DifficultyLevel.NORMAL, DifficultyLevel.MASTER].map((diff) => {
            const config = DIFFICULTY_CONFIGS[diff];
            const colorClass = getDifficultyColor(diff);
            const icon = getDifficultyIcon(diff);

            return (
              <button
                key={diff}
                onClick={() => onSelect(diff)}
                className="group relative bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-2 border-white/10 rounded-2xl p-6 hover:border-heritage-orange/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-heritage-orange/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4 text-center">{icon}</div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    {t(`diff_${diff.toLowerCase()}` as any)}
                  </h2>
                  
                  <p className="text-heritage-gray text-sm mb-6 text-center leading-relaxed">
                    {t(`diff_${diff.toLowerCase()}_desc` as any)}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-heritage-gray">{t('diff_time_window')}</span>
                      <span className="text-heritage-orange font-bold">{config.airWindow}s</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-heritage-gray">{t('diff_retry')}</span>
                      <span className={config.allowRetry ? 'text-green-400' : 'text-red-400'}>
                        {config.allowRetry ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-heritage-gray">{t('diff_hints')}</span>
                      <span className={config.showGuideLine ? 'text-green-400' : 'text-red-400'}>
                        {config.showGuideLine ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-heritage-gray">{t('diff_combo')}</span>
                      <span className={config.enableCombo ? 'text-green-400' : 'text-red-400'}>
                        {config.enableCombo ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  <div className={`w-full py-3 rounded-lg bg-gradient-to-r ${colorClass} text-white font-bold text-sm tracking-wider group-hover:shadow-lg transition-shadow`}>
                    {t('diff_start')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DifficultySelector;
