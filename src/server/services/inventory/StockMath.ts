// @ts-nocheck
export type StockState = {
  onHand: number;
  reserved: number;
  available: number;
};

export function computeAvailable(onHand: number, reserved: number): number {
  return onHand - reserved;
}

export function applyDelta(state: StockState, deltaOnHand: number, deltaReserved: number): StockState {
  const onHand = state.onHand + deltaOnHand;
  const reserved = state.reserved + deltaReserved;
  const available = computeAvailable(onHand, reserved);
  return { onHand, reserved, available };
}
