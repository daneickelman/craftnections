import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import styles from './styles.module.css';

type Category = string;
type Word = string;
type Attempt = string;
type Color = 'yellow' | 'green' | 'blue' | 'purple';
type Status = 'win' | 'loss' | 'inprogress';

const GAME: Record<Category, Word[]> = {
  'Trivia rounds at the Bearded Tit': [
    'Cryptic',
    'General',
    'Kazoo',
    'Picture',
  ],
  'Monster flavours': ['Mango', 'Peach', 'Strawberry', 'Violet'],
  'Songs on the Orpheum playlist': [
    'Afterlife',
    'Dissolve',
    'Glasses',
    'Whisper',
  ],
  '_____ Quartz': ['Clear', 'Crystal', 'Rose', 'Smoky'],
};

const SORTED_WORDS: Word[] = [
  'Crystal',
  'Clear',
  'Picture',
  'Dissolve',
  'General',
  'Glasses',
  'Kazoo',
  'Afterlife',
  'Strawberry',
  'Whisper',
  'Peach',
  'Smoky',
  'Cryptic',
  'Rose',
  'Mango',
  'Violet',
];

const CATEGORY_COLOURS: Record<Category, Color> = {
  'Monster flavours': 'yellow',
  'Trivia rounds at the Bearded Tit': 'green',
  'Songs on the Orpheum playlist': 'blue',
  '_____ Quartz': 'purple',
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
      <div style={{ fontSize: 18 }}>{category}</div>
      <div style={{ fontSize: 14 }}>{toAttempt(GAME[category])}</div>
    </div>
  );
};

const Message: FC<PropsWithChildren> = ({ children }) => {
  return <div className={styles.message}>{children}</div>;
};

export const App: FC = () => {
  const [remainingWords, setRemainingWords] = useState<Word[]>(SORTED_WORDS);
  const [foundCategories, setFoundCategores] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Word[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<Status>('inprogress');

  const totalAttempts = 4;
  const attemptsRemaining = totalAttempts - attempts.length;

  useEffect(() => {
    if (status !== 'loss') {
      setTimeout(() => {
        setMessage('');
      }, 2500);
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

  const isOneAway = useCallback(() => {
    return (
      Object.values(GAME)
        .map((words) => words.filter((w) => selected.includes(w)))
        .filter((matching) => matching.length === 3).length > 0
    );
  }, [selected]);

  const reset = useCallback(() => {
    setAttempts([]);
    setSelected([]);
    setRemainingWords(SORTED_WORDS);
    setFoundCategores([]);
    setStatus('inprogress');
    setMessage('Resetting board');
  }, []);

  const deselectAll = useCallback(() => {
    setSelected([]);
  }, []);

  const submit = useCallback(() => {
    const attempt = toAttempt(selected);
    if (attempts.includes(attempt)) {
      setMessage('Already guessed!');
      return;
    }

    const category = CATEGORY_BY_ATTEMPT[attempt] || null;
    if (!category) {
      setAttempts([...attempts, attempt]);
      if (isOneAway()) {
        setMessage('One away...');
      }
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
