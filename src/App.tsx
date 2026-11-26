import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyEvent,
  type ReactNode,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LONGEST_KEY,
  isNewHighScore,
  shortOfHighScore,
  loadHighScore,
  saveHighScore,
} from "./highScore.ts";
import {
  type Skin,
  SKINS,
  bodyShade,
  loadSkin,
  nextSkin,
  saveSkin,
} from "./skin.ts";
import { loadWrap, saveWrap } from "./wallsMode.ts";
import { levelOf, loadStart, nextStart, paced, saveStart, speedFill } from "./startSpeed.ts";
import { eatHz, loadMuted, play, playRecord, saveMuted, vibrate } from "./sound.ts";
import {
  aheadCell,
  tailShape,
  type Cell,
  type Dir,
  isMilestone,
  type GameState,
  TRAIL,
  trailAfter,
  tabTitle,
  SIZE,
  cellShade,
  keyToDir,
  newGame,
  overlayEdge,
  countdownCell,
  crashReason,
  crashTip,
  hitWall,
  panelCoversRow,
  snakeAbovePanel,
  panelShift,
  pauseIfRunning,
  restart,
  step,
  swipeDir,
  tickCount,
  boostMs,
  COUNT_MS,
  HOLD_MS,
  formatTime,
  togglePause,
  turn,
  nearWall,
  TOP_LEVEL,
} from "./game.ts";

const PAUSE_WHY = "Pause works after the game starts";

const CHEVRON_TURN = { right: 0, down: 90, left: 180, up: 270 };

// The cell size is the CSS variable --cell (index.css): one value sizes the board and every cell.
const px = (n: number) => `calc(var(--cell) * ${n})`;
// Shape and outline tell the cells apart without colour: round food, outlined head, inset body.
const headLook = (skin: Skin, crashed: boolean): CSSProperties => ({
  // On game over the head turns clear red (3:1 against both board shades) to mark the crash cell; the outline keeps the shape.
  background: crashed ? "#f33" : SKINS[skin].head,
  outline: `2px solid ${SKINS[skin].outline}`,
  outlineOffset: -2,
  boxSizing: "border-box",
  borderRadius: "30%", // same as bodyLook
});
// Eye centres in percent of the head cell, two per direction: the eyes sit on the side of the last move.
const EYES: Record<Dir, [number, number][]> = {
  right: [
    [70, 28],
    [70, 72],
  ],
  left: [
    [30, 28],
    [30, 72],
  ],
  up: [
    [28, 30],
    [72, 30],
  ],
  down: [
    [28, 70],
    [72, 70],
  ],
};
const eye = (blink: boolean, crashed: boolean) => ([x, y]: [number, number]) => (
  <span
    key={`${x},${y}`}
    className={blink ? "eye-blink" : undefined}
    data-testid="eye"
    aria-hidden="true"
    style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: "26%",
      height: "26%",
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: crashed ? "#fff" : "#111",
    }}
  />
);
const bodyLook = (
  skin: Skin,
  index: number,
  length: number,
  prev: Cell,
  self: Cell,
): CSSProperties => ({
  background: bodyShade(SKINS[skin].body, index, length),
  boxSizing: "border-box",
  border: "2px solid #222",
  ...(length >= 3 && index === length - 1
    ? tailShape(prev, self)
    : { borderRadius: "30%" }),
});
// A soft upper-left highlight on the base red gives the apple depth; the shape stays a full circle.
const FOOD_LOOK: CSSProperties = { background: "radial-gradient(circle at 30% 30%, #f99, #e44 60%)", borderRadius: "50%" };
// The golden apple is round with a white ring and a glow; its gold-yellow is lighter than the orange skin.
const GOLDEN_LOOK: CSSProperties = {
  background: "linear-gradient(135deg, #ffd84a, #f0a800)",
  borderRadius: "50%",
  boxShadow: "0 0 0 2px #fff inset, 0 0 6px 2px #fc3",
};
// The bonus food is a gold diamond, so it differs from the round red food by shape and colour.
const BONUS_LOOK: CSSProperties = {
  background: "#fc3",
  clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
};

// The shrink fruit is a blue triangle, so it differs from the round food and the diamond by shape and colour.
const SHRINK_LOOK: CSSProperties = {
  background: "#39f",
  clipPath: "polygon(50% 5%, 95% 95%, 5% 95%)",
};

// The tail is dropped on a phone (CSS), so a label never outgrows the panel.
const LEGEND: [CSSProperties, string, string][] = [
  [FOOD_LOOK, "grows", " the snake"],
  [BONUS_LOOK, "slows", " the snake"],
  [SHRINK_LOOK, "shortens", " the snake"],
  [GOLDEN_LOOK, "worth x3", ""],
];

