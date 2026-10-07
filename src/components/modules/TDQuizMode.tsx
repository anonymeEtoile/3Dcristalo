import React, { useState } from 'react';
import { TD_QUIZ_QUESTIONS } from '../../data/crystallographyData';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';

export default function TDQuizMode() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const currentQ = TD_QUIZ_QUESTIONS[currentIndex];
  const total = TD_QUIZ_QUESTIONS.length;

  const handleSelectOption = (optIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIndex }));
    setShowExplanation((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanation({});
    setCurrentIndex(0);
  };

  // Score calculation
  const score = Object.entries(selectedAnswers).reduce((acc, [qIdx, ans]) => {
    const q = TD_QUIZ_QUESTIONS[parseInt(qIdx)];
    return acc + (ans === q.correctIndex ? 1 : 0);
  }, 0);

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const userAnswer = selectedAnswers[currentIndex];
  const isCorrect = userAnswer === currentQ.correctIndex;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            {currentQ.exercise}
          </div>
          <h2 className="text-base font-bold text-slate-100">
            Entraînement Interactif & Questions de TD (PEIP)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Score actuel</div>
            <div className="text-base font-mono font-bold text-emerald-400">
              {score} / {answeredCount} ({answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0}%)
            </div>
          </div>
          {answeredCount === total && (
            <button
              onClick={handleReset}
              className="p-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>
              Question {currentIndex + 1} sur {total}
            </span>
            {currentQ.context && (
              <span className="italic text-slate-400">{currentQ.context}</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-100 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            let itemStyle = 'bg-slate-950/50 border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700';
            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                itemStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200 font-medium';
              } else if (idx === userAnswer) {
                itemStyle = 'bg-rose-500/15 border-rose-500 text-rose-200';
              } else {
                itemStyle = 'bg-slate-950/30 border-slate-800/60 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-3.5 rounded-lg border text-left text-sm flex items-center justify-between transition-colors ${itemStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-800/80 text-xs font-mono font-bold flex items-center justify-center text-slate-300 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>
                {isAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isAnswered && idx === userAnswer && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Deck */}
        {isAnswered && (
          <div
            className={`p-4 rounded-lg border text-xs space-y-2 ${
              isCorrect
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>Explication détaillée :</span>
            </div>
            <p className="leading-relaxed text-slate-300">{currentQ.explanation}</p>
            {currentQ.formulaDetail && (
              <div className="font-mono text-emerald-400 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                {currentQ.formulaDetail}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
          >
            Question précédente
          </button>

          <button
            disabled={currentIndex === total - 1}
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            <span>Question suivante</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
