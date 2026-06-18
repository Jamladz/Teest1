import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, RefreshCw } from 'lucide-react';

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
  "https://i.suar.me/a9Z1z/l", "https://i.suar.me/lZWm5/l", "https://i.suar.me/1z8r3/l",
  "https://i.suar.me/NpQKZ/l", "https://i.suar.me/qv7mJ/l", "https://i.suar.me/e9WP0/l",
  "https://i.suar.me/OpLE8/l", "https://i.suar.me/8z5rL/l", "https://i.suar.me/LpQKG/l",
  "https://i.suar.me/jvWmz/l", "https://i.suar.me/2z8N3/l", "https://i.suar.me/a9ZKZ/l",
  "https://i.suar.me/1z8eY/l", "https://i.suar.me/lZWm9/l", "https://i.suar.me/qv7m1/l",
  "https://i.suar.me/e9WPd/l", "https://i.suar.me/NpQKa/l", "https://i.suar.me/OpLEa/l"
];

const MAX_SLOTS = 7;

export default function CardMatchGame({ onCollect, onExit }: CardMatchGameProps) {
  const [board, setBoard] = useState<Card[]>([]);
  const [slots, setSlots] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initializeDeck = useCallback(() => {
    const newBoard: Card[] = [];
    const layers = 5;
    const cardsPerLayerCount = 10;
    // Generate enough cards in triplets to reasonably fill the board
    const numTriplets = Math.floor((layers * cardsPerLayerCount) / 3);
    const cardImageIds = Array.from({length: numTriplets * 3}, (_, i) => String(i % CARD_IMAGES.length));
    
    // Shuffle cardImageIds
    for (let i = cardImageIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardImageIds[i], cardImageIds[j]] = [cardImageIds[j], cardImageIds[i]];
    }

    let cardIdx = 0;
    for (let l = 0; l < layers; l++) {
      for (let i = 0; i < cardsPerLayerCount; i++) {
        if (cardIdx >= cardImageIds.length) break;
        const imageId = cardImageIds[cardIdx++];
        newBoard.push({
          id: `${l}-${i}`,
          imageId: imageId,
          imageUrl: CARD_IMAGES[parseInt(imageId)],
          x: 10 + Math.random() * 75,
          y: 5 + Math.random() * 65,
          z: l,
        });
      }
    }
    
    setBoard(newBoard);
    setSlots([]);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    initializeDeck();
  }, [initializeDeck]);

  const isClickable = (card: Card) => {
    // Check if any higher layer card covers this one
    return !board.some(other => 
      other.z > card.z && 
      Math.abs(other.x - card.x) < 8 &&
      Math.abs(other.y - card.y) < 8
    );
  };

  const handleCardClick = (card: Card) => {
    if (gameOver || slots.length >= MAX_SLOTS || !isClickable(card)) return;

    // Remove from board
    const newBoard = board.filter(c => c.id !== card.id);
    setBoard(newBoard);
    
    // Add to slots
    const newSlots = [...slots, card];
    
    // Check for matches
    const counts: Record<string, number> = {};
    newSlots.forEach(c => {
      counts[c.imageId] = (counts[c.imageId] || 0) + 1;
    });

    const matchFound = Object.entries(counts).find(([_, count]) => count === 3);
    
    if (matchFound) {
      const [imageId] = matchFound;
      const filteredSlots = newSlots.filter(c => c.imageId !== imageId);
      setSlots(filteredSlots);
      setScore(prev => prev + 100);
    } else {
      setSlots(newSlots);
      if (newSlots.length >= MAX_SLOTS) {
        setGameOver(true);
      } else if (newBoard.length === 0) {
        setWon(true);
        setGameOver(true);
        setScore(prev => prev + 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050b26] z-50 flex flex-col items-center p-4 font-sans text-white">
      <div className="w-full flex justify-between items-center mb-6 px-2">
        <button onClick={onExit} className="p-2 bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
        <div className="text-xl font-black">{score}</div>
        <button onClick={initializeDeck} className="p-2 bg-slate-800 rounded-full"><RefreshCw className="w-5 h-5"/></button>
      </div>

      <div className="flex-1 w-full relative">
        {board.map((card) => {
          const clickable = isClickable(card);
          return (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`absolute w-14 h-14 rounded-xl overflow-hidden border-2 ${clickable ? 'border-sky-300 shadow-lg shadow-sky-900/50' : 'border-slate-800 brightness-[0.3] cursor-not-allowed'}`}
              style={{
                left: `${card.x}%`,
                top: `${card.y}%`,
                zIndex: card.z,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={clickable ? { scale: 1.15, rotate: 2 } : {}}
              whileTap={clickable ? { scale: 0.9 } : {}}
            >
              <img src={card.imageUrl} alt="card" className="w-full h-full object-cover"/>
            </motion.button>
          );
        })}
      </div>

      <div className="w-full bg-[#050b26]/50 rounded-2xl p-3 flex -space-x-3 items-center justify-center border-2 border-slate-800 mt-auto">
        {slots.map((card, idx) => (
          <div key={idx} className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-950 flex-shrink-0">
            <img src={card.imageUrl} alt="slot" className="w-full h-full object-cover" />
          </div>
        ))}
        {Array.from({ length: MAX_SLOTS - slots.length }).map((_, i) => (
          <div key={i} className="w-12 h-12 bg-slate-950 rounded-lg border-2 border-slate-800 flex-shrink-0" />
        ))}
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-900 p-8 rounded-3xl text-center border border-slate-700 w-full max-w-sm mx-4">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black mb-2">{won ? 'You Won!' : 'Game Over'}</h2>
              <p className="text-lg font-bold mb-6">Score: {score}</p>
              <div className="flex gap-4">
                <button onClick={initializeDeck} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold">إعادة</button>
                <button onClick={() => onCollect(score)} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold">جمع</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