const legend = (
  <ul className="legend" data-testid="food-legend">
    {LEGEND.map(([look, text, more]) => (
      <li key={text}>
        <span className={`legend-swatch${look === GOLDEN_LOOK ? " golden-glow" : ""}`} style={look} aria-hidden="true" />
        {text}
        {more && <span className="legend-more">{more}</span>}
      </li>
    ))}
  </ul>
)

// A sibling of the pickup, because its clip-path would cut the number.
const count = (
  testId: string,
  p: { cell: { x: number; y: number }; movesLeft: number },
) => (
  <div
    data-testid={testId}
    aria-hidden="true"
    style={{
      position: "absolute",
      left: px(p.cell.x),
      top: px(p.cell.y),
      width: px(1),
      height: px(1),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#222", // 5.4:1 on #fc3 and on #39f
      fontSize: "0.5em",
      fontWeight: 700,
      pointerEvents: "none",
    }}
  >
    {p.movesLeft}
  </div>
);

// A rock is grey, a colour none of the snake, food and bonus food uses.
const ROCK_LOOK: CSSProperties = {
  background: "#888",
  boxSizing: "border-box",
  border: "2px solid #555",
};

const wallsHint = (wrap: boolean) =>
  wrap
    ? "Walls off: the snake passes through the edge"
    : "Walls: the edge ends the run";

const TILES = Array.from({ length: SIZE * SIZE }, (_, i) => ({
  x: i % SIZE,
  y: Math.floor(i / SIZE),
}));

function onKeyPress(g: GameState, key: string): GameState {
  const dir = keyToDir(key);
  if (dir) return turn(g, dir);
  if (key === " " || key.toLowerCase() === "p") return togglePause(g);
  if (key === "Escape") return pauseIfRunning(g);
  if (key.toLowerCase() === "r") return restart(g, Math.random);
  if (key === "Enter" && g.status === "over") return restart(g, Math.random);
  return g;
}

// A small label over a value for the eye; the full phrase for a screen reader.
function Stat({
  label,
  value,
  spoken,
  big,
  muted,
  pulse = big && value !== 0,
  gain = 0,
  beats,
  fill,
  accent,
}: {
  accent?: string; // the meter colour: the head colour of the skin
  fill?: number; // 0..1: a thin meter under the value, hidden from screen readers
  beats?: boolean; // the score passes the saved high score: dark gold, and data-record for who misses colour
  gain?: number; // points of the last move: shown as a "+N" pop beside the value
  label: string;
  value: number | string;
  spoken: string;
  big?: boolean;
  muted?: boolean; // no value yet: the word none in a dimmer colour
  pulse?: boolean;
}) {
  return (
    <p
      className={big ? "stat stat-big" : "stat"}
      data-record={beats || undefined}
    >
      <span aria-hidden="true" className="stat-label">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`stat-value${pulse ? " bump" : ""}${muted ? " stat-muted" : ""}`}
        key={value}
      >
        {value}
      </span>
      {fill !== undefined && (
        <span aria-hidden="true" className="stat-meter" style={{ "--levels": TOP_LEVEL } as CSSProperties}>
          <span style={{ width: `${fill * 100}%`, background: accent }} />
        </span>
      )}
      {gain > 0 && (
        // Keyed by value, so the pop replays on each meal.
        <span aria-hidden="true" className={`pop bump${gain >= 3 ? " pop-big" : ""}`} key={`pop${value}`}>
          +{gain}
        </span>
      )}
      <span className="sr-only">{spoken}</span>
    </p>
  );
}

const LOCKED = "Pick the start speed on the start screen, before the first move";

