import { create } from 'zustand'

interface StoreState {
  // We'll add state properties here later
  
  // Example state and action (we can modify this based on your needs)
  count: number
  increment: () => void
  decrement: () => void
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
})) 