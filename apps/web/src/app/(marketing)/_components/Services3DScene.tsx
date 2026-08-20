"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

type Services3DSceneProps = {
  progress: MutableRefObject<number>;
  poster: string;
  videoSrc: string;
};

const ACID = "#b8ff2e";
const INK = "#090b09";

function drawDashboard(context: CanvasRenderingContext2D, backend: boolean) {
  const { canvas } = context;
  context.fillStyle = backend ? "#080b09" : "#f0efe7";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (backend) {
    context.strokeStyle = "rgba(184,255,46,.12)";
    context.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 64) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    context.fillStyle = ACID;
    context.font = "700 22px monospace";
    context.fillText("ARKO CLOUD / LIVE ARCHITECTURE", 44, 52);
    const nodes = [
      [150, 180, "EDGE", "34ms"],
      [390, 112, "AUTH", "99.9%"],
      [650, 190, "API", "2.4k/s"],
      [850, 330, "QUEUE", "12 jobs"],
      [650, 470, "POSTGRES", "8.2 GB"],
      [355, 460, "WORKERS", "18 live"],
      [125, 355, "CACHE", "94%"],
    ] as const;
    context.strokeStyle = "rgba(184,255,46,.52)";
    context.lineWidth = 4;
    context.beginPath();
    nodes.forEach(([x, y], index) =>
      index ? context.lineTo(x, y) : context.moveTo(x, y),
    );
    context.closePath();
    context.stroke();
    nodes.forEach(([x, y, label, stat], index) => {
      context.fillStyle = index === 2 ? ACID : "#121713";
      context.strokeStyle = ACID;
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(x - 72, y - 35, 144, 70, 10);
      context.fill();
      context.stroke();
      context.fillStyle = index === 2 ? INK : "#f0efe7";
      context.font = "700 17px monospace";
      context.fillText(label, x - 49, y - 5);
      context.fillStyle = index === 2 ? "#324315" : "#7d867c";
      context.font = "700 12px monospace";
      context.fillText(stat, x - 49, y + 20);
    });
    return;
  }

  context.fillStyle = INK;
  context.fillRect(0, 0, canvas.width, 58);
  context.fillRect(0, 58, 176, canvas.height - 58);
  context.fillStyle = ACID;
  context.font = "800 22px Arial";
  context.fillText("ARKO", 34, 38);
  context.fillStyle = "#727970";
  context.font = "700 13px monospace";
  context.fillText("WORKSPACE", 28, 102);
  ["Overview", "Projects", "Systems", "Analytics"].forEach((label, index) => {
    const y = 142 + index * 48;
    if (index === 0) {
      context.fillStyle = ACID;
      context.beginPath();
      context.roundRect(22, y - 25, 132, 36, 8);
      context.fill();
    }
    context.fillStyle = index === 0 ? INK : "#a3aaa1";
    context.font = "700 15px Arial";
    context.fillText(label, 46, y);
  });

  context.fillStyle = "#737972";
  context.font = "700 13px monospace";
  context.fillText("MONDAY, AUG 09", 214, 105);
  context.fillStyle = INK;
  context.font = "800 38px Arial";
  context.fillText("Build what matters.", 214, 151);

  const cards = [
    [214, 190, 352, 190],
    [586, 190, 370, 190],
  ];
  cards.forEach(([x, y, width, height], index) => {
    context.fillStyle = index ? "#d9d8d0" : "#0d100e";
    context.beginPath();
    context.roundRect(x, y, width, height, 14);
    context.fill();
    context.fillStyle = index ? "#565c55" : "#828980";
    context.font = "700 13px monospace";
    context.fillText(
      index ? "ACTIVE HOURS" : "DELIVERY VELOCITY",
      x + 25,
      y + 34,
    );
    context.fillStyle = index ? INK : "#f0efe7";
    context.font = "800 36px Arial";
    context.fillText(index ? "1,284" : "+28.4%", x + 25, y + 82);
  });
  context.strokeStyle = ACID;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(240, 338);
  context.bezierCurveTo(300, 325, 330, 260, 390, 295);
  context.bezierCurveTo(450, 330, 490, 225, 540, 250);
  context.stroke();
  [54, 92, 68, 118, 82, 140, 105, 151].forEach((height, index) => {
    context.fillStyle = index > 5 ? INK : "#a7aaa3";
    context.fillRect(615 + index * 38, 346 - height, 19, height);
  });
  context.fillStyle = "#6d736c";
  context.font = "700 13px monospace";
  context.fillText("ACTIVE PROJECTS", 214, 425);
  ["Nova Mobile", "Cobalt OS", "Atlas Cloud"].forEach((name, index) => {
    const y = 452 + index * 48;
    context.fillStyle = index % 2 ? "#deddd6" : "#e8e7e0";
    context.beginPath();
    context.roundRect(214, y, 742, 36, 7);
    context.fill();
    context.fillStyle = index === 0 ? ACID : INK;
    context.beginPath();
    context.arc(234, y + 18, 7, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = INK;
    context.font = "700 14px Arial";
    context.fillText(name, 252, y + 23);
    context.fillRect(610, y + 15, 110 - index * 22, 6);
  });
}

