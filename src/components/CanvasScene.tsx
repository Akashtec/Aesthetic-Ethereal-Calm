import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  progress: number;
}

interface CanvasSceneProps {
  bgUrl: string;
  isNightMode: boolean;
  onSnapshotReady?: (dataUrl: string) => void;
  triggerSnapshot?: boolean;
  particleSpeed?: number;
  particleSize?: number;
  particleDensity?: number;
  particleReactivity?: number;
}

export default function CanvasScene({ 
  bgUrl, 
  isNightMode, 
  onSnapshotReady, 
  triggerSnapshot,
  particleSpeed = 1,
  particleSize = 1,
  particleDensity = 100,
  particleReactivity = 1
}: CanvasSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Use a ref for settings so the animation loop always has the latest values without needing to restart
  const settingsRef = useRef({
    speed: particleSpeed,
    size: particleSize,
    density: particleDensity,
    reactivity: particleReactivity
  });

  useEffect(() => {
    settingsRef.current = {
      speed: particleSpeed,
      size: particleSize,
      density: particleDensity,
      reactivity: particleReactivity
    };
  }, [particleSpeed, particleSize, particleDensity, particleReactivity]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bgUrl;
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, [bgUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const createParticle = (x: number, y: number, isBurst = false): Particle => {
      const colors = isNightMode 
        ? ['#8b5cf6', '#3b82f6', '#ec4899', '#ffffff'] // Night colors: purple, blue, pink, white
        : ['#f59e0b', '#ef4444', '#10b981', '#ffffff']; // Day colors: amber, red, emerald, white
      
      const speedMult = isBurst ? 5 * settingsRef.current.reactivity : 1;
      
      return {
        x,
        y,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 1.5 * speedMult,
        vy: ((Math.random() - 0.5) * 1.5 - 0.5) * speedMult, // Slight upward drift
        alpha: Math.random() * 0.5 + 0.5,
        life: 0,
        maxLife: Math.random() * 100 + 50,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    };

    // Initialize some background particles
    for (let i = 0; i < settingsRef.current.density; i++) {
      particlesRef.current.push(createParticle(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      // Add particles on mouse move, scaled by reactivity
      if (Math.random() < 0.5 * settingsRef.current.reactivity) {
        particlesRef.current.push(createParticle(e.clientX, e.clientY));
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Add ripple
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 100 + Math.random() * 100 * settingsRef.current.reactivity,
        alpha: 0.8,
        progress: 0
      });
      
      // Add particle burst
      const burstCount = Math.floor(10 * settingsRef.current.reactivity);
      for (let i = 0; i < burstCount; i++) {
        particlesRef.current.push(createParticle(e.clientX, e.clientY, true));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('pointerdown', handlePointerDown);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Background
      const time = Date.now() / 1000;

      if (bgImageRef.current) {
        // Ken Burns effect (slow pan and zoom)
        // Use smoothstep-like easing on sine waves for more fluid motion
        const rawZoomSine = Math.sin(time * 0.05);
        const smoothZoom = rawZoomSine * rawZoomSine * (3 - 2 * Math.abs(rawZoomSine)) * Math.sign(rawZoomSine);
        const zoom = 1.1 + smoothZoom * 0.05; // Zoom between 1.05 and 1.15
        
        const rawPanXSine = Math.cos(time * 0.03);
        const smoothPanX = rawPanXSine * rawPanXSine * (3 - 2 * Math.abs(rawPanXSine)) * Math.sign(rawPanXSine);
        const panX = smoothPanX * 20;
        
        const rawPanYSine = Math.sin(time * 0.04);
        const smoothPanY = rawPanYSine * rawPanYSine * (3 - 2 * Math.abs(rawPanYSine)) * Math.sign(rawPanYSine);
        const panY = smoothPanY * 20;

        const imgRatio = bgImageRef.current.width / bgImageRef.current.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
          drawWidth = canvas.width * zoom;
          drawHeight = (canvas.width / imgRatio) * zoom;
        } else {
          drawWidth = (canvas.height * imgRatio) * zoom;
          drawHeight = canvas.height * zoom;
        }

        offsetX = (canvas.width - drawWidth) / 2 + panX;
        offsetY = (canvas.height - drawHeight) / 2 + panY;

        ctx.globalAlpha = isNightMode ? 0.4 : 0.7;
        ctx.drawImage(bgImageRef.current, offsetX, offsetY, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
      } else {
        // Fallback gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (isNightMode) {
          gradient.addColorStop(0, '#0f172a');
          gradient.addColorStop(1, '#1e1b4b');
        } else {
          gradient.addColorStop(0, '#bae6fd');
          gradient.addColorStop(1, '#fdf4ff');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Procedural Aurora / Mist Overlay
      ctx.save();
      ctx.globalCompositeOperation = isNightMode ? 'screen' : 'overlay';
      ctx.globalAlpha = isNightMode ? 0.3 : 0.15;

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let x = 0; x <= canvas.width; x += 50) {
          // Complex sine wave combination for organic movement
          const y = canvas.height * 0.5 
            + Math.sin(x * 0.003 + time * (0.2 + i * 0.1)) * 100
            + Math.cos(x * 0.005 - time * (0.15 + i * 0.05)) * 150
            + Math.sin(x * 0.001 + time * 0.05) * 200;
          
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        const auroraGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (isNightMode) {
          auroraGradient.addColorStop(0, i === 0 ? '#8b5cf6' : i === 1 ? '#3b82f6' : '#ec4899');
          auroraGradient.addColorStop(1, 'transparent');
        } else {
          auroraGradient.addColorStop(0, i === 0 ? '#fcd34d' : i === 1 ? '#6ee7b7' : '#93c5fd');
          auroraGradient.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = auroraGradient;
        ctx.fill();
      }
      ctx.restore();

      // 2. Draw Character (Floating Center Picture) - REMOVED per user request

      // 3. Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // Apply drag/friction to velocity for smoother movement
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        // Apply dynamic speed
        p.x += p.vx * settingsRef.current.speed;
        p.y += p.vy * settingsRef.current.speed;
        p.life++;

        // Interactive: move away from mouse slightly, scaled by reactivity
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const reactRadius = 100 * Math.max(0.5, settingsRef.current.reactivity);
        
        if (dist < reactRadius && dist > 0) {
          // Smooth repulsion using ease-out
          const force = (1 - dist / reactRadius);
          const easeForce = force * force * (3 - 2 * force); // Smoothstep
          p.vx -= (dx / dist) * easeForce * 0.5 * settingsRef.current.reactivity;
          p.vy -= (dy / dist) * easeForce * 0.5 * settingsRef.current.reactivity;
        }

        if (p.life >= p.maxLife || p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          particlesRef.current.splice(i, 1);
          // Replenish ambient particles up to the target density
          if (particlesRef.current.length < settingsRef.current.density) {
             particlesRef.current.push(createParticle(Math.random() * canvas.width, Math.random() * canvas.height));
          }
          continue;
        }

        // Smooth alpha fade in and out
        const lifeProgress = p.life / p.maxLife;
        // Sine easing for alpha: 0 -> 1 -> 0
        const currentAlpha = p.alpha * Math.sin(lifeProgress * Math.PI);
        
        ctx.beginPath();
        // Apply dynamic size
        ctx.arc(p.x, p.y, p.radius * settingsRef.current.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 4. Draw Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.progress += 0.015 * settingsRef.current.speed;
        
        if (r.progress >= 1) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        
        // Ease out cubic for radius
        const easeOutCubic = 1 - Math.pow(1 - r.progress, 3);
        r.radius = r.maxRadius * easeOutCubic;
        
        // Ease in out for alpha (fade out smoothly)
        r.alpha = 0.8 * (1 - Math.pow(r.progress, 2));
        
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isNightMode ? `rgba(139, 92, 246, ${Math.max(0, r.alpha)})` : `rgba(245, 158, 11, ${Math.max(0, r.alpha)})`;
        ctx.lineWidth = 2 + (1 - r.progress) * 2; // Thicker at start, thinner at end
        ctx.stroke();
      }

      // 5. Dynamic Lighting (Mouse Glow)
      const glowGradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 300 * Math.max(0.5, settingsRef.current.reactivity)
      );
      if (isNightMode) {
        glowGradient.addColorStop(0, `rgba(139, 92, 246, ${0.15 * settingsRef.current.reactivity})`);
        glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      } else {
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * settingsRef.current.reactivity})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 6. Vignette
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.8
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, isNightMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isNightMode]);

  useEffect(() => {
    if (triggerSnapshot && onSnapshotReady && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSnapshotReady(dataUrl);
    }
  }, [triggerSnapshot, onSnapshotReady]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: -1 }}
    />
  );
}