export default function App() {
  const [game, setGame] = useState(() =>
    newGame(Math.random, loadWrap(), "ready"),
  );
  const [best, setBest] = useState(loadHighScore);
  const [longest, setLongest] = useState(() => loadHighScore(LONGEST_KEY));
  const [muted, setMuted] = useState(loadMuted);
  const [start, setStart] = useState(loadStart);
  const [skin, setSkin] = useState(loadSkin);
  // The score of the run when H cleared the record: that run no longer counts. Back to 0 on a new run.
  const [cleared, setCleared] = useState(0);
  // The score of the last finished game; kept for the session only.
  const [last, setLast] = useState<number | null>(null);
  const highScore = Math.max(best, game.score > cleared ? game.score : 0);
  const over = game.status === "over";
  const paused = game.status === "paused";
  const spot = game.count > 0 ? countdownCell(game) : null;
  if (over && last !== game.score) setLast(game.score);
  // The spec counts the length from 1, but the snake starts with 3 cells.
  const length = game.snake.length - 2;
  // The record counts the snake of a finished game; a missing or bad saved value loads as 0.
  if (over && length > longest) setLongest(length);
  const ready = game.status === "ready";
  const speedName = ready ? "Start speed" : "Started at";
  // Keeps the start or paused panel mounted for 150 ms after the game runs, so it fades out.
  const [was, setWas] = useState(game.status);
  const [fading, setFading] = useState<"ready" | "paused" | null>(null);
  if (was !== game.status) {
    setWas(game.status);
    if (
      (was === "ready" || was === "paused") &&
      game.status === "running" &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      setFading(was);
  }
  const leaving = fading !== null && game.status === "running";
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setFading(null), 150);
    return () => clearTimeout(t);
  }, [fading]);
  // The cells the tail left, for the fading glow. Only a running game keeps a trail.
  const [trail, setTrail] = useState<{ snake: Cell[]; cells: Cell[] }>({
    snake: game.snake,
    cells: [],
  });
  if (
    trail.snake !== game.snake ||
    (game.status !== "running" && trail.cells.length)
  )
    setTrail({
      snake: game.snake,
      cells:
        game.status === "running"
          ? trailAfter(trail.cells, trail.snake, game.snake)
          : [],
    });

  // True while the browser repeats the key of the current direction; it never applies outside a running game.
  const [held, setHeld] = useState(false);
  const boost = held && game.status === "running";
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  });
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  });

  useEffect(() => {
    const id = setInterval(
      () => setGame((g) => step(g, Math.random)),
      boostMs(paced(game.score, start), boost),
    );
    return () => clearInterval(id);
  }, [game.score, boost, start]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      setHeld(e.repeat && g.status === "running" && keyToDir(e.key) === g.dir);
    };
    const release = () => setHeld(false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", release);
    };
  }, []);

  if (game.score === 0 && cleared !== 0) setCleared(0);
  if (highScore > best) setBest(highScore);
  // The record before this run: it is refreshed while the score is 0, and frozen once the run scores.
  const [record, setRecord] = useState(best);
  if (game.score === 0 && record !== highScore) setRecord(highScore);
  const newBest = over && isNewHighScore(record, game.score);
  const gap = over ? shortOfHighScore(record, game.score) : null;
  const tip = over ? crashTip(game) : undefined;

  // The ring marks the cell where the food was eaten; the food moves on a meal, so the old cell is the previous food.
  const [seen, setSeen] = useState({
    score: game.score,
    food: game.food,
    golden: game.golden,
  });
  const [ring, setRing] = useState<{
    x: number;
    y: number;
    score: number;
    kind?: "bonus" | "shrink";
  } | null>(null);
  // The head cell of the meal tick: the gulp ends on the next move, when the head leaves this cell.
  const [ate, setAte] = useState<{ x: number; y: number } | null>(null);
  // The "+N" that floats up from the head on a meal; a timer clears it.
  const [gainAt, setGainAt] = useState<{ x: number; y: number; gain: number; score: number } | null>(null);
  useEffect(() => {
    if (!gainAt) return;
    const t = setTimeout(() => setGainAt(null), 600);
    return () => clearTimeout(t);
  }, [gainAt]);
  if (game.score !== seen.score || game.food !== seen.food) {
    if (game.score > seen.score) setGainAt({ ...game.snake[0], gain: game.gain, score: game.score });
    setAte(game.score > seen.score ? game.snake[0] : null);
    // The golden apple keeps its own feedback, so it gets no red ring.
    const meal =
      game.score > seen.score && game.food !== seen.food && !seen.golden;
    setSeen({ score: game.score, food: game.food, golden: game.golden });
    setRing(meal ? { ...seen.food, score: game.score } : null);
  }
  // A special food that left the board under the head was eaten (an expired one is gone elsewhere); it rings in its own colour.
  const [special, setSpecial] = useState({ bonus: game.bonus?.cell, shrink: game.shrink?.cell });
  if (game.bonus?.cell !== special.bonus || game.shrink?.cell !== special.shrink) {
    const head = game.snake[0];
    const eaten = ([["bonus", special.bonus, game.bonus?.cell], ["shrink", special.shrink, game.shrink?.cell]] as const).find(
      ([, was, now]) => was && was !== now && was.x === head.x && was.y === head.y,
    );
    setSpecial({ bonus: game.bonus?.cell, shrink: game.shrink?.cell });
    if (eaten) setRing({ ...eaten[1]!, score: game.score, kind: eaten[0] });
  }

  // The turn the head just made: its count keys the head so the nudge replays; its cell ends the nudge on the next move.
  const [turned, setTurned] = useState({ n: 0, x: -1, y: -1 });
  const lastDir = useRef(game.dir);
  useEffect(() => {
    const was = lastDir.current;
    lastDir.current = game.dir;
    if (game.dir !== was && game.status === "running")
      setTurned((t) => ({ n: t.n + 1, ...game.snake[0] }));
  }, [game.dir, game.status, game.snake]);

  // The edge the head just entered in wrap mode; the object is new on each wrap, so the flash replays.
  const [wrapped, setWrapped] = useState<{ side: "up" | "down" | "left" | "right" } | null>(null);
  const lastHead = useRef(game.snake[0]);
  useEffect(() => {
    const was = lastHead.current;
    const now = game.snake[0];
    lastHead.current = now;
    const dx = now.x - was.x;
    const dy = now.y - was.y;
    if (game.status !== "running" || !game.wrap) return setWrapped(null);
    // A jump of more than one cell is a wrap: the head enters on the side it came towards.
    const side = dx < -1 ? "left" : dx > 1 ? "right" : dy < -1 ? "up" : dy > 1 ? "down" : null;
    if (side) setWrapped({ side });
  }, [game.snake, game.status, game.wrap]);
  useEffect(() => {
    if (!wrapped) return;
    const id = setTimeout(() => setWrapped(null), 250);
    return () => clearTimeout(id);
  }, [wrapped]);

  // Each Walls switch pulses the board border for 300 ms; the first render and a restored mode do not.
  const [switched, setSwitched] = useState(false);
  const wasWrap = useRef(game.wrap);
  useEffect(() => {
    if (wasWrap.current === game.wrap) return;
    wasWrap.current = game.wrap;
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setSwitched(true);
  }, [game.wrap]);
  useEffect(() => {
    if (!switched) return;
    const id = setTimeout(() => setSwitched(false), 300);
    return () => clearTimeout(id);
  }, [switched]);

  const [chimed, setChimed] = useState(0);
  const [sped, setSped] = useState(0);
  const prev = useRef({ score: game.score, over, apples: game.apples });
  useEffect(() => {
    const was = prev.current;
    prev.current = { score: game.score, over, apples: game.apples };
    const milestone = game.apples > was.apples && isMilestone(game.apples);
    if (milestone) setChimed((n) => n + 1);
    const faster =
      game.score > was.score &&
      levelOf(game.score, startRef.current) !==
        levelOf(was.score, startRef.current);
    if (
      faster &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      setSped((n) => n + 1);
    if (muted) return;
    if (over && !was.over) {
      if (newBest) playRecord();
      else play("over");
      vibrate();
    } else if (milestone) play("chime");
    else if (game.score > was.score) play("eat", eatHz(game.score - was.score));
  }, [game.score, game.apples, over, muted, newBest]);

  // Counts the milestones; each one flashes the board border for half a second.
  const [shown, setShown] = useState(0);
  const flashing = chimed > shown;
  useEffect(() => {
    if (!flashing) return;
    const id = setTimeout(() => setShown(chimed), 500);
    return () => clearTimeout(id);
  }, [flashing, chimed]);

  // Counts the speed-ups; each one flashes the board border for 300 ms.
  const [spedShown, setSpedShown] = useState(0);
  const speeding = sped > spedShown;
  useEffect(() => {
    if (!speeding) return;
    const id = setTimeout(() => setSpedShown(sped), 300);
    return () => clearTimeout(id);
  }, [speeding, sped]);

  useEffect(() => {
    if (!game.hold) return;
    const id = setTimeout(() => setGame((g) => ({ ...g, hold: false })), HOLD_MS);
    return () => clearTimeout(id);
  }, [game.hold]);

  useEffect(() => {
    if (game.count === 0) return;
    const id = setTimeout(() => setGame(tickCount), COUNT_MS);
    return () => clearTimeout(id);
  }, [game.count]);

  useEffect(() => {
    document.title = tabTitle(game.status, game.score);
  }, [game.status, game.score]);

  useEffect(() => saveMuted(muted), [muted]);

  useEffect(() => saveWrap(game.wrap), [game.wrap]);

  useEffect(() => saveSkin(skin), [skin]);

  // Counts the C presses; each one names the colour in the hint until 1.5 s pass without another.
  const [skinPressed, setSkinPressed] = useState(0);
  const [skinShown, setSkinShown] = useState(0);
  const naming = skinPressed > skinShown;
  const swatch = (
    <span
      className="skin-swatch"
      data-testid="skin-swatch"
      aria-hidden="true"
      style={{ background: SKINS[skin].head }}
    />
  );
  useEffect(() => {
    if (!naming) return;
    const id = setTimeout(() => setSkinShown(skinPressed), 1500);
    return () => clearTimeout(id);
  }, [naming, skinPressed]);

  useEffect(() => {
    const onSkin = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "c") return;
      setSkin(nextSkin);
      setSkinPressed((n) => n + 1);
    };
    window.addEventListener("keydown", onSkin);
    return () => window.removeEventListener("keydown", onSkin);
  }, []);

  useEffect(() => {
    if (longest > 0) saveHighScore(longest, LONGEST_KEY);
  }, [longest]);

  useEffect(() => {
    saveHighScore(best);
  }, [best]);

  useEffect(() => {
    const onReset = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "h" || game.status === "running") return;
      setBest(0);
      setRecord(0);
      setCleared(game.score);
    };
    window.addEventListener("keydown", onReset);
    return () => window.removeEventListener("keydown", onReset);
  }, [game.status, game.score]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setGame((g) => onKeyPress(g, e.key));
    // Space is the pause key, so it must not also click a focused button.
    // The arrow keys steer, so they must not also scroll the page.
    const noClick = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", noClick);
    window.addEventListener("keyup", noClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", noClick);
      window.removeEventListener("keyup", noClick);
    };
  }, []);

  useEffect(() => {
    const onHide = () => setGame(pauseIfRunning);
    const onVisibility = () => {
      if (document.hidden) onHide();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onHide);
    };
  }, []);

  const again = () => setGame((g) => restart(g, Math.random));
  const toggleWalls = () =>
    setGame((g) => newGame(Math.random, !g.wrap, "ready"));
  // Space and Enter belong to a focused button: keep the window handler from pausing or restarting.
  // Enter clicks the button itself; Space is cancelled by the window handler, so run the action here.
  const ownKeys =
    (action: () => void) => (e: ReactKeyEvent<HTMLButtonElement>) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.stopPropagation();
      if (e.key === " ") {
        e.preventDefault();
        action();
      }
    };
  const restartBtn = useRef<HTMLButtonElement>(null);
  // Enter and Space act on the focused button, so game over must not leave focus on Walls or Mute.
  useEffect(() => {
    const a = document.activeElement;
    if (over && (a === document.body || a?.closest(".controls"))) restartBtn.current?.focus();
  }, [over]);
  const toggleMute = () => setMuted((m) => !m);
  const cycleStart = () => {
    const next = nextStart(start);
    setStart(next);
    saveStart(next);
  };

  useEffect(() => {
    const onToggle = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "b") toggleWalls();
      if (k === "m") toggleMute();
    };
    window.addEventListener("keydown", onToggle);
    return () => window.removeEventListener("keydown", onToggle);
    // Both toggles use functional updates, so the first render's closures stay correct.
  }, []);

  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const onSwipeStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    swipeFrom.current = { x: t.clientX, y: t.clientY };
  };
  const onSwipeEnd = (e: TouchEvent<HTMLDivElement>) => {
    const from = swipeFrom.current;
    swipeFrom.current = null;
    if (!from) return;
    const t = e.changedTouches[0];
    const dir = swipeDir(t.clientX - from.x, t.clientY - from.y);
    if (dir) setGame((g) => turn(g, dir));
  };

  const cell = (
    x: number,
    y: number,
    id: string,
    look: CSSProperties,
    className?: string,
    label?: string,
    children?: ReactNode,
  ) => (
    <div
      // The head is keyed by score, not position: it remounts on each meal so the flash replays.
      key={
        id === "head" || id === "eat-ring"
          ? `${id}${game.score}${id === "head" ? `-${turned.n}` : `${x},${y}`}`
          : `${id}${x},${y}`
      }
      data-testid={id}
      aria-hidden={id === "eat-ring" || id === "chevron" || undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      data-pos={`${x},${y}`}
      className={className}
      style={{
        position: "absolute",
        left: px(x),
        top: px(y),
        width: px(1),
        height: px(1),
        ...look,
      }}
    >
      {children}
    </div>
  );

  return (
    <main>
      <h1>Snake</h1>
      <div className={paused ? "stats stats-paused" : "stats"} role="group" aria-label="Game stats">
        <Stat
          label="Score"
          value={game.score}
          spoken={`Score: ${game.score}`}
          big
          gain={game.gain}
          beats={record > 0 && game.score > record}
        />
        <Stat
          label="Speed"
          value={levelOf(game.score, start)}
          spoken={`Speed ${levelOf(game.score, start)}`}
          pulse={levelOf(game.score, start) !== 1}
          fill={speedFill(levelOf(game.score, start))}
          accent={SKINS[skin].head}
        />
        <Stat
          label="Length"
          value={length}
          spoken={`Length ${length}`}
          pulse={length !== 1}
        />
        <Stat
          label="High score"
          value={highScore}
          spoken={`High score: ${highScore}`}
          big
        />
        <Stat
          label="Last game"
          value={last ?? "none"}
          spoken={`Last game: ${last ?? "none"}`}
          muted={last === null}
          pulse={last !== null}
        />
      </div>
      <div className="controls">
        <button
          ref={restartBtn}
          className={paused || over ? "pause primary" : "pause"}
          disabled={ready}
          onClick={over ? again : () => setGame(togglePause)}
          onKeyDown={over ? ownKeys(again) : undefined}
          aria-keyshortcuts={over ? "R" : "P"}
          aria-describedby={ready ? "pause-why" : undefined}
          title={ready ? PAUSE_WHY : undefined}
        >
          {over ? "Restart" : paused ? "Resume" : "Pause"}
          <kbd aria-hidden="true">{over ? "R" : "P"}</kbd>
        </button>
        {ready && (
          <span id="pause-why" className="sr-only">
            {PAUSE_WHY}
          </span>
        )}
        <button
          className="walls"
          onClick={toggleWalls}
          onKeyDown={ownKeys(toggleWalls)}
          aria-keyshortcuts="B"
          aria-label={`Walls: ${game.wrap ? "wrap" : "solid"}`}
        >
          <span className="mode-name">
            Walls<span className="mode-colon">: </span>
          </span>
          <span className="mode-value">{game.wrap ? "wrap" : "solid"}</span>
          <kbd aria-hidden="true">B</kbd>
        </button>
        <button
          className={`mute${muted ? " muted" : ""}`}
          onClick={toggleMute}
          onKeyDown={ownKeys(toggleMute)}
          aria-keyshortcuts="M"
        >
          <svg
            className="sound-icon"
            data-testid={muted ? "sound-off" : "sound-on"}
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
            <path
              d={muted ? "M11 5l4 6M15 5l-4 6" : "M11 5.5q2 2.5 0 5M13 3.5q4 4.5 0 9"}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          {muted ? "Unmute" : "Mute"}
          <kbd aria-hidden="true">M</kbd>
        </button>
        <button
          className="start-speed"
          aria-label={`${speedName}: ${start}`}
          disabled={!ready}
          title={ready ? undefined : LOCKED}
          aria-describedby={ready ? undefined : "start-speed-why"}
          onClick={cycleStart}
          onKeyDown={ownKeys(cycleStart)}
        >
          <span className="mode-name">
            {speedName}<span className="mode-colon">: </span>
          </span>
          <span className="mode-value">{start}</span>
        </button>
        {!ready && (
          <span id="start-speed-why" className="sr-only">
            {LOCKED}
          </span>
        )}
      </div>
      <div
        className={`board${over ? " board-over" : ""}${game.wrap ? " board-wrap" : ""}${flashing ? " board-milestone" : ""}${speeding ? " board-speed" : ""}${switched ? " board-walls-pulse" : ""}${nearWall(game) ? " board-wall" : ""}`}
        data-testid="board"
        role="group"
        aria-label="Game board"
        data-hit-wall={over ? hitWall(game) : undefined}
        data-wrap-side={wrapped?.side}
        style={{
          position: "relative",
          width: px(SIZE),
          height: px(SIZE),
          background: "#1c1c1c",
          touchAction: "none",
          ...({ "--wrap-glow": SKINS[skin].head } as CSSProperties),
        }}
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        {TILES.map(({ x, y }) => (
          <div
            key={`${x},${y}`}
            data-testid="tile"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: px(x),
              top: px(y),
              width: px(1),
              height: px(1),
              background: cellShade(x, y),
            }}
          />
        ))}
        {(ready || paused) && (
          // Under the pieces, so the snake and food keep their colour while the tiles dim.
          <div
            data-testid="board-dim"
            aria-hidden="true"
            className="board-dim"
          />
        )}
        {gainAt && game.status === "running" && (
          // Clamped one cell in from the side edges; the top row floats down instead of up.
          <div
            key={gainAt.score}
            data-testid="gain-label"
            aria-hidden="true"
            className={`gain-label${gainAt.gain >= 3 ? " pop-big" : ""}${gainAt.y === 0 ? " gain-down" : ""}`}
            style={{ left: px(Math.min(Math.max(gainAt.x, 1), SIZE - 2)), top: px(gainAt.y), width: px(1), height: px(1) }}
          >
            +{gainAt.gain}
          </div>
        )}
        {ring &&
          // Keyed by score so it remounts and replays on each meal; CSS hides it under reduced motion.
          cell(ring.x, ring.y, "eat-ring", {}, `eat-ring${ring.kind ? ` eat-ring-${ring.kind}` : ""}`)}
        {trail.cells.map((c, i) =>
          // Under the snake and food (drawn later); --ghost is the glow strength, fainter the older the cell.
          cell(
            c.x,
            c.y,
            "ghost",
            { "--ghost": 0.5 * (1 - i / TRAIL) } as CSSProperties,
            "ghost",
          ),
        )}
        {game.snake.map((c, i) =>
          i === 0
            ? cell(
                c.x,
                c.y,
                "head",
                headLook(skin, over),
                over
                  ? "head-crash"
                  : game.status === "running" && ate?.x === c.x && ate.y === c.y
                    ? "head-eat"
                    : game.status === "paused" && panelCoversRow(game, c.y)
                      ? "snake-over-panel"
                      : game.status === "running" &&
                          turned.x === c.x &&
                          turned.y === c.y
                        ? "head-turn"
                        : undefined,
                undefined,
                EYES[game.dir].map(eye(game.status === "ready", over)),
              )
            : cell(
                c.x,
                c.y,
                "snake",
                bodyLook(skin, i, game.snake.length, game.snake[i - 1], c),
                over
                  ? "snake-dead"
                  : game.status === "paused" && snakeAbovePanel(game, c.y, false)
                    ? "snake-over-panel"
                    : undefined,
              ),
        )}
        {game.rocks.map((r) => cell(r.x, r.y, "rock", ROCK_LOOK))}
        {(paused || game.hold) &&
          (() => {
            const a = aheadCell(game);
            return (
              a &&
              cell(a.cell.x, a.cell.y, "chevron", { color: SKINS[skin].head, rotate: `${CHEVRON_TURN[a.dir]}deg` }, "chevron", undefined, "›")
            );
          })()}
        {ready &&
          // The ready head faces right with a free cell ahead; the food may sit there, so skip it then.
          !(game.food.x === game.snake[0].x + 1 && game.food.y === game.snake[0].y) &&
          cell(game.snake[0].x + 1, game.snake[0].y, "chevron", { color: SKINS[skin].head }, "chevron", undefined, "›")}
        {cell(
          game.food.x,
          game.food.y,
          "food",
          game.golden ? GOLDEN_LOOK : FOOD_LOOK,
          `${
            game.status === "running"
              ? "pulse food-idle"
              : over
                ? "pulse food-over-panel"
                : "pulse"
          }${game.golden ? " golden-glow" : ""}`,
          game.golden ? "Golden apple" : undefined,
        )}
        {game.bonus &&
          cell(
            game.bonus.cell.x,
            game.bonus.cell.y,
            "bonus",
            BONUS_LOOK,
            "pulse",
            `Bonus food, ${game.bonus.movesLeft} moves left`,
          )}
        {game.shrink &&
          cell(
            game.shrink.cell.x,
            game.shrink.cell.y,
            "shrink",
            SHRINK_LOOK,
            "pulse",
            `Shrink fruit, ${game.shrink.movesLeft} moves left`,
          )}
        {game.bonus && count("bonus-count", game.bonus)}
        {game.shrink && count("shrink-count", game.shrink)}
        {game.count > 0 && (
          <div
            data-testid="countdown"
            aria-hidden="true"
            style={{
              ...(spot
                ? {
                    position: "absolute",
                    left: px(spot.x),
                    top: px(spot.y),
                    width: px(1),
                    height: px(1),
                    alignItems: "center",
                    fontSize: "calc(var(--cell) * 0.9)",
                  }
                : {
                    position: "absolute",
                    inset: 0,
                    alignItems:
                      overlayEdge(game) === "top" ? "flex-start" : "flex-end",
                    padding: "1rem 0",
                    fontSize: "4em",
                  }),
              display: "flex",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 0 6px #000, 0 0 2px #000",
              pointerEvents: "none",
            }}
          >
            <span key={game.count} className="countdown-digit">
              {game.count}
            </span>
          </div>
        )}
        {(ready || paused || over || leaving) && (
          // The label is drawn by CSS from data-label, so the sr-only status below the board is the only spoken copy.
          <div
            data-testid="board-overlay"
            className={`board-overlay board-overlay-light ${
              over ? "" : "board-overlay-under"
            } ${leaving ? "board-overlay-leaving" : ""} ${
              overlayEdge(game) === "top"
                ? "board-overlay-top"
                : "board-overlay-bottom"
            }`}
            aria-hidden="true"
          >
            <div
              className={`overlay-panel ${panelShift(game) ? `panel-${panelShift(game)}` : ""}`}
              style={panelShift(game) ? { maxWidth: `calc(100% - ${panelShift(game) === "left" ? SIZE - game.food.x : game.food.x + 1} * var(--cell) - 4px)` } : undefined}
              data-label={over ? `Game over: ${crashReason(game)}` : paused || (leaving && fading === "paused") ? "Paused" : undefined}
            >
              {(ready || (leaving && fading === "ready")) && (
                <>
                  <span
                    className="overlay-line overlay-hint hint-keys start-hint"
                    data-text="Press an arrow key or WASD to start"
                  />
                  <span
                    className="overlay-line overlay-hint hint-touch start-hint"
                    data-text="Swipe on the board to start"
                  />
                  <span
                    className="overlay-line overlay-hint"
                    data-text={wallsHint(game.wrap)}
                  />
                  <span
                    className="overlay-line overlay-hint"
                    data-text={`Start speed: ${start}`}
                  />
                  {legend}
                </>
              )}
              {over && (
                <>
                  <span
                    className="overlay-line overlay-score"
                    data-text={`Final score: ${game.score}`}
                  />
                  {gap && (
                    <span className="overlay-line overlay-detail" data-text={gap} />
                  )}
                  {game.streaks > 0 && (
                    <span
                      className="overlay-line overlay-detail"
                      data-text={`Streak meals: ${game.streaks}`}
                    />
                  )}
                  {game.apples > 0 && (
                    <span className="overlay-stats overlay-detail">
                      <span className="overlay-line" data-text={`Time\u00a0${formatTime(game.ms)}`} />
                      <span className="overlay-line" data-text={`Apples\u00a0${game.apples}`} />
                      <span className="overlay-line" data-text={`Longest\u00a0${longest}`} />
                    </span>
                  )}
                  {newBest && (
                    <span
                      className="overlay-line overlay-record"
                      data-text="New high score!"
                    />
                  )}
                  {tip && <span className="overlay-line overlay-detail" data-text={tip} />}
                  <span
                    className="overlay-line overlay-hint overlay-restart hint-keys"
                    data-text="Press Enter or R to restart"
                  />
                  <span
                    className="overlay-line overlay-hint overlay-restart hint-touch"
                    data-text="Tap Restart"
                  />
                  {highScore > 0 && (
                    <span
                      className="overlay-line overlay-hint hint-keys"
                      data-text="H resets the high score"
                    />
                  )}
                </>
              )}
              {(paused || (leaving && fading === "paused")) && (
                <>
                  <span
                    className="overlay-line overlay-hint hint-keys"
                    data-text="Press Space or P to resume"
                  />
                  <span
                    className="overlay-line overlay-hint hint-touch"
                    data-text="Tap Resume"
                  />
                  {legend}
                  {highScore > 0 && (
                    <span
                      className="overlay-line overlay-hint hint-keys"
                      data-text="H resets the high score"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="help">
        <span className="sr-only">Arrows or WASD move, C changes the snake colour</span>
        {naming ? (
          <span aria-hidden="true" style={{ color: SKINS[skin].head }}>
            {swatch}
            Snake colour: {skin}
          </span>
        ) : (
          <span aria-hidden="true" className="hint-keys">
            <span className="hint-idea">
              {swatch}
              <kbd>Arrows</kbd> or <kbd>WASD</kbd> move
            </span>
            <span className="hint-dot"> · </span>
            <span className="hint-idea">
              <kbd>C</kbd> changes the snake colour
            </span>
          </span>
        )}
      </p>
      {naming && (
        <p role="status" className="sr-only">
          Snake colour: {skin}
        </p>
      )}
      <div className="messages">
        {ready && (
          <p role="status" className="sr-only">
            <span className="hint-keys">
              Press an arrow key or WASD to start
            </span>
            <span className="hint-touch">Swipe on the board to start</span>
            <span>{wallsHint(game.wrap)}</span>
          </p>
        )}
        {game.count > 0 && (
          <p role="status" className="sr-only">
            {game.count}
          </p>
        )}
        {paused && (
          <p role="status" className="sr-only">
            Paused
          </p>
        )}
        {paused && (
          <p className="sr-only">
            Diamond slows the snake, triangle shortens the snake, golden apple is worth x3
          </p>
        )}
        {game.score > 0 && !over && (
          // Mounted only after the first meal and not at game over, so the alert stays the only message then.
          <p role="status" className="sr-only">
            Score {game.score}
          </p>
        )}
        {over && (
          <div role="alert">
            <p className="sr-only">Game over<span>: {crashReason(game)}</span></p>
            <p className="sr-only">Final score: {game.score}</p>
            {game.streaks > 0 && (
              <p className="sr-only">Streak meals: {game.streaks}</p>
            )}
            <p className="sr-only">Time {formatTime(game.ms)}</p>
            <p className="sr-only">Apples: {game.apples}</p>
            <p className="sr-only">Longest: {longest}</p>
            {gap && <p className="sr-only">{gap}</p>}
            {tip && <p className="sr-only">{tip}</p>}
            {newBest && <p className="sr-only">New high score!</p>}
          </div>
        )}
      </div>
    </main>
  );
}
