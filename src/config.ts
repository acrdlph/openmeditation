import * as THREE from 'three';

export const CONFIG = {
  SECONDS_TO_ASCEND: 30,
  STILLNESS_DELAY: 2.0,
};

export const COLORS = {
  blue: "#2288cc",
  gold: "#ffaa00",
  white: "#ffffff",
  bg: "#050510",
};

// For THREE.Color conversions where needed
export const THREE_COLORS = {
  blue: new THREE.Color(COLORS.blue),
  gold: new THREE.Color(COLORS.gold),
  white: new THREE.Color(COLORS.white),
};
