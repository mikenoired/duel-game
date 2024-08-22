import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const App = () => {
  const canvasRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const [playerShots, setPlayerShots] = useState({
    1: 0,
    2: 0,
  });
  const [bulletSetting, setBulletSetting] = useState(1);
  const [bulletSpeed, setBulletSpeed] = useState({
    1: 2,
    2: 2,
  });
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

  const draw = useCallback(
    (ctx, can) => {
      let requestId = null;

      const onMouseMove = (event) => getMousePos(can, event);

      const drawPlayers = () => {
        ctx.clearRect(0, 0, can.width, can.height);
        players.forEach((player) => {
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
          ctx.fillStyle = player.color;
          ctx.fill();
        });
      };

      const updatePlayers = () => {
        players.forEach((player) => {
          player.y += player.dy;

          if (
            player.y < player.radius ||
            player.y > can.height - player.radius
          ) {
            player.dy = -player.dy;
          }

          if (
            Math.sqrt(
              (player.x - cursorRef.current.x) ** 2 +
                (player.y - cursorRef.current.y) ** 2,
            ) <= player.radius
          ) {
            player.dy = -player.dy;
          }
        });
      };

      const handleCanvasClick = (event) => {
        const rect = can.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        players.forEach((player) => {
          const distance = Math.sqrt(
            (player.x - clickX) ** 2 + (player.y - clickY) ** 2,
          );
          if (distance <= player.radius) {
            setBulletSetting(player.id);
            setPause(true);
          }
        });
      };

      const hasShot = (bullet, player) => {
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        return distance <= player.radius + bullet.radius;
      };

      const moveBullet = (bullet, player, enemy) => {
        const speed = 5;
        const newX = player.id === 1 ? bullet.x + speed : bullet.x - speed;

        if (newX > can.width || newX < 0) return false;

        const hasBulletHitEnemy = hasShot(bullet, enemy);

        if (hasBulletHitEnemy) {
          setPlayerShots((prevPlayerShots) => ({
            ...prevPlayerShots,
            [player.id]: prevPlayerShots[player.id] + 1,
          }));
          return false;
        }

        return { ...bullet, x: newX };
      };

      const handleBulletCollision = (player, enemy) => {
        player.bullets = player.bullets
          .map((bullet) => moveBullet(bullet, player, enemy))
          .filter((bullet) => bullet);
      };

      const updateBullets = () => {
        players.forEach((player, index) => {
          const enemyIndex = index === 0 ? 1 : 0;
          handleBulletCollision(player, players[enemyIndex]);
        });

        players.forEach((player) => {
          player.bullets.forEach((bullet) => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = bullet.color;
            ctx.fill();
          });
        });
      };

      const pauseAnimation = () => {
        window.cancelAnimationFrame(requestId);
        Object.values(bulletIntervals.current).forEach(clearInterval);
      };

      const resumeAnimation = () => {
        animate();
      };

      can.addEventListener("mousemove", onMouseMove);
      can.addEventListener("click", handleCanvasClick);

      const animate = () => {
        drawPlayers();
        updatePlayers();
        updateBullets();
        requestId = window.requestAnimationFrame(animate);
      };

      if (pause) {
        pauseAnimation();
      } else {
        resumeAnimation();
      }

      return () => {
        window.cancelAnimationFrame(requestId);
        Object.values(bulletIntervals.current).forEach(clearInterval);
        can.removeEventListener("mousemove", onMouseMove);
        can.removeEventListener("click", handleCanvasClick);
      };
    },
    [cursorRef, players, getMousePos, pause],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const cleanup = draw(context, canvas);
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
        if (bulletIntervals.current[player.id]) {
          clearInterval(bulletIntervals.current[player.id]);
        }
        bulletIntervals.current[player.id] = setInterval(() => {
          drawBullets(player);
        }, 1000 / bulletSpeed[player.id]);
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
              const colorValue = e.target.color.value;
              setPause(false);
              players[bulletSetting - 1].bulletColor = colorValue;
            }}
          >
            <span>Change player color</span>
            <input type="text" hidden name="player" value={bulletSetting} />
            <input
              defaultValue={players[bulletSetting - 1].bulletColor}
              name="color"
              type="color"
            />
            <button type="submit">Apply</button>
          </form>
        </div>
      )}
      <canvas ref={canvasRef} id="canvas" width={500} height={500} />
      <div className="rangeControls">
        <div>
          <span>
            Player 1 <b>{playerShots[1]}</b>
          </span>
          <label htmlFor="player1_bulspeed">
            Bullet speed:
            <input
              defaultValue={bulletSpeed[1]}
              onChange={(e) => {
                setBulletSpeed((prev) => ({
                  ...prev,
                  1: parseInt(e.target.value, 10),
                }));
              }}
              name="player1"
              id="bullet"
              type="range"
              min={1}
              max={5}
            />
          </label>
          <label htmlFor="player1_bulspeed">
            Player speed:
            <input
              defaultValue={players[0].dy}
              onChange={(e) => {
                players[0].dy =
                  players[0].dy < 0
                    ? -parseInt(e.target.value, 10)
                    : parseInt(e.target.value, 10);
              }}
              type="range"
              min={1}
              max={10}
            />
          </label>
        </div>
        <div>
          <span>
            Player 2 <b>{playerShots[2]}</b>
          </span>
          <label htmlFor="player2_bulspeed">
            Bullet speed:
            <input
              defaultValue={bulletSpeed[2]}
              onChange={(e) => {
                setBulletSpeed((prev) => ({
                  ...prev,
                  2: parseInt(e.target.value, 10),
                }));
              }}
              name="player2"
              id="bullet"
              type="range"
              min={1}
              max={5}
            />
          </label>
          <label htmlFor="player2_bulspeed">
            Player speed:
            <input
              defaultValue={players[1].dy}
              onChange={(e) => {
                players[1].dy =
                  players[1].dy < 0
                    ? -parseInt(e.target.value, 10)
                    : parseInt(e.target.value, 10);
              }}
              type="range"
              min={1}
              max={10}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default App;
