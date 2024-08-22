import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const App = () => {
  const canvasRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const [playerShots, setPlayerShots] = useState({ 1: 0, 2: 0 });
  const [bulletSetting, setBulletSetting] = useState(1);
  const [bulletSpeed, setBulletSpeed] = useState({ 1: 2, 2: 2 });
  const [pause, setPause] = useState(false);
  const bulletIntervals = useRef({});

  const players = useMemo(
    () => [
      {
        id: 1,
        x: 50,
        y: 20,
        radius: 20,
        color: "red",
        dy: 3,
        bullets: [],
        bulletColor: "#000000",
      },
      {
        id: 2,
        x: 450,
        y: 480,
        radius: 20,
        color: "blue",
        dy: 3,
        bullets: [],
        bulletColor: "#000000",
      },
    ],
    [],
  );

  const getMousePos = useCallback((can, e) => {
    const rect = can.getBoundingClientRect();
    cursorRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const drawPlayers = (ctx, can) => {
    ctx.clearRect(0, 0, can.width, can.height);
    players.forEach(({ x, y, radius, color }) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    });
  };

  const updatePlayers = (can) => {
    players.forEach((player) => {
      player.y += player.dy;
      if (
        player.y < player.radius ||
        player.y > can.height - player.radius ||
        Math.sqrt(
          (player.x - cursorRef.current.x) ** 2 +
            (player.y - cursorRef.current.y) ** 2,
        ) <= player.radius
      ) {
        player.dy = -player.dy;
      }
    });
  };

  const handleCanvasClick = (e, can) => {
    const rect = can.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    players.forEach(({ id, x, y, radius }) => {
      if (Math.sqrt((x - clickX) ** 2 + (y - clickY) ** 2) <= radius) {
        setBulletSetting(id);
        setPause(true);
      }
    });
  };

  const moveBullet = (bullet, player, enemy, can) => {
    const speed = 5;
    const newX = player.id === 1 ? bullet.x + speed : bullet.x - speed;

    if (newX > can.width || newX < 0) return false;

    const dx = newX - enemy.x;
    const dy = bullet.y - enemy.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    if (distance <= bullet.radius + enemy.radius) {
      setPlayerShots((prevPlayerShots) => ({
        ...prevPlayerShots,
        [player.id]: prevPlayerShots[player.id] + 1,
      }));
      return false;
    }

    return { ...bullet, x: newX };
  };

  const updateBullets = (ctx, can) => {
    players.forEach((player, i) => {
      const enemy = players[1 - i];
      player.bullets = player.bullets
        .map((bullet) => moveBullet(bullet, player, enemy, can))
        .filter(Boolean);

      player.bullets.forEach(({ x, y, color }) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });
  };

  const draw = useCallback(
    (ctx, can) => {
      let requestId;

      const animate = () => {
        drawPlayers(ctx, can);
        updatePlayers(can);
        updateBullets(ctx, can);
        requestId = window.requestAnimationFrame(animate);
      };

      const onMouseMove = (e) => getMousePos(can, e);
      const onClick = (e) => handleCanvasClick(e, can);

      can.addEventListener("mousemove", onMouseMove);
      can.addEventListener("click", onClick);

      if (!pause) animate();

      return () => {
        window.cancelAnimationFrame(requestId);
        Object.values(bulletIntervals.current).forEach(clearInterval);
        can.removeEventListener("mousemove", onMouseMove);
        can.removeEventListener("click", onClick);
      };
    },
    [pause, players, getMousePos],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const cleanup = draw(ctx, canvas);
    return () => cleanup();
  }, [draw]);

  const drawBullets = (player) => {
    player.bullets.push({
      x: player.x,
      y: player.y,
      radius: 5,
      color: player.bulletColor,
    });
  };

  useEffect(() => {
    if (!pause) {
      players.forEach((player) => {
        if (bulletIntervals.current[player.id])
          clearInterval(bulletIntervals.current[player.id]);
        bulletIntervals.current[player.id] = setInterval(
          () => drawBullets(player),
          1000 / bulletSpeed[player.id],
        );
      });
    } else {
      Object.values(bulletIntervals.current).forEach(clearInterval);
    }
  }, [bulletSpeed, pause, players]);

  return (
    <div className="App">
      {pause && (
        <div className="modal">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              players[bulletSetting - 1].bulletColor = e.target.color.value;
              setPause(false);
            }}
          >
            <span>Change player color</span>
            <input
              type="color"
              name="color"
              defaultValue={players[bulletSetting - 1].bulletColor}
            />
            <button type="submit">Apply</button>
          </form>
        </div>
      )}
      <canvas ref={canvasRef} id="canvas" width={500} height={500} />
      <div className="rangeControls">
        {[1, 2].map((id) => (
          <div key={id}>
            <span>
              Player {id}
              <br />
              <b>Score: {playerShots[id]}</b>
            </span>
            <label>
              Bullet speed:
              <input
                type="range"
                min={1}
                max={5}
                defaultValue={bulletSpeed[id]}
                onChange={(e) =>
                  setBulletSpeed((prev) => ({
                    ...prev,
                    [id]: parseInt(e.target.value, 10),
                  }))
                }
              />
            </label>
            <label>
              Player speed:
              <input
                type="range"
                min={1}
                max={10}
                defaultValue={players[id - 1].dy}
                onChange={(e) => {
                  const speed = parseInt(e.target.value, 10);
                  players[id - 1].dy = players[id - 1].dy < 0 ? -speed : speed;
                }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
