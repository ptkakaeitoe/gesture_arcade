import React, { useRef, useEffect, useCallback } from "react";
import type { Entity, Point } from "../types";
import { ENTITY_TYPE } from "../types";
import { audioService } from "../services/audioService";

// Reduced gravity for floatier, slower feel (Classic Fruit Ninja is roughly 0.1-0.15 relative to canvas size)
const GRAVITY = 0.12; 
const BLADE_LIFETIME = 15; 
const SPAWN_RATE_BASE = 50; 

interface GameCanvasProps {
  onGameOver: (score: number, maxCombo: number) => void;
  updateScore: (score: number) => void;
}

const FRUIT_EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥝'];
const BOMB_EMOJI = '💣';

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, updateScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  
  // Game State Refs
  const entities = useRef<Entity[]>([]);
  const particles = useRef<Entity[]>([]);
  const bladePath = useRef<Point[]>([]);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);
  const frameCount = useRef(0);
  const gameActive = useRef(true);

  // Helper to spawn entities
  const spawnEntity = (width: number, height: number) => {
    const isBomb = Math.random() < 0.15; 
    const x = Math.random() * (width - 100) + 50;
    const y = height + 50;
    
    // Physics Logic for Slower Gameplay
    // We want the fruit to reach a peak height somewhere between 50% and 80% of screen height
    // Using v^2 = u^2 + 2as (at peak v=0), u = sqrt(-2as)
    // s (displacement) is roughly -(height * 0.5 to 0.8)
    const targetHeight = height * (0.5 + Math.random() * 0.3);
    const displacement = targetHeight; 
    
    // Initial vertical velocity needed to reach that height with current gravity
    const vy = -Math.sqrt(2 * GRAVITY * displacement);
    
    // Time to reach peak = -vy / GRAVITY
    const timeToPeak = -vy / GRAVITY;
    
    // We want it to land somewhere near the center horizontally
    const targetX = width / 2 + (Math.random() - 0.5) * (width * 0.6);
    
    // Horizontal velocity: distance / time
    const vx = (targetX - x) / timeToPeak;

    const entity: Entity = {
      id: Math.random().toString(36).substr(2, 9),
      type: isBomb ? ENTITY_TYPE.BOMB : ENTITY_TYPE.FRUIT,
      x,
      y,
      vx,
      vy,
      radius: 35, 
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.15, // Slower rotation
      color: isBomb ? '#ff0000' : '#ffffff',
      emoji: isBomb ? BOMB_EMOJI : FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
      sliced: false,
      markedForDeletion: false,
      scale: 1,
      opacity: 1
    };
    entities.current.push(entity);
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        id: Math.random().toString(),
        type: ENTITY_TYPE.PARTICLE,
        x,
        y,
        vx: (Math.random() - 0.5) * 8, // Slightly reduced explosion speed
        vy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 3 + 1,
        rotation: 0,
        rotationSpeed: 0,
        color: color,
        emoji: '',
        sliced: false,
        markedForDeletion: false,
        scale: 1,
        opacity: 1,
        life: 30 + Math.random() * 20
      });
    }
  };

  const spawnTextFloat = (x: number, y: number, text: string) => {
     particles.current.push({
        id: Math.random().toString(),
        type: ENTITY_TYPE.TEXT_FLOAT,
        x,
        y,
        vx: 0,
        vy: -1.5, // Slower float up
        radius: 0,
        rotation: 0,
        rotationSpeed: 0,
        color: '#10b981', 
        emoji: text,
        sliced: false,
        markedForDeletion: false,
        scale: 1,
        opacity: 1,
        life: 40
      });
  };

  // Main Loop
  const loop = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!gameActive.current) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Screen
    ctx.clearRect(0, 0, width, height);
    
    // Draw Blade Trail
    if (bladePath.current.length > 1) {
      ctx.beginPath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      
      // Neon Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#10b981";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 6;
      
      for (let i = 0; i < bladePath.current.length - 1; i++) {
        const p1 = bladePath.current[i];
        const p2 = bladePath.current[i+1];
        ctx.globalAlpha = (p1.life || 0) / BLADE_LIFETIME;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Process Entities
    entities.current.forEach(ent => {
      // Physics
      ent.x += ent.vx;
      ent.y += ent.vy;
      ent.vy += GRAVITY;
      ent.rotation += ent.rotationSpeed;

      // Remove off-screen
      if (ent.y > height + 100) {
        ent.markedForDeletion = true;
        // Reset combo if fruit dropped
        if (ent.type === ENTITY_TYPE.FRUIT && !ent.sliced) {
            comboRef.current = 0;
        }
      }

      // Draw
      ctx.save();
      ctx.translate(ent.x, ent.y);
      ctx.rotate(ent.rotation);
      ctx.font = "60px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Shadow for visual pop
      ctx.shadowBlur = 20;
      ctx.shadowColor = ent.color;
      
      ctx.fillText(ent.emoji, 0, 0);
      ctx.restore();

      // Collision Detection with Blade
      if (!ent.sliced && bladePath.current.length > 1) {
        const lastPoint = bladePath.current[bladePath.current.length - 1];
        const prevPoint = bladePath.current[bladePath.current.length - 2];
        
        const dx = ent.x - lastPoint.x;
        const dy = ent.y - lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate blade speed
        const bladeSpeed = Math.sqrt(Math.pow(lastPoint.x - prevPoint.x, 2) + Math.pow(lastPoint.y - prevPoint.y, 2));

        if (dist < ent.radius && bladeSpeed > 5) {
          ent.sliced = true;
          ent.markedForDeletion = true;

          if (ent.type === ENTITY_TYPE.BOMB) {
            // GAME OVER
            audioService.playExplosion();
            gameActive.current = false;
            spawnParticles(ent.x, ent.y, '#ff0000', 50);
            setTimeout(() => {
                onGameOver(scoreRef.current, maxComboRef.current);
            }, 500);
          } else {
            // SLICE
            audioService.playSlice();
            comboRef.current += 1;
            if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
            
            const points = 10 + comboRef.current;
            scoreRef.current += points;
            updateScore(scoreRef.current);
            
            spawnParticles(ent.x, ent.y, '#ffff00', 10);
            spawnTextFloat(ent.x, ent.y, `+${points}`);
          }
        }
      }
    });

    // Process Particles & Floats
    particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life = (p.life || 0) - 1;
        
        if (p.type === ENTITY_TYPE.PARTICLE) {
            p.vy += GRAVITY * 0.5;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, (p.life || 0) / 30);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === ENTITY_TYPE.TEXT_FLOAT) {
            ctx.font = "20px JetBrains Mono";
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, (p.life || 0) / 40);
            ctx.fillText(p.emoji, p.x, p.y);
        }
        
        ctx.globalAlpha = 1;

        if ((p.life || 0) <= 0) p.markedForDeletion = true;
    });

    // Cleanup
    entities.current = entities.current.filter(e => !e.markedForDeletion);
    particles.current = particles.current.filter(e => !e.markedForDeletion);
    
    // Blade Decay
    bladePath.current.forEach(p => p.life = (p.life || 0) - 1);
    bladePath.current = bladePath.current.filter(p => (p.life || 0) > 0);

    // Spawning Logic
    frameCount.current++;
    // Spawn rate logic adjusted for slower gravity to keep screen populated but not overwhelmed
    const currentSpawnRate = Math.max(20, SPAWN_RATE_BASE - Math.floor(scoreRef.current / 50));
    
    if (frameCount.current % currentSpawnRate === 0) {
        spawnEntity(width, height);
    }

    requestRef.current = requestAnimationFrame(loop);
  }, [onGameOver, updateScore]);

  // Input Handling
  const handleInputStart = (x: number, y: number) => {
    isMouseDown.current = true;
    mousePos.current = { x, y };
    bladePath.current = []; 
  };

  const handleInputMove = (x: number, y: number) => {
    if (!isMouseDown.current) return;
    
    const canvasX = x;
    const canvasY = y;

    bladePath.current.push({ x: canvasX, y: canvasY, life: BLADE_LIFETIME });
    mousePos.current = { x: canvasX, y: canvasY };
  };

  const handleInputEnd = () => {
    isMouseDown.current = false;
    bladePath.current = [];
  };

  // Event Listeners
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        handleInputStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleInputMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onMouseDown = (e: MouseEvent) => {
        handleInputStart(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
        handleInputMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => handleInputEnd();

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onMouseUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Start Loop
    requestRef.current = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onMouseUp);
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-none touch-none"
    />
  );
};

export default GameCanvas;
