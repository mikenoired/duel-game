import { useCallback, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);

  const getMousePos = (can, e) => {
    const rect = can.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  const draw = useCallback((ctx, can) => {
    const cursor = {
      x: 0,
      y: 0,
    }

    const players = [
      { x: 50, y: 20, radius: 20, color: 'red', dy: 1 },
      { x: 450, y: 480, radius: 20, color: 'blue', dy: 1 },
    ]

    const drawPlayers = () => {
      ctx.clearRect(0, 0, can.width, can.height);
      players.forEach((circle) => {
        ctx.beginPath()
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI)
        ctx.fillStyle = circle.color
        ctx.fill()
      })
    }

    const updatePlayers = () => {
      players.forEach((circle) => {
        circle.y += circle.dy;

        if (circle.y < 20 || circle.y > can.height - circle.radius) {
          circle.dy = -circle.dy;
        }

        const isPlayerOnCursor = Math.sqrt((circle.x - cursor.x) ** 2 + (circle.y - cursor.y) ** 2) <= circle.radius;
        if (isPlayerOnCursor) {
          circle.dy = -circle.dy;
        }
      });
    }

    const onMouseMove = (event) => {
      cursor.x = getMousePos(can, event).x
      cursor.y = getMousePos(can, event).y
    }

    can.addEventListener('mousemove', onMouseMove)

    drawPlayers();

    setInterval(() => {
      updatePlayers();
      drawPlayers();
    }, 1);
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    draw(context, canvas)
  }, [draw])

  return (
    <div className="App">
      <canvas ref={canvasRef} id="canvas" width={500} height={500}></canvas>
    </div>
  );
}

export default App;
