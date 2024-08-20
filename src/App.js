import { useCallback, useEffect, useMemo, useRef } from "react";
import "./App.css";

const App = () => {
  const canvasRef = useRef(null);
  const cursorRef = useRef(() => ({ x: 0, y: 0 }), []);
  const players = useMemo(
    () => [
      { id: 1, x: 50, y: 20, radius: 20, color: "red", dy: 3 },
      { id: 2, x: 450, y: 480, radius: 20, color: "blue", dy: 3 },
    ],
    [],
  );

  const getMousePos = useCallback(
    (can, e) => {
      const rect = can.getBoundingClientRect();
      cursorRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [cursorRef],
  );

  const draw = useCallback(
    (ctx, can) => {
      const onMouseMove = (event) => getMousePos(can, event);

      const drawPlayers = () => {
        ctx.clearRect(0, 0, can.width, can.height);
        return players.forEach((circle) => {
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
          ctx.fillStyle = circle.color;
          ctx.fill();
        });
      };

      const updatePlayers = () => {
        players.forEach((player) => {
          player.y += player.dy * player.speed;

          if (player.y < 20 || player.y > can.height - player.radius) {
            player.dy = -player.dy * player.speed;
          }

          if (
            Math.sqrt(
              (player.x - cursorRef.current.x) ** 2 +
                (player.y - cursorRef.current.y) ** 2,
            ) <= player.radius
          ) {
            player.dy = -player.dy * player.speed;
          }
        });
      };

      can.addEventListener("mousemove", onMouseMove);

      drawPlayers();

      let requestId = null;
      const animate = () => {
        drawPlayers();
        updatePlayers();
        requestId = window.requestAnimationFrame(animate);
      };
      animate();

      return () => window.cancelAnimationFrame(requestId);
    },
    [cursorRef, players, getMousePos],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    return draw(context, canvas);
  }, [draw]);

  return (
    <div className="App">
      <canvas ref={canvasRef} id="canvas" width={500} height={500} />
      <div className="rangeControls">
        <div>
          <span>Player 1</span>
          <label htmlFor="player1_bulspeed">
            Bullet speed:
            <input name="player1" id="bullet" type="range" min={1} max={10} />
          </label>
          <label htmlFor="player1_bulspeed">
            Player speed:
            <input value={players[0].speed} type="range" min={1} max={10} />
          </label>
        </div>
        <div>
          <span>Player 2</span>
          <label htmlFor="player2_bulspeed">
            Bullet speed:
            <input name="player2" id="bullet" type="range" min={1} max={10} />
          </label>
          <label htmlFor="player2_bulspeed">
            Player speed:
            <input value={players[1].speed} type="range" min={1} max={10} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default App;
