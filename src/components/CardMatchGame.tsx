import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, RefreshCw } from "lucide-react";

interface Card {
  id: string;
  imageId: string;
  imageUrl: string;
  x: number;
  y: number;
  z: number; // Layer (0 is bottom)
}

interface CardMatchGameProps {
  onCollect: (score: number) => void;
  onExit: () => void;
}

const CARD_IMAGES = [
  "https://i.suar.me/a9Z1z/l",
  "https://i.suar.me/lZWm5/l",
  "https://i.suar.me/1z8r3/l",
  "https://i.suar.me/NpQKZ/l",
  "https://i.suar.me/qv7mJ/l",
  "https://i.suar.me/e9WP0/l",
  "https://i.suar.me/OpLE8/l",
  "https://i.suar.me/8z5rL/l",
  "https://i.suar.me/LpQKG/l",
  "https://i.suar.me/jvWmz/l",
  "https://i.suar.me/2z8N3/l",
  "https://i.suar.me/a9ZKZ/l",
  "https://i.suar.me/1z8eY/l",
  "https://i.suar.me/lZWm9/l",
  "https://i.suar.me/qv7m1/l",
  "https://i.suar.me/e9WPd/l",
  "https://i.suar.me/NpQKa/l",
  "https://i.suar.me/OpLEa/l",
];

const MAX_SLOTS = 7;

