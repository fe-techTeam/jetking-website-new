/**
 * Browser geolocation helpers — GPS-first when the device can provide it.
 */

export type UserPosition = {
  lat: number;
  lng: number;
  /** Horizontal accuracy in metres (lower is better). */
  accuracyM: number;
};

const GOOD_ACCURACY_M = 40;
const WATCH_BUDGET_MS = 10_000;
const HARD_TIMEOUT_MS = 20_000;

/**
 * Resolve the visitor's coordinates with `enableHighAccuracy`, discarding stale
 * caches. Watches briefly and keeps the sample with the best (lowest) accuracy
 * so a coarse network fix is replaced by GPS when it arrives.
 */
export function getAccurateUserPosition(): Promise<UserPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation unavailable'), { code: 0 }));
      return;
    }

    let best: GeolocationPosition | null = null;
    let settled = false;
    let watchId: number | null = null;

    const opts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: HARD_TIMEOUT_MS,
    };

    const cleanup = () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(budgetTimer);
      window.clearTimeout(hardTimer);
    };

    const settle = (pos: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy,
      });
    };

    const fail = (error: GeolocationPositionError) => {
      if (settled) return;
      if (best) {
        settle(best);
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };

    const onSample = (pos: GeolocationPosition) => {
      if (
        !best ||
        pos.coords.accuracy < best.coords.accuracy ||
        (pos.coords.accuracy === best.coords.accuracy &&
          pos.timestamp > best.timestamp)
      ) {
        best = pos;
      }
      if (pos.coords.accuracy <= GOOD_ACCURACY_M) settle(pos);
    };

    watchId = navigator.geolocation.watchPosition(onSample, fail, opts);

    // After the budget, accept the best sample so far (or wait on hard timeout).
    const budgetTimer = window.setTimeout(() => {
      if (best) settle(best);
    }, WATCH_BUDGET_MS);

    const hardTimer = window.setTimeout(() => {
      if (best) settle(best);
      else {
        fail({
          code: 3,
          message: 'Timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      }
    }, HARD_TIMEOUT_MS);
  });
}
