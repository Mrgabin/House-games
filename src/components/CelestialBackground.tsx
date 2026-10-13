import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export const CelestialBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const TAU = Math.PI * 2;
    const isCompact = window.innerWidth <= 768;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, isCompact ? 1.25 : 1.75);
    renderer.setPixelRatio(getPixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x02030a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02030a, 0.015);

    const camera = new THREE.PerspectiveCamera(
      39,
      window.innerWidth / window.innerHeight,
      0.08,
      90
    );
    const responsiveCameraZ = () => {
      const aspect = window.innerWidth / window.innerHeight;
      if (aspect < 0.66) return 10.6;
      if (aspect < 0.95) return 9.55;
      return 8.55;
    };
    camera.position.set(0, 0.25, responsiveCameraZ());

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.045;
    controls.enablePan = false;
    controls.enableZoom = false; // Background ambient mode
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.20;
    controls.target.set(0, 0.02, 0);
    controls.update();

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.48,
      0.28,
      0.52
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const noiseGLSL = `
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float saturate(float value) { return clamp(value, 0.0, 1.0); }
      vec3 safeNormalize(vec3 value) { return value * inversesqrt(max(dot(value, value), 1.0e-12)); }
      vec3 sanitizeVec3(vec3 value, vec3 fallbackValue) {
        return (any(notEqual(value, value)) || any(greaterThan(abs(value), vec3(1.0e5)))) ? fallbackValue : value;
      }
      vec3 limitLuminance(vec3 color, float maximumLuminance) {
        vec3 safeColor = max(sanitizeVec3(color, vec3(0.0)), vec3(0.0));
        float luminance = dot(safeColor, vec3(0.2126, 0.7152, 0.0722));
        return safeColor * min(1.0, maximumLuminance / max(luminance, 1.0e-5));
      }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m *= m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }
    `;

    // Vesper specific functions (Preset 3 - Faceted Violet & Cyan Engine)
    const vesperGLSL = `
      vec3 vesperPosition(vec3 seed, float time) {
        vec3 direction = safeNormalize(seed);
        vec3 stepped = floor(direction * 7.0 + 0.5) / 7.0;
        vec3 facetedDirection = safeNormalize(mix(direction, stepped, 0.68));
        float cell = snoise(facetedDirection * 4.8);
        vec3 axisA = safeNormalize(vec3(0.82, 0.31, 0.48));
        vec3 axisB = safeNormalize(vec3(-0.24, 0.91, 0.34));
        vec3 axisC = safeNormalize(vec3(0.41, -0.17, 0.90));
        float lattice = sin(dot(facetedDirection, axisA) * 18.0) * sin(dot(facetedDirection, axisB) * 16.0) * sin(dot(facetedDirection, axisC) * 14.0);
        float seam = pow(abs(lattice), 5.5);
        vec3 p = facetedDirection * (2.06 + cell * 0.145 + seam * 0.070);
        p.y *= 1.018;
        return p;
      }

      vec3 vesperColor(vec3 p, vec3 seed, float time) {
        vec3 direction = safeNormalize(seed);
        float facet = floor((snoise(direction * 4.7) * 0.5 + 0.5) * 7.0) / 7.0;
        float polar = smoothstep(0.48, 0.96, abs(direction.y));
        float seamNoise = abs(snoise(direction * 10.0 + vec3(0.0, time * 0.025, 0.0)));
        float seam = 1.0 - smoothstep(0.025, 0.14, seamNoise);
        vec3 night = vec3(0.018, 0.006, 0.12);
        vec3 violet = vec3(0.45, 0.045, 0.92);
        vec3 amethyst = vec3(0.98, 0.18, 1.38);
        vec3 cyan = vec3(0.03, 1.08, 1.48);
        vec3 color = mix(night, violet, facet);
        color = mix(color, amethyst, smoothstep(0.60, 0.96, facet) * 0.72);
        color += cyan * seam * (0.38 + polar * 1.15);
        color += cyan * pow(polar, 5.0) * 0.50;
        return limitLuminance(color, 1.56);
      }
    `;

    // Nebula sphere
    const nebulaGeometry = new THREE.SphereGeometry(45, 36, 24);
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        ${noiseGLSL}
        uniform float uTime;
        varying vec3 vDirection;
        void main() {
          vec3 direction = safeNormalize(vDirection);
          float broad = snoise(direction * 1.7 + vec3(0.0, uTime * 0.006, 0.0));
          float cloud = smoothstep(0.12, 0.88, broad);
          float horizon = pow(max(1.0 - abs(direction.y), 0.0), 4.0);
          vec3 midnight = vec3(0.0015, 0.002, 0.009);
          vec3 violet = vec3(0.045, 0.015, 0.08);
          gl_FragColor = vec4(midnight + violet * cloud * horizon * 0.5, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // Stars
    const starCount = isCompact ? 3500 : 6500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starSeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = THREE.MathUtils.lerp(12, 43, Math.pow(Math.random(), 0.62));
      const y = THREE.MathUtils.randFloatSpread(2);
      const theta = Math.random() * TAU;
      const radial = Math.sqrt(Math.max(0, 1 - y * y));

      starPositions[i * 3] = Math.cos(theta) * radial * radius;
      starPositions[i * 3 + 1] = y * radius;
      starPositions[i * 3 + 2] = Math.sin(theta) * radial * radius;
      starSizes[i] = 0.65 + Math.pow(Math.random(), 5) * 4.4;
      starSeeds[i] = Math.random();
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aSeed', new THREE.BufferAttribute(starSeeds, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float aSize;
        attribute float aSeed;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec3 p = position;
          float drift = uTime * (0.003 + aSeed * 0.004);
          float s = sin(drift); float c = cos(drift);
          p.xz = mat2(c, -s, s, c) * p.xz;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio * (18.0 / max(1.0, -mvPosition.z));
          float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 31.0);
          vAlpha = (0.18 + aSeed * 0.58) * twinkle;
          vColor = mix(vec3(0.48, 0.65, 1.0), vec3(1.0, 0.82, 0.64), aSeed);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float core = exp(-d * 10.0);
          gl_FragColor = vec4(vColor * core, vAlpha * core);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Planet Group permanently locked to Vesper
    const planetGroup = new THREE.Group();
    planetGroup.rotation.z = -0.055;
    scene.add(planetGroup);

    const surfaceGeometry = new THREE.IcosahedronGeometry(1, isCompact ? 5 : 6);
    const surfaceUniforms = { uTime: { value: 0 } };
    const surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: surfaceUniforms,
      vertexShader: `
        ${noiseGLSL}
        ${vesperGLSL}
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vObjectPosition;
        varying vec3 vSeed;
        varying vec3 vNormalApprox;

        void main() {
          vec3 seed = safeNormalize(position);
          vec3 objectPosition = sanitizeVec3(vesperPosition(seed, uTime), seed * 2.08);
          vec4 worldPos = modelMatrix * vec4(objectPosition, 1.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
          vWorldPosition = worldPos.xyz;
          vObjectPosition = objectPosition;
          vSeed = seed;
          vNormalApprox = safeNormalize(mat3(modelMatrix) * objectPosition);
        }
      `,
      fragmentShader: `
        ${noiseGLSL}
        ${vesperGLSL}
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vObjectPosition;
        varying vec3 vSeed;
        varying vec3 vNormalApprox;

        void main() {
          vec3 baseColor = vesperColor(vObjectPosition, vSeed, uTime);
          vec3 normal = safeNormalize(vNormalApprox);
          vec3 viewDir = safeNormalize(cameraPosition - vWorldPosition);
          vec3 lightDir = safeNormalize(vec3(-0.7, 0.55, 0.85));
          float diff = saturate(dot(normal, lightDir));
          float fresnel = pow(max(1.0 - saturate(dot(normal, viewDir)), 0.0), 3.0);
          vec3 color = baseColor * (0.3 + diff * 0.9) + mix(vec3(0.03, 1.08, 1.48), baseColor, 0.4) * fresnel * 0.7;
          gl_FragColor = vec4(clamp(color, vec3(0.0), vec3(2.0)), 1.0);
        }
      `,
      side: THREE.FrontSide
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    planetGroup.add(surfaceMesh);

    // Vesper Atmosphere
    const atmosphereGeometry = new THREE.IcosahedronGeometry(1.06, isCompact ? 4 : 5);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: surfaceUniforms,
      vertexShader: `
        varying vec3 vNormalApprox;
        varying vec3 vWorldPosition;
        void main() {
          vNormalApprox = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position * 2.18, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormalApprox;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float facing = max(dot(vNormalApprox, viewDir), 0.0);
          float fresnel = pow(1.0 - facing, 2.5);
          vec3 color = mix(vec3(0.45, 0.05, 0.95), vec3(0.03, 0.95, 1.35), fresnel);
          gl_FragColor = vec4(color * fresnel, clamp(fresnel * 0.38, 0.0, 0.35));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planetGroup.add(atmosphereMesh);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;

      surfaceUniforms.uTime.value = time;
      nebulaMaterial.uniforms.uTime.value = time;
      starMaterial.uniforms.uTime.value = time;

      planetGroup.rotation.y += 0.035 * delta;
      stars.rotation.y = time * 0.0012;
      nebula.rotation.y = -time * 0.0003;

      controls.update();
      composer.render();
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.position.z = responsiveCameraZ();
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      {/* Three.js Canvas Container permanently displaying Vesper without any floating widgets */}
      <div 
        ref={containerRef} 
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Spatial Vignette Gradient for readability */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 35%, transparent 25%, rgba(2, 3, 10, 0.5) 60%, rgba(2, 3, 10, 0.92) 100%)'
        }}
      />
    </>
  );
};
