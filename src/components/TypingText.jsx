import { useEffect, useState } from 'react';

/*
 * TypingText: types each phrase, pauses, deletes it, then moves to the next one.
 * No extra libraries needed.
 *
 * Props
 * - text: a string or an array of strings
 * - typingSpeed / deletingSpeed: milliseconds per character (defaults 75 / 50)
 * - pauseDuration: how long a finished phrase stays on screen, in ms (default 1500)
 * - showCursor, cursorCharacter: the blinking cursor (default "_")
 * - className: classes for the wrapper
 *
 * For people who have "reduce motion" turned on, the first phrase is shown
 * as plain text with no typing and no cursor.
 */
export default function TypingText({
  text,
  typingSpeed = 75,
  deletingSpeed = 50,
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = '_',
  className = '',
}) {
  const phrases = Array.isArray(text) ? text : [text];
  const phrasesKey = phrases.join('|');

  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduceMotion) return undefined;

    const full = phrases[index % phrases.length] || '';
    let timer;

    if (!deleting && shown === full) {
      // Finished typing: wait, then start deleting
      timer = setTimeout(() => setDeleting(true), pauseDuration);
    } else if (deleting && shown === '') {
      // Finished deleting: move to the next phrase
      timer = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      }, 300);
    } else {
      timer = setTimeout(
        () => setShown(deleting ? full.slice(0, shown.length - 1) : full.slice(0, shown.length + 1)),
        deleting ? deletingSpeed : typingSpeed
      );
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, deleting, index, phrasesKey, typingSpeed, deletingSpeed, pauseDuration, reduceMotion]);

  if (reduceMotion) {
    return <span className={className}>{phrases[0]}</span>;
  }

  return (
    <span className={className}>
      <style>{`
        @keyframes typing-cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .typing-cursor { animation: typing-cursor-blink 1s steps(1) infinite; }
      `}</style>
      {shown}
      {showCursor && <span className="typing-cursor">{cursorCharacter}</span>}
    </span>
  );
}