// Copy browser coordinate properties explicitly; do not retain a host object.
export function readPosition(result) {
  const latitude = result?.coords?.latitude;
  const longitude = result?.coords?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function locationFailure(code) {
  if (code === 1) return '위치 접근이 차단되었습니다. 브라우저의 사이트 권한에서 위치를 허용하거나 지역명으로 검색해 주세요.';
  if (code === 3) return '현재 위치 확인 시간이 초과되었습니다. 다시 시도하거나 지역명으로 검색해 주세요.';
  return '브라우저에서 현재 위치 좌표를 받지 못했습니다. 기기의 위치 서비스를 켜거나 지역명으로 검색해 주세요.';
}
