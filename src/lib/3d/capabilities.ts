import * as THREE from "three";

export interface DeviceCapabilities {
  hasWebGL: boolean;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  pixelRatio: number;
  qualityTier: "high" | "medium" | "low" | "fallback";
}

export function getDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return {
      hasWebGL: false,
      isMobile: false,
      prefersReducedMotion: false,
      pixelRatio: 1,
      qualityTier: "fallback",
    };
  }

  // 1. Check WebGL support
  let hasWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as (WebGLRenderingContext | WebGL2RenderingContext | null);
    hasWebGL = Boolean(gl);
    // Cleanup test context
    if (gl && typeof gl.getExtension === "function") {
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    }
  } catch {
    hasWebGL = false;
  }

  // 2. Check Reduced Motion preference
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 3. Mobile detection
  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // 4. Determine pixel ratio safely (cap at 2 for performance)
  const dpr = typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1;
  const pixelRatio = isMobile ? 1 : Math.min(dpr, 1.75);

  // 5. Determine Quality Tier
  let qualityTier: "high" | "medium" | "low" | "fallback" = "high";
  if (!hasWebGL) {
    qualityTier = "fallback";
  } else if (prefersReducedMotion) {
    qualityTier = "low";
  } else if (isMobile) {
    qualityTier = "medium";
  } else {
    qualityTier = "high";
  }

  return {
    hasWebGL,
    isMobile,
    prefersReducedMotion,
    pixelRatio,
    qualityTier,
  };
}

/**
 * Robust resource disposal to prevent WebGL context leaks and memory accumulation
 * as required by production zero-leak standards.
 */
export function disposeThreeScene(
  scene: THREE.Scene | null,
  renderer: THREE.WebGLRenderer | null
) {
  if (!scene) return;

  scene.traverse((object: any) => {
    if (!object) return;

    // Dispose geometries
    if (object.geometry) {
      object.geometry.dispose();
    }

    // Dispose materials and attached textures
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((mat: THREE.Material) => disposeMaterial(mat));
      } else {
        disposeMaterial(object.material);
      }
    }
  });

  // Clear scene children
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  // Dispose renderer and force context loss release
  if (renderer) {
    try {
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    } catch {
      // Ignored
    }
  }
}

function disposeMaterial(material: any) {
  if (!material) return;

  // Dispose texture maps
  const textureKeys = [
    "map",
    "lightMap",
    "bumpMap",
    "normalMap",
    "specularMap",
    "envMap",
    "alphaMap",
    "aoMap",
    "displacementMap",
    "emissiveMap",
    "gradientMap",
    "metalnessMap",
    "roughnessMap",
  ];

  for (const key of textureKeys) {
    if (material[key] && typeof material[key].dispose === "function") {
      material[key].dispose();
    }
  }

  if (typeof material.dispose === "function") {
    material.dispose();
  }
}
