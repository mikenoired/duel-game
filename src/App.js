import { useCallback, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null)

  const draw = useCallback((ctx, can) => {
    const players = [
      { x: 50, y: 20, radius: 20, color: 'red', dy: 1 },
      { x: 450, y: 20, radius: 20, color: 'blue', dy: 1 },
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

    // Update the circle positions
    const updatePlayers = () => {
      players.forEach((circle) => {
        circle.y += circle.dy;

        if (circle.y < 20 || circle.y > can.height - circle.radius) {
          circle.dy = -circle.dy;
        }
      });
    }

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