export default function CardMatchGame({
  onCollect,
  onExit,
}: CardMatchGameProps) {
  const [board, setBoard] = useState<Card[]>([]);
  const [slots, setSlots] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setWon(false);
    setSlots([]);
    setIsPlaying(true);
    setIsMatching(false);
    initializeDeck();
  }, []);

  const initializeDeck = () => {
    const newBoard: Card[] = [];
    const layers = 5;
    const cardsPerLayerCount = 12; // 60 total
    const totalCards = layers * cardsPerLayerCount;
    // ensure multiple of 3
    const numTriplets = totalCards / 3;
    const cardImageIds = Array.from({ length: totalCards }, (_, i) =>
      String(Math.floor(i / 3) % CARD_IMAGES.length),
    );

    // Shuffle
    for (let i = cardImageIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardImageIds[i], cardImageIds[j]] = [cardImageIds[j], cardImageIds[i]];
    }

    let cardIdx = 0;
    // Generate layered grid pattern instead of fully random scatter
    for (let l = 0; l < layers; l++) {
      // Alternate offsets to create interlocking tiles
      const xOffset = l % 2 === 0 ? 0 : 9;
      const yOffset = l % 2 === 0 ? 0 : 7;

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          if (cardIdx >= cardImageIds.length) break;
          const imageId = cardImageIds[cardIdx++];

          newBoard.push({
            id: `${l}-${row}-${col}`,
            imageId: imageId,
            imageUrl: CARD_IMAGES[parseInt(imageId)],
            x: 18 + col * 23 + xOffset,
            y: 12 + row * 17 + yOffset,
            z: l,
          });
        }
      }
    }

    setBoard(newBoard);
  };

  const isClickable = (card: Card) => {
    // Check if any higher layer card covers this one
    return !board.some(
      (other) =>
        other.z > card.z &&
        Math.abs(other.x - card.x) < 14 &&
        Math.abs(other.y - card.y) < 14,
    );
  };

  const handleCardClick = (card: Card) => {
    if (
      gameOver ||
      isMatching ||
      slots.length >= MAX_SLOTS ||
      !isClickable(card)
    )
      return;

    // Remove from board
    const newBoard = board.filter((c) => c.id !== card.id);
    setBoard(newBoard);

    // Add to slots, grouped by imageId
    const newSlots = [...slots];
    const lastIndex = newSlots.map((c) => c.imageId).lastIndexOf(card.imageId);

    if (lastIndex !== -1) {
      // Insert after the last matching item
      newSlots.splice(lastIndex + 1, 0, card);
    } else {
      // Just push to the end
      newSlots.push(card);
    }

    // Check for matches
    const counts: Record<string, number> = {};
    newSlots.forEach((c) => {
      counts[c.imageId] = (counts[c.imageId] || 0) + 1;
    });

    const matchFound = Object.entries(counts).find(([_, count]) => count === 3);

    if (matchFound) {
      setIsMatching(true);
      const [imageId] = matchFound;
      const filteredSlots = newSlots.filter((c) => c.imageId !== imageId);

      // Delay it very slightly just to let the arrival animation play
      setSlots(newSlots); // Temporarily show it
      setTimeout(() => {
        setSlots((currentSlots) =>
          currentSlots.filter((c) => c.imageId !== imageId),
        );
        setScore((prev) => prev + 100);
        setIsMatching(false);
        if (newBoard.length === 0) {
          setWon(true);
          setGameOver(true);
          setScore((prev) => prev + 1000);
        }
      }, 350); // wait for spring animation to finish
    } else {
      setSlots(newSlots);
      if (newSlots.length >= MAX_SLOTS) {
        setGameOver(true);
      } else if (newBoard.length === 0) {
        setWon(true);
        setGameOver(true);
        setScore((prev) => prev + 1000);
      }
    }
  };

  const confirmFinish = () => {
    const rewardTqh = Math.floor(score / 50);
    if (rewardTqh > 0 && (window as any).Adsgram) {
      const AdController = (window as any).Adsgram.init({
        blockId: "int-36012",
      });
      AdController.show()
        .then(() => {
          onCollect(score);
        })
        .catch(() => {
          onCollect(score);
        });
    } else {
      onCollect(score);
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] flex flex-col items-center bg-gradient-to-b from-[#1e1b4b] via-[#0f172a] to-[#050b26] font-sans text-white overflow-hidden">
      {/* Start screen container */}
      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 bg-[#0f172a]/95 flex flex-col items-center justify-center p-6 text-center z-[2005]">
          <div className="max-w-md w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <img
                src="https://i.suar.me/lZWm5/l"
                alt="Icon"
                className="w-12 h-12 object-cover rounded-xl"
              />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-white to-sky-300 bg-clip-text text-transparent">
                TOKEN MATCHER
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Match three identical images to clear the board. Be careful not
                to fill up the slot bar!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
                <span className="text-xs text-slate-400 uppercase">
                  HIGH SCORE
                </span>
                <span className="text-lg font-bold text-white mt-1">-</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xs text-slate-400 uppercase">LAYERS</span>
                <span className="text-lg font-bold text-white mt-1">5</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xl py-5 rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-wider"
            >
              START GAME
            </button>
            <button
              onClick={onExit}
              className="text-slate-400 text-sm font-bold mt-2 hover:text-white transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="w-full max-w-lg mx-auto flex justify-between items-center p-4">
        <button
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full backdrop-blur-sm hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">
            SCORE
          </span>
          <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
            {score}
          </div>
        </div>
        <button
          onClick={initializeDeck}
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full backdrop-blur-sm hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Board */}
      <div className="w-full max-w-sm aspect-[3/4] relative mx-auto my-auto self-center">
        <AnimatePresence>
          {board.map((card) => {
            const clickable = isClickable(card);
            return (
              <motion.button
                key={card.id}
                layoutId={card.id}
                onClick={() => handleCardClick(card)}
                className={`absolute w-[21%] aspect-square rounded-xl overflow-hidden transition-all duration-300 flex items-center justify-center bg-white ${
                  clickable
                    ? "border-[3px] border-indigo-400 hover:scale-105 shadow-[0_4px_12px_rgba(0,0,0,0.3)] z-20 hover:z-50 cursor-pointer"
                    : "border-[3px] border-slate-600/60 brightness-50 cursor-not-allowed shadow-sm"
                }`}
                style={{
                  left: `${card.x}%`,
                  top: `${card.y}%`,
                  zIndex: card.z + (clickable ? 10 : 0),
                  pointerEvents: clickable ? "auto" : "none",
                }}
                initial={{ scale: 0, opacity: 0, y: -40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                whileTap={clickable ? { scale: 0.95 } : {}}
              >
                <img
                  src={card.imageUrl}
                  alt="card"
                  className="w-full h-full object-cover shrink-0"
                />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Slot Container */}
      <div className="w-[94%] max-w-md mx-auto mb-24 sm:mb-28 bg-slate-900/95 backdrop-blur-2xl rounded-2xl p-2.5 sm:p-3 flex gap-1.5 sm:gap-2 items-center justify-center border border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10 box-border h-[80px] sm:h-[90px]">
        <AnimatePresence mode="popLayout">
          {slots.map((card) => (
            <motion.div
              key={card.id}
              layoutId={card.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
              className="flex-1 max-w-[13.5%] h-full bg-white rounded-lg overflow-hidden border-[3px] border-indigo-400 shadow-sm flex-shrink-0 flex items-center justify-center"
            >
              <img
                src={card.imageUrl}
                alt="slot"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {Array.from({ length: MAX_SLOTS - slots.length }).map((_, i) => (
          <div
            key={`empty-${slots.length + i}`}
            className="flex-1 max-w-[13.5%] h-full bg-slate-800/80 rounded-lg border-2 border-slate-600/50 border-dashed flex-shrink-0 shadow-inner"
          />
        ))}
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0f172a]/97 flex flex-col items-center justify-center p-6 text-center z-[2005]"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl"
            >
              <h2
                className={`text-2xl font-black tracking-wider uppercase ${won ? "text-emerald-400" : "text-rose-500"}`}
              >
                {won ? "YOU WON!" : "GAME OVER"}
              </h2>
              <p className="text-slate-400 text-sm -mt-3">
                {won
                  ? "You successfully matched all tokens!"
                  : "Your slot bar is full!"}
              </p>

              <div className="w-full space-y-3">
                <div className="bg-slate-800/40 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total Score:</span>
                  <span className="text-lg font-bold text-white">{score}</span>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-800/40 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-sm text-emerald-400 font-semibold">
                    Reward Earned:
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    +{Math.floor(score / 50)} GQH
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Exchange rate: 50 points = 1 GQH!
              </p>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={startGame}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-colors uppercase tracking-wide"
                >
                  RETRY
                </button>
                <button
                  onClick={confirmFinish}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 uppercase tracking-wide"
                >
                  COLLECT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
