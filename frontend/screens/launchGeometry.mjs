export function getLaunchGeometry(width, height, insets, measuredBrandBottom) {
  const titleSize = Math.min(72, width * 0.18, height * 0.12);
  const brandTop = insets.top + Math.min(80, height * 0.09);
  const brandBottom = measuredBrandBottom ?? brandTop + titleSize * 1.4 + 48;
  const stageTop = brandBottom + 24;
  const groundY = height - insets.bottom - 38;
  const cloudScale = Math.max(0.1, Math.min((width - 40) / 320, (groundY - stageTop) / 340, 2.2));
  const rocketSize = Math.min(180, width * 0.43, height * 0.28);
  const impactX = width / 2;
  const startX = -rocketSize * 0.6;
  const startY = Math.max(insets.top + 30, height * 0.12);
  const direction = Math.atan2(groundY - startY, impactX - startX);
  // Ionicons' original rocket points toward the upper-right (-45 degrees).
  const rotation = direction * 180 / Math.PI + 45;
  const noseDistance = rocketSize * 0.42;
  return { titleSize, brandTop, stageTop, groundY, cloudScale, rocketSize, impactX, startX, startY, rotation,
    endX: impactX - Math.cos(direction) * noseDistance,
    endY: groundY - Math.sin(direction) * noseDistance };
}
