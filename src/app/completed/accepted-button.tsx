"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

export function AcceptedButton({ company }: { company: string }) {
  const [showModal, setShowModal] = useState(false);

  function handleClick() {
    setShowModal(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, angle: 60 }), 200);
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, angle: 120 }), 400);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50 transition"
      >
        Got the offer
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative mx-4 max-w-sm rounded-3xl border border-white/10 bg-[#0e0e12] p-8 text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-semibold text-white">Congratulations!</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              You got the offer at <span className="text-white font-medium">{company}</span>. All that work paid off — celebrate this moment.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 transition"
            >
              Thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
