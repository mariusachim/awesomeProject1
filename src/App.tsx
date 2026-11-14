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
import { loadMuted, play, saveMuted, vibrate } from "./sound.ts";
import {
  type Cell,
  type Dir,
  isMilestone,
  type GameState,
  TRAIL,
  trailAfter,
  SIZE,
  cellShade,
  keyToDir,
  newGame,
  overlayEdge,
  pauseIfRunning,
  restart,
  speedLevel,
  step,
  swipeDir,
  tickCount,
  boostMs,
  COUNT_MS,
  formatTime,
  togglePause,
  turn,
  nearWall,
} from "./game.ts";

// The cell size is the CSS variable --cell (index.css): one value sizes the board and every cell.
const px = (n: number) => `calc(var(--cell) * ${n})`;
// Shape and outline tell the cells apart without colour: round food, outlined head, inset body.
const headLook = (skin: Skin, crashed: boolean): CSSProperties => ({
  // On game over the head turns red to mark the crash cell; the outline keeps the shape.
  background: crashed ? "#e44" : SKINS[skin].head,
  outline: `2px solid ${SKINS[skin].outline}`,
  outlineOffset: -2,
  boxSizing: "border-box",
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
const eye = ([x, y]: [number, number]) => (
  <span
    key={`${x},${y}`}
    data-testid="eye"
    aria-hidden="true"
    style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: "18%",
      height: "18%",
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: "#111",
    }}
  />
);
const bodyLook = (
  skin: Skin,
  index: number,
  length: number,
): CSSProperties => ({
  background: bodyShade(SKINS[skin].body, index, length),
  boxSizing: "border-box",
  border: "2px solid #222",
  borderRadius: "30%",
});
const FOOD_LOOK: CSSProperties = { background: "#e44", borderRadius: "50%" };
// The golden apple is round like the food but orange with a white ring; the bonus diamond is yellow.
const GOLDEN_LOOK: CSSProperties = {
  background: "#f90",
  borderRadius: "50%",
  boxShadow: "0 0 0 2px #fff inset",
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
  if (key === "Enter" && g.status === "over")
    return newGame(Math.random, g.wrap);
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
}: {
  beats?: boolean; // the score passes the saved high score: dark gold, and data-record for who misses colour
  gain?: number; // points of the last move: shown as a "+N" pop beside the value
  label: string;
  value: number | string;
  spoken: string;
  big?: boolean;
  muted?: boolean; // no value yet: a dash in a dimmer colour
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
      {gain > 0 && (
        // Keyed by value, so the pop replays on each meal.
        <span aria-hidden="true" className="pop bump" key={`pop${value}`}>
          +{gain}
        </span>
      )}
      <span className="sr-only">{spoken}</span>
    </p>
  );
}

