"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

// Wireframe colors, swapped between themes.
//  - Dark (unchanged): blue gear, orange sweeping highlight.
//  - Light: orange gear, blue highlight.
const BLUE = "#00E5FF";
const ORANGE = "#FF5A00";
// Highlight colors as raw shader RGB (0-1). A Vector3 (not THREE.Color) keeps
// these exact values — no color-management conversion — so dark mode looks
// identical to before.
const HIGHLIGHT_ORANGE: [number, number, number] = [1.0, 0.18, 0.0];
const HIGHLIGHT_BLUE: [number, number, number] = [0.0, 0.898, 1.0];

function OrbScene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const gearRef = useRef<THREE.Group>(null!);
  const highlightRef = useRef<THREE.ShaderMaterial>(null!);

  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const gearColor = isLight ? ORANGE : BLUE;

  // Create a gear shape
  const gearShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 3;
    const innerRadius = 2.4;
    const holeRadius = 1.2;
    const teeth = 12;
    
    // Draw outer teeth
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      // create a slight bevel for teeth
      const nextAngle = ((i + 0.5) * Math.PI) / teeth;
      if (i === 0) {
        shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      } else {
        shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      shape.lineTo(Math.cos(nextAngle) * radius, Math.sin(nextAngle) * radius);
    }
    shape.closePath();

    // Create a center hole
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
    shape.holes.push(holePath);

    return shape;
  }, []);

  // Extrude settings for the gear
  const extrudeSettings = useMemo(() => ({
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.1,
  }), []);

  const highlightUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Vector3(...HIGHLIGHT_ORANGE) },
  }), []);

  // Swap the highlight color with the theme (mutates the stable uniform; Three
  // reads .value each frame, so no material recreation is needed).
  useEffect(() => {
    highlightUniforms.uColor.value.set(...(isLight ? HIGHLIGHT_BLUE : HIGHLIGHT_ORANGE));
  }, [isLight, highlightUniforms]);

  useFrame((state) => {
    // Slower base rotation
    const t = state.clock.getElapsedTime();
    gearRef.current.rotation.z = t * 0.15; // rotate around Z for the gear face

    if (highlightRef.current) {
      highlightRef.current.uniforms.uTime.value = t;
    }

    // Mouse reactive rotation (smoothly tilt based on mouse)
    const targetX = (mouseY - 0.5) * Math.PI * 0.5; // Max tilt up/down
    const targetY = (mouseX - 0.5) * Math.PI * 0.5; // Max tilt left/right

    gearRef.current.rotation.x = THREE.MathUtils.lerp(gearRef.current.rotation.x, targetX, 0.05);
    gearRef.current.rotation.y = THREE.MathUtils.lerp(gearRef.current.rotation.y, targetY, 0.05);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      
      <group ref={gearRef} position-x={-0.08} scale={1.23}>
        {/* The Gear Mesh */}
        <mesh>
          <extrudeGeometry args={[gearShape, extrudeSettings]} />
          <meshBasicMaterial
            color={gearColor}
            wireframe={true}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Moving highlight sweeping along the gear wireframe (orange in dark, blue in light) */}
        <mesh position-z={0.012}>
          <extrudeGeometry args={[gearShape, extrudeSettings]} />
          <shaderMaterial
            ref={highlightRef}
            uniforms={highlightUniforms}
            wireframe={true}
            transparent={true}
            depthWrite={false}
            blending={THREE.NormalBlending}
            vertexShader={`
              varying vec3 vPosition;

              void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform float uTime;
              uniform vec3 uColor;
              varying vec3 vPosition;

              void main() {
                float angle = atan(vPosition.y, vPosition.x);
                float sweep = mod(angle + 6.28318530718 + uTime * 0.42, 6.28318530718);
                float band = min(sweep, 6.28318530718 - sweep);
                float glow = smoothstep(0.62, 0.0, band);
                float shimmer = 0.72 + 0.28 * sin(uTime * 2.0 + length(vPosition.xy) * 3.0);
                float alpha = glow * shimmer * 0.78;

                if (alpha < 0.02) discard;

                gl_FragColor = vec4(uColor, alpha);
              }
            `}
          />
        </mesh>
        
        {/* Another concentric gear or decoration to add complexity */}
        <mesh rotation-z={Math.PI / 6}>
          <extrudeGeometry args={[gearShape, { ...extrudeSettings, depth: 0.2 }]} />
          <meshBasicMaterial 
            color="#FFFFFF" 
            wireframe={true} 
            transparent 
            opacity={0.2} 
          />
        </mesh>
      </group>
    </>
  );
}

export function HeroOrb({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <OrbScene mouseX={mouseX} mouseY={mouseY} />
        {/* Removed Bloom for better performance and matte look, or kept minimal */}
      </Canvas>
    </div>
  );
}