import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import styles from './styles.module.css';

/* 

Category ideas:
Bars - burrow, EO, SILY, old mates place, tiki bar
Something about the places we're going to
movies we've watched together
stuff from melbourne
things we've done with lauren - distilled, burlesque/swamp, antiquing, 
*/

type Category = string;
type Word = string;
type Attempt = string;
type Color = 'yellow' | 'green' | 'blue' | 'purple';
type Status = 'win' | 'loss' | 'inprogress';

const GAME: Record<Category, Word[]> = {
  'Category 1': ['Another', 'Bee', 'Cards', 'Digging'],
  'Category 2': ['Eager', 'Flies', 'Green', 'Helicopter'],
  'Category 3': ['Indigo', 'Jolly', 'Keeper', 'Lemon'],
  'Category 4': ['Me', 'November', 'Oven', 'Pied Piper i guess'],
};

const CATEGORY_COLOURS: Record<Category, Color> = {
  'Category 1': 'yellow',
  'Category 2': 'green',
  'Category 3': 'blue',
  'Category 4': 'purple',
};

const CATEGORY_BY_ATTEMPT: Record<Attempt, Category> = Object.fromEntries(
  Object.entries(GAME).map(([category, words]) => [toAttempt(words), category]),
);

function toAttempt(selected: Word[]): Attempt {
  return selected.sort().join(', ');
}

const Card: FC<{
  word: string;
  isSelected: boolean;
  toggleSelect: (v: string) => void;
}> = ({ word, isSelected, toggleSelect }) => {
  const [fontSize, setFontSize] = useState(18);
  const divRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!divRef.current || !spanRef.current) return;
    const divWidth = divRef.current.getBoundingClientRect().width;
    const spanWidth = spanRef.current.getBoundingClientRect().width;
    if (spanWidth > divWidth * 0.8) {
      setFontSize(fontSize - 1);
    }
  }, [divRef.current, spanRef.current, fontSize]);

  const className = isSelected
    ? `${styles.card} ${styles.selected}`
    : styles.card;

  return (
    <div
      className={className}
      onClick={() => toggleSelect(word)}
      style={{ fontSize }}
      ref={divRef}
    >
      <span ref={spanRef}>{word}</span>
    </div>
  );
};

const FoundCategory: FC<{ category: Category }> = ({ category }) => {
  const colour = CATEGORY_COLOURS[category];
  const backgroundColor = `var(--${colour}-bg)`;
  const color = `var(--${colour}-text)`;
  return (
    <div className={styles.foundCategory} style={{ backgroundColor, color }}>
      <div>{category}</div>
      <div>{toAttempt(GAME[category])}</div>
    </div>
  );
};

const Message: FC<PropsWithChildren> = ({ children }) => {
  return <div className={styles.message}>{children}</div>;
};

export const App: FC = () => {
  const initialWords = Object.values(GAME).flat();
  const [remainingWords, setRemainingWords] = useState<Word[]>(initialWords);
  const [foundCategories, setFoundCategores] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Word[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<Status>('inprogress');

  // TODO fail when out of attempts
  const totalAttempts = 4;
  const attemptsRemaining = totalAttempts - attempts.length;

  useEffect(() => {
    if (status === 'inprogress') {
      setTimeout(() => {
        setMessage('');
      }, 3500);
    }
  }, [message]);

  useEffect(() => {
    if (attempts.length === totalAttempts) {
      setStatus('loss');
      setMessage(
        'Uh oh.. maybe I made it too hard but you can reset and try again!',
      );
    }
  }, [attempts]);

  useEffect(() => {
    if (foundCategories.length === 4) {
      setStatus('win');
      setMessage('Go team!');
    }
  }, [foundCategories]);

  const toggleSelect = useCallback(
    (word: string) => {
      if (selected.includes(word)) {
        setSelected(selected.filter((w) => w !== word));
      } else if (selected.length < 4) {
        setSelected([...selected, word]);
      }
    },
    [selected, setSelected],
  );

  const reset = useCallback(() => {
    setAttempts([]);
    setSelected([]);
    setRemainingWords(initialWords);
    setFoundCategores([]);
    setStatus('inprogress');
    setMessage('Resetting board');
  }, [setAttempts]);

  const deselectAll = useCallback(() => {
    setSelected([]);
  }, [setSelected]);

  const submit = useCallback(() => {
    const attempt = toAttempt(selected);
    if (attempts.includes(attempt)) {
      setMessage('Already guessed!');
      return;
    }

    const category = CATEGORY_BY_ATTEMPT[attempt] || null;
    if (!category) {
      setAttempts([...attempts, attempt]);
      return;
    }

    const categoryWords = GAME[category];
    setRemainingWords(remainingWords.filter((w) => !categoryWords.includes(w)));
    setFoundCategores([...foundCategories, category]);
    setSelected([]);
  }, [attempts, setAttempts, selected, setSelected]);

  return (
    <div className={styles.page}>
      <h1>Connections</h1>
      <p>Create four groups of four!</p>
      {message && <Message>{message}</Message>}
      <div className={styles.board}>
        {foundCategories.map((c) => (
          <FoundCategory key={c} category={c} />
        ))}
        {remainingWords.map((w) => (
          <Card
            key={w}
            word={w}
            isSelected={selected.includes(w)}
            toggleSelect={toggleSelect}
          />
        ))}
      </div>
      <div className={styles.attemptsRemaining}>
        <span>Attempts remaining:</span>
        {Array(attemptsRemaining)
          .fill(null)
          .map((_, n) => (
            <span key={n}>x</span>
          ))}
      </div>
      <div className={styles.actions}>
        <button onClick={reset}>Reset</button>
        <button onClick={deselectAll}>Deselect all</button>
        <button onClick={submit} disabled={selected.length < 4}>
          Submit
        </button>
      </div>
    </div>
  );
};