export default function App() {
  const [game, setGame] = useState(() =>
    newGame(Math.random, loadWrap(), "ready"),
  );
  const [best, setBest] = useState(loadHighScore);
  const [longest, setLongest] = useState(() => loadHighScore(LONGEST_KEY));
  const [muted, setMuted] = useState(loadMuted);
  const [skin, setSkin] = useState(loadSkin);
  // The score of the run when H cleared the record: that run no longer counts. Back to 0 on a new run.
  const [cleared, setCleared] = useState(0);
  // The score of the last finished game; kept for the session only.
  const [last, setLast] = useState<number | null>(null);
  const highScore = Math.max(best, game.score > cleared ? game.score : 0);
  const over = game.status === "over";
  const paused = game.status === "paused";
  if (over && last !== game.score) setLast(game.score);
  // The spec counts the length from 1, but the snake starts with 3 cells.
  const length = game.snake.length - 2;
  // The record counts the snake of a finished game; a missing or bad saved value loads as 0.
  if (over && length > longest) setLongest(length);
  const ready = game.status === "ready";
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
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  });

  useEffect(() => {
    const id = setInterval(
      () => setGame((g) => step(g, Math.random)),
      boostMs(game.score, boost),
    );
    return () => clearInterval(id);
  }, [game.score, boost]);

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
  } | null>(null);
  if (game.score !== seen.score || game.food !== seen.food) {
    // The golden apple keeps its own feedback, so it gets no red ring.
    const meal =
      game.score > seen.score && game.food !== seen.food && !seen.golden;
    setSeen({ score: game.score, food: game.food, golden: game.golden });
    setRing(meal ? { ...seen.food, score: game.score } : null);
  }

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
      speedLevel(game.score) !== speedLevel(was.score);
    if (
      faster &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      setSped((n) => n + 1);
    if (muted) return;
    if (over && !was.over) {
      play("over");
      vibrate();
    } else if (milestone) play("chime");
    else if (game.score > was.score) play("eat");
  }, [game.score, game.apples, over, muted]);

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
    if (game.count === 0) return;
    const id = setTimeout(() => setGame(tickCount), COUNT_MS);
    return () => clearTimeout(id);
  }, [game.count]);

  useEffect(() => saveMuted(muted), [muted]);

  useEffect(() => saveWrap(game.wrap), [game.wrap]);

  useEffect(() => saveSkin(skin), [skin]);

  useEffect(() => {
    const onSkin = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "c") setSkin(nextSkin);
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

  const again = () => setGame(newGame(Math.random, game.wrap));
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
  const toggleMute = () => setMuted((m) => !m);

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
          ? `${id}${game.score}`
          : `${id}${x},${y}`
      }
      data-testid={id}
      aria-hidden={id === "eat-ring" || undefined}
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
      <div className="stats" role="group" aria-label="Game stats">
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
          value={speedLevel(game.score)}
          spoken={`Speed ${speedLevel(game.score)}`}
          pulse={speedLevel(game.score) !== 1}
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
          value={last ?? "–"}
          spoken={`Last game: ${last ?? "none"}`}
          muted={last === null}
        />
      </div>
      <div className="controls">
        <button
          className={paused || over ? "pause primary" : "pause"}
          disabled={ready}
          onClick={over ? again : () => setGame(togglePause)}
          onKeyDown={over ? ownKeys(again) : undefined}
          aria-keyshortcuts={over ? "R" : "P"}
        >
          {over ? "Restart" : paused ? "Resume" : "Pause"}
          <kbd aria-hidden="true">{over ? "R" : "P"}</kbd>
        </button>
        <button
          className="walls"
          onClick={toggleWalls}
          onKeyDown={ownKeys(toggleWalls)}
          aria-keyshortcuts="B"
        >
          Walls: {game.wrap ? "wrap" : "solid"}
          <kbd aria-hidden="true">B</kbd>
        </button>
        <button
          className={`mute${muted ? " muted" : ""}`}
          aria-pressed={muted}
          onClick={toggleMute}
          onKeyDown={ownKeys(toggleMute)}
          aria-keyshortcuts="M"
        >
          {muted && (
            <svg
              className="sound-off"
              data-testid="sound-off"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
              <path
                d="M11 5l4 6M15 5l-4 6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
          {muted ? "Unmute" : "Mute"}
          <kbd aria-hidden="true">M</kbd>
        </button>
      </div>
      <div
        className={`board${over ? " board-over" : ""}${game.wrap ? " board-wrap" : ""}${flashing ? " board-milestone" : ""}${speeding ? " board-speed" : ""}${nearWall(game) ? " board-wall" : ""}`}
        data-testid="board"
        style={{
          position: "relative",
          width: px(SIZE),
          height: px(SIZE),
          background: "#1c1c1c",
          touchAction: "none",
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
        {ring &&
          // Keyed by score so it remounts and replays on each meal; CSS hides it under reduced motion.
          cell(ring.x, ring.y, "eat-ring", {}, "eat-ring")}
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
                  : game.score > 0 && game.status === "running"
                    ? "flash"
                    : undefined,
                undefined,
                EYES[game.dir].map(eye),
              )
            : cell(c.x, c.y, "snake", bodyLook(skin, i, game.snake.length)),
        )}
        {game.rocks.map((r) => cell(r.x, r.y, "rock", ROCK_LOOK))}
        {cell(
          game.food.x,
          game.food.y,
          "food",
          game.golden ? GOLDEN_LOOK : FOOD_LOOK,
          game.status === "running" ? "pulse food-idle" : "pulse",
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
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems:
                overlayEdge(game) === "top" ? "flex-start" : "flex-end",
              justifyContent: "center",
              padding: "1rem 0",
              fontSize: "4em",
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 0 6px #000, 0 0 2px #000",
              pointerEvents: "none",
            }}
          >
            {game.count}
          </div>
        )}
        {(ready || paused || over) && (
          // The label is drawn by CSS from data-label, so the sr-only status below the board is the only spoken copy.
          <div
            data-testid="board-overlay"
            className={`board-overlay board-overlay-light ${
              over ? "" : "board-overlay-under"
            } ${
              overlayEdge(game) === "top"
                ? "board-overlay-top"
                : "board-overlay-bottom"
            }`}
            aria-hidden="true"
          >
            <div
              className="overlay-panel"
              data-label={over ? "Game over" : paused ? "Paused" : "Snake"}
            >
              {ready && (
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
                </>
              )}
              {over && (
                <>
                  <span
                    className="overlay-line overlay-score"
                    data-text={`Final score: ${game.score}`}
                  />
                  {game.streaks > 0 && (
                    <span
                      className="overlay-line overlay-detail"
                      data-text={`Streak meals: ${game.streaks}`}
                    />
                  )}
                  <span
                    className="overlay-line overlay-detail"
                    data-text={`Time ${formatTime(game.ms)} · Apples ${game.apples} · Longest ${longest}`}
                  />
                  {newBest && (
                    <span
                      className="overlay-line"
                      data-text="New high score!"
                    />
                  )}
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
              {paused && (
                <>
                  <span
                    className="overlay-line overlay-hint hint-keys"
                    data-text="Press Space or P to resume"
                  />
                  <span
                    className="overlay-line overlay-hint hint-touch"
                    data-text="Tap Resume"
                  />
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
      <p className="help hint-keys">
        <span className="sr-only">C changes the snake colour</span>
        <span aria-hidden="true">
          <kbd>C</kbd> changes the snake colour
        </span>
      </p>
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
        {game.score > 0 && !over && (
          // Mounted only after the first meal and not at game over, so the alert stays the only message then.
          <p role="status" className="sr-only">
            Score {game.score}
          </p>
        )}
        {over && (
          <div role="alert">
            <p className="sr-only">Game over</p>
            <p className="sr-only">Final score: {game.score}</p>
            {game.streaks > 0 && (
              <p className="sr-only">Streak meals: {game.streaks}</p>
            )}
            <p className="sr-only">Time {formatTime(game.ms)}</p>
            <p className="sr-only">Apples: {game.apples}</p>
            <p className="sr-only">Longest: {longest}</p>
            {newBest && <p className="sr-only">New high score!</p>}
          </div>
        )}
      </div>
    </main>
  );
}
