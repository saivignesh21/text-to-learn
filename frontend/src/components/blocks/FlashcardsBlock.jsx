import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import './FlashcardsBlock.css';

const Flashcard = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <div className="flashcard-content">
            <h3>{front}</h3>
          </div>
          <div className="flashcard-hint">
            <RotateCw size={12} /> Click to reveal
          </div>
        </div>
        <div className="flashcard-back">
          <div className="flashcard-content">
            <p>{back}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashcardsBlock = ({ cards }) => {
  const [flipAll, setFlipAll] = useState(false);

  if (!cards || cards.length === 0) return null;

  return (
    <div className="flashcards-container">
      <div className="flashcards-grid">
        {cards.map((card, index) => (
          <Flashcard 
            key={index} 
            front={card.front} 
            back={card.back} 
          />
        ))}
      </div>
    </div>
  );
};

export default FlashcardsBlock;