function createIcon(kind: number) {
  const group = new THREE.Group();
  const acid = new THREE.MeshStandardMaterial({
    color: ACID,
    metalness: 0.18,
    roughness: 0.28,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#172016",
    metalness: 0.55,
    roughness: 0.24,
  });
  if (kind === 0) {
    group.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), acid));
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 1.12), dark);
    core.rotation.z = Math.PI / 4;
    group.add(core);
  } else if (kind === 1) {
    for (let y = -0.33; y <= 0.33; y += 0.33) {
      const disk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.58, 0.28, 32),
        acid,
      );
      disk.position.y = y;
      group.add(disk);
    }
  } else if (kind === 2) {
    [
      [-0.34, 0, 0],
      [0.1, 0.18, 0],
      [0.45, -0.02, 0],
      [0, -0.18, 0],
    ].forEach(([x, y, z], index) => {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(index === 1 ? 0.48 : 0.4, 24, 18),
        acid,
      );
      puff.position.set(x, y, z);
      group.add(puff);
    });
  } else {
    const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 1), acid);
    shield.scale.set(0.88, 1.16, 0.34);
    group.add(shield);
  }
  return group;
}

export default function Services3DScene({
  progress,
  poster,
  videoSrc,
}: Services3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement>(null);
  const [webGLUnavailable, setWebGLUnavailable] = useState(false);

  useEffect(() => {
    if (!webGLUnavailable) return;
    const video = fallbackVideoRef.current;
    if (!video) return;
    let frame = 0;
    let lastTime = -1;
    const seek = () => {
      if (
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        video.readyState >= 2
      ) {
        const nextTime =
          progress.current * Math.max(0, video.duration - 1 / 30);
        if (Math.abs(nextTime - lastTime) > 1 / 60) {
          video.currentTime = nextTime;
          lastTime = nextTime;
        }
      }
      frame = requestAnimationFrame(seek);
    };
    seek();
    return () => cancelAnimationFrame(frame);
  }, [progress, webGLUnavailable]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(INK);
    scene.fog = new THREE.FogExp2(INK, 0.035);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.4, 14);

    const rendererCanvas = document.createElement("canvas");
    const contextAttributes: WebGLContextAttributes = {
      alpha: false,
      antialias: true,
      powerPreference: "default",
    };
    const webGLContext =
      rendererCanvas.getContext("webgl2", contextAttributes) ??
      rendererCanvas.getContext("webgl", contextAttributes);
    if (!webGLContext) {
      setWebGLUnavailable(true);
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: rendererCanvas,
      context: webGLContext,
      antialias: true,
      alpha: false,
      powerPreference: "default",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 576;
    const context = canvas.getContext("2d");
    if (!context) return;
    drawDashboard(context, false);
    const screenTexture = new THREE.CanvasTexture(canvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const laptop = new THREE.Group();
    const aluminum = new THREE.MeshStandardMaterial({
      color: "#aeb3ad",
      metalness: 0.88,
      roughness: 0.2,
    });
    const bezel = new THREE.MeshStandardMaterial({
      color: "#111411",
      metalness: 0.35,
      roughness: 0.2,
    });
    const screenBody = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 5.25, 0.34, 3, 3, 2),
      aluminum,
    );
    screenBody.position.y = 0.35;
    screenBody.castShadow = true;
    laptop.add(screenBody);
    const screenInset = new THREE.Mesh(
      new THREE.BoxGeometry(8.35, 4.82, 0.12),
      bezel,
    );
    screenInset.position.set(0, 0.35, 0.2);
    laptop.add(screenInset);
    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(8.02, 4.5),
      new THREE.MeshBasicMaterial({ map: screenTexture }),
    );
    display.position.set(0, 0.35, 0.269);
    laptop.add(display);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(9.3, 0.28, 5.1, 4, 1, 4),
      aluminum,
    );
    base.position.set(0, -2.49, 2.32);
    base.rotation.x = -0.04;
    base.castShadow = true;
    base.receiveShadow = true;
    laptop.add(base);
    const keyboard = new THREE.Group();
    const keyMaterial = new THREE.MeshStandardMaterial({
      color: "#242824",
      metalness: 0.25,
      roughness: 0.45,
    });
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 13; column += 1) {
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.08, 0.34),
          keyMaterial,
        );
        key.position.set(-3.06 + column * 0.51, -2.29, 0.95 + row * 0.42);
        key.rotation.x = -0.04;
        keyboard.add(key);
      }
    }
    laptop.add(keyboard);
    const trackpad = new THREE.Mesh(
      new THREE.BoxGeometry(2.75, 0.035, 1.25),
      new THREE.MeshStandardMaterial({
        color: "#919690",
        metalness: 0.75,
        roughness: 0.28,
      }),
    );
    trackpad.position.set(0, -2.27, 3.58);
    laptop.add(trackpad);
    scene.add(laptop);

    const iconTargets = [
      [-5.2, 2.5, 5.1],
      [5.1, 2.3, 4.7],
      [5.5, -1.2, 4.2],
      [-5.3, -1.3, 4.5],
    ];
    const icons = iconTargets.map((_, index) => {
      const icon = createIcon(index);
      icon.visible = false;
      scene.add(icon);
      return icon;
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 30),
      new THREE.MeshStandardMaterial({
        color: "#070907",
        roughness: 0.72,
        metalness: 0.28,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.72;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.HemisphereLight("#dfffb3", "#111411", 1.7));
    const keyLight = new THREE.DirectionalLight("#ffffff", 4.2);
    keyLight.position.set(-4, 7, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(ACID, 40, 22);
    rimLight.position.set(5, 1, 4);
    scene.add(rimLight);

    let backend = false;
    let frame = 0;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const render = () => {
      const p = reduceMotion ? 0.82 : progress.current;
      const nextBackend = p > 0.47;
      if (nextBackend !== backend) {
        backend = nextBackend;
        drawDashboard(context, backend);
        screenTexture.needsUpdate = true;
      }

      const push = THREE.MathUtils.smoothstep(p, 0.2, 0.5);
      const pull = THREE.MathUtils.smoothstep(p, 0.56, 0.76);
      camera.position.z = 14 - push * 8.4 + pull * 7.1;
      camera.position.y = 0.8 - push * 0.35 + pull * 0.45;
      laptop.rotation.y = -0.28 + p * 0.5;
      laptop.rotation.x = -0.04 + Math.sin(p * Math.PI * 2) * 0.025;
      laptop.position.y = Math.sin(p * Math.PI * 3) * 0.08;

      icons.forEach((icon, index) => {
        const reveal = THREE.MathUtils.smoothstep(
          p,
          0.66 + index * 0.035,
          0.76 + index * 0.035,
        );
        icon.visible = reveal > 0;
        const [x, y, z] = iconTargets[index];
        icon.position.set(
          x * reveal,
          0.35 + (y - 0.35) * reveal,
          0.1 + z * reveal,
        );
        icon.scale.setScalar(Math.max(0.01, reveal));
        icon.rotation.x = p * 2.2 + index;
        icon.rotation.y = p * 3.1 - index * 0.4;
      });
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    render();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      screenTexture.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        if (Array.isArray(object.material))
          object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      });
      renderer.domElement.remove();
    };
  }, [progress]);

  return (
    <div ref={mountRef} className="absolute inset-0" aria-hidden="true">
      {webGLUnavailable && (
        <video
          ref={fallbackVideoRef}
          muted
          playsInline
          preload="auto"
          poster={poster}
          className="h-full w-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
          <track
            kind="captions"
            src="/decorative-captions.vtt"
            srcLang="en"
            label="English"
            default
          />
        </video>
      )}
    </div>
  );
}
