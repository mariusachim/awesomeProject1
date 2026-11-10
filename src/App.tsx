import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyEvent,
  type ReactNode,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { isNewHighScore, loadHighScore, saveHighScore } from "./highScore.ts";
import { type Skin, SKINS, loadSkin, nextSkin, saveSkin } from "./skin.ts";
import { loadWrap, saveWrap } from "./wallsMode.ts";
import { loadMuted, play, saveMuted, vibrate } from "./sound.ts";
import {
  type Dir,
  type GameState,
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
  tickMs,
  COUNT_MS,
  togglePause,
  turn,
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
  right: [[70, 28], [70, 72]],
  left: [[30, 28], [30, 72]],
  up: [[28, 30], [72, 30]],
  down: [[28, 70], [72, 70]],
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
const bodyLook = (skin: Skin): CSSProperties => ({
  background: SKINS[skin].body,
  boxSizing: "border-box",
  border: "2px solid #222",
});
const FOOD_LOOK: CSSProperties = { background: "#e44", borderRadius: "50%" };
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

// A rock is grey, a colour none of the snake, food and bonus food uses.
const ROCK_LOOK: CSSProperties = { background: "#888", boxSizing: "border-box", border: "2px solid #555" };

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
  pulse = big && value !== 0,
  gain = 0,
}: {
  gain?: number; // points of the last move: shown as a "+N" pop beside the value
  label: string;
  value: number | string;
  spoken: string;
  big?: boolean;
  pulse?: boolean;
}) {
  return (
    <p className={big ? "stat stat-big" : "stat"}>
      <span aria-hidden="true" className="stat-label">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={pulse ? "stat-value bump" : "stat-value"}
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
  const ready = game.status === "ready";

  useEffect(() => {
    const id = setInterval(
      () => setGame((g) => step(g, Math.random)),
      tickMs(game.score),
    );
    return () => clearInterval(id);
  }, [game.score]);

  if (game.score === 0 && cleared !== 0) setCleared(0);
  if (highScore > best) setBest(highScore);
  // The record before this run: it is refreshed while the score is 0, and frozen once the run scores.
  const [record, setRecord] = useState(best);
  if (game.score === 0 && record !== highScore) setRecord(highScore);
  const newBest = over && isNewHighScore(record, game.score);

  const prev = useRef({ score: game.score, over });
  useEffect(() => {
    const was = prev.current;
    prev.current = { score: game.score, over };
    if (muted) return;
    if (over && !was.over) {
      play("over");
      vibrate();
    }
    else if (game.score > was.score) play("eat");
  }, [game.score, over, muted]);

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
    const noClick = (e: KeyboardEvent) => {
      if (e.key === " ") e.preventDefault();
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
  const toggleWalls = () => setGame(newGame(Math.random, !game.wrap, "ready"));
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
      key={id === "head" ? `head${game.score}` : `${id}${x},${y}`}
      data-testid={id}
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

  // The spec counts the length from 1, but the snake starts with 3 cells.
  const length = game.snake.length - 2;

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
        />
        <Stat
          label="High score"
          value={highScore}
          spoken={`High score: ${highScore}`}
        />
        {last !== null && (
          <Stat label="Last" value={last} spoken={`Last: ${last}`} />
        )}
      </div>
      <div className="controls">
        <button
          className="pause"
          disabled={ready}
          onClick={over ? again : () => setGame(togglePause)}
          onKeyDown={over ? ownKeys(again) : undefined}
        >
          {over ? "Restart" : paused ? "Resume" : "Pause"}
        </button>
        <button onClick={toggleWalls} onKeyDown={ownKeys(toggleWalls)}>
          Walls: {game.wrap ? "wrap" : "solid"}
        </button>
        <button onClick={toggleMute} onKeyDown={ownKeys(toggleMute)}>
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
      <div
        className={`board${over ? " board-over" : ""}${game.wrap ? " board-wrap" : ""}`}
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
          <div data-testid="board-dim" aria-hidden="true" className="board-dim" />
        )}
        {game.snake.map((c, i) =>
          i === 0
            ? cell(
                c.x,
                c.y,
                "head",
                headLook(skin, over),
                game.score > 0 && game.status === "running"
                  ? "flash"
                  : undefined,
                undefined,
                EYES[game.dir].map(eye),
              )
            : cell(c.x, c.y, "snake", bodyLook(skin)),
        )}
        {game.rocks.map((r) => cell(r.x, r.y, "rock", ROCK_LOOK))}
        {cell(game.food.x, game.food.y, "food", FOOD_LOOK, "pulse")}
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
        {game.bonus && (
          // A sibling of the diamond, because the diamond's clip-path would cut the number.
          <div
            data-testid="bonus-count"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: px(game.bonus.cell.x),
              top: px(game.bonus.cell.y),
              width: px(1),
              height: px(1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#222",
              fontSize: "0.5em",
              fontWeight: 700,
              pointerEvents: "none",
            }}
          >
            {game.bonus.movesLeft}
          </div>
        )}
        {game.count > 0 && (
          <div
            data-testid="countdown"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "4em",
              fontWeight: 700,
              color: "#fff",
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
                    className="overlay-line overlay-hint hint-keys"
                    data-text="Press an arrow key or WASD to start"
                  />
                  <span
                    className="overlay-line overlay-hint hint-touch"
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
                    className="overlay-line"
                    data-text={`Final score: ${game.score}`}
                  />
                  {game.streaks > 0 && (
                    <span
                      className="overlay-line"
                      data-text={`Streak meals: ${game.streaks}`}
                    />
                  )}
                  {newBest && (
                    <span
                      className="overlay-line"
                      data-text="New high score!"
                    />
                  )}
                  <span
                    className="overlay-line overlay-hint hint-keys"
                    data-text="Press Enter to restart"
                  />
                  <span
                    className="overlay-line overlay-hint hint-touch"
                    data-text="Tap Restart"
                  />
                  <span
                    className="overlay-line overlay-hint"
                    data-text="H resets the high score"
                  />
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
                  <span
                    className="overlay-line overlay-hint"
                    data-text="H resets the high score"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="help hint-keys">C changes the snake colour</p>
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
        {over && (
          <div role="alert">
            <p className="sr-only">Game over</p>
            <p className="sr-only">Final score: {game.score}</p>
            {game.streaks > 0 && (
              <p className="sr-only">Streak meals: {game.streaks}</p>
            )}
            {newBest && <p className="sr-only">New high score!</p>}
          </div>
        )}
      </div>
    </main>
  );
}
