import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { siteData } from '../data/site';

type Props = {
  onReady?: () => void;
  onFailure?: () => void;
};

export default function MonolithScene({ onReady, onFailure }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  const failureRef = useRef(onFailure);
  readyRef.current = onReady;
  failureRef.current = onFailure;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement as HTMLElement | null;
    if (!canvas || !host) return;
    const context = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!context) {
      failureRef.current?.();
      return;
    }

    let disposed = false;
    let frame = 0;
    let visible = true;
    let ready = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let cleanupScene: (() => void) | null = null;
    let removePointer: (() => void) | null = null;
    let removeVisibility: (() => void) | null = null;

    const setup = async () => {
      const [
        { GLTFLoader },
        { EXRLoader },
        { EffectComposer },
        { RenderPass },
        { UnrealBloomPass },
        { ShaderPass },
        { OutputPass },
        studioModule,
      ] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/loaders/EXRLoader.js'),
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/ShaderPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
        import('@pmndrs/assets/hdri/studio.exr.js'),
      ]);
      if (disposed) return;

      renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2));
      renderer.setSize(host.clientWidth, host.clientHeight, false);
      renderer.setClearColor(0xF2F3F5, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      const studioWhite = new THREE.Color(0xF2F3F5);
      const black = new THREE.Color(0x000000);
      scene.background = studioWhite;
      const camera = new THREE.PerspectiveCamera(31, host.clientWidth / Math.max(1, host.clientHeight), 0.1, 100);
      camera.position.set(3.45, 1.78, 5.5);
      camera.lookAt(0.05, -0.02, 0);

      const hemi = new THREE.HemisphereLight(0xffffff, 0xc8ccd4, 2.25);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 3.2);
      key.position.set(-3.4, 6.2, 4.1);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.left = -4;
      key.shadow.camera.right = 4;
      key.shadow.camera.top = 4;
      key.shadow.camera.bottom = -4;
      key.shadow.bias = -0.00025;
      scene.add(key);
      const rim = new THREE.PointLight(0x1F6BFF, 2.1, 7);
      rim.position.set(2.8, 0.9, -2.1);
      scene.add(rim);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.ShadowMaterial({ color: 0x0A0A0B, opacity: 0.2 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.33;
      ground.receiveShadow = true;
      scene.add(ground);

      try {
        const exr = await new EXRLoader().loadAsync(studioModule.default);
        if (disposed) { exr.dispose(); return; }
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromEquirectangular(exr).texture;
        scene.environment = environment;
        exr.dispose();
        pmrem.dispose();
      } catch {
        // Studio lighting still works without the optional EXR environment.
      }

      const gltf = await new GLTFLoader().loadAsync(siteData.heroGlb);
      if (disposed) return;
      const monolith = gltf.scene;
      monolith.name = 'ORBITAL hero lattice';
      const bloomLayer = new THREE.Layers();
      bloomLayer.set(1);
      monolith.traverse((child: any) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const isSeam = String(child.name || '').startsWith('seam');
        if (isSeam) {
          child.layers.enable(1);
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material: any) => {
            if (!material) return;
            material.emissive = new THREE.Color(0x1F6BFF);
            material.emissiveIntensity = 3.4;
            material.toneMapped = false;
          });
        }
      });
      scene.add(monolith);

      const bloomComposer = new EffectComposer(renderer);
      bloomComposer.renderToScreen = false;
      bloomComposer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(host.clientWidth, host.clientHeight),
        0.95,
        0.58,
        0.12,
      );
      bloomComposer.addPass(bloomPass);

      const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
          uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture },
          },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main(){ gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv); }`,
          defines: {},
        }),
        'baseTexture',
      );
      finalPass.needsSwap = true;
      const finalComposer = new EffectComposer(renderer);
      finalComposer.addPass(new RenderPass(scene, camera));
      finalComposer.addPass(finalPass);
      finalComposer.addPass(new OutputPass());

      const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const originalMaterials: Record<string, THREE.Material | THREE.Material[]> = {};
      const darken = (object: any) => {
        if (object.isMesh && !bloomLayer.test(object.layers)) {
          originalMaterials[object.uuid] = object.material;
          object.material = darkMaterial;
        }
      };
      const restore = (object: any) => {
        if (originalMaterials[object.uuid]) {
          object.material = originalMaterials[object.uuid];
          delete originalMaterials[object.uuid];
        }
      };

      const resize = () => {
        if (!renderer || disposed) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        bloomComposer.setSize(width, height);
        finalComposer.setSize(width, height);
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      intersectionObserver = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      }, { rootMargin: '120px', threshold: 0.01 });
      intersectionObserver.observe(host);

      let targetX = 0;
      let targetY = 0;
      let pointerX = 0;
      let pointerY = 0;
      let idle = 0;
      const onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      const onPointerLeave = () => { targetX = 0; targetY = 0; };
      host.addEventListener('pointermove', onPointerMove, { passive: true });
      host.addEventListener('pointerleave', onPointerLeave, { passive: true });
      removePointer = () => {
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
      };
      const onVisibility = () => { visible = !document.hidden; };
      document.addEventListener('visibilitychange', onVisibility);
      removeVisibility = () => document.removeEventListener('visibilitychange', onVisibility);

      const render = () => {
        scene.background = black;
        scene.traverse(darken);
        bloomComposer.render();
        scene.traverse(restore);
        scene.background = studioWhite;
        finalComposer.render();
      };

      const loop = (time: number) => {
        frame = requestAnimationFrame(loop);
        if (disposed || !visible || document.hidden) return;
        pointerX += (targetX - pointerX) * 0.055;
        pointerY += (targetY - pointerY) * 0.055;
        idle += 0.00135;
        monolith.rotation.set(pointerY * 0.055, -0.42 + idle + pointerX * 0.16, pointerX * 0.018);
        monolith.position.y = Math.sin(time * 0.00045) * 0.018;
        render();
        if (!ready) {
          ready = true;
          canvas.style.opacity = '1';
          readyRef.current?.();
        }
      };
      frame = requestAnimationFrame(loop);

      cleanupScene = () => {
        scene.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose?.();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: any) => material?.dispose?.());
        });
        darkMaterial.dispose();
        bloomComposer.dispose();
        finalComposer.dispose();
      };
    };

    setup().catch((error) => {
      console.warn('WebGL hero unavailable; poster remains visible', error);
      failureRef.current?.();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      removePointer?.();
      removeVisibility?.();
      cleanupScene?.();
      renderer?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
