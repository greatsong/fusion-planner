/**
 * 융합 바구니 상태 관리 (Zustand)
 * 교사가 여러 교과의 성취기준을 담아 AI 수업 설계에 넘기는 바구니
 */
import { create } from 'zustand'

export const useBasketStore = create((set, get) => ({
  items: [],  // [{ code, subject, subject_group, content, ... }]

  add: (standard) => {
    const items = get().items
    if (items.some(item => item.code === standard.code)) return // 중복 방지
    set({ items: [...items, standard] })
  },

  remove: (code) => {
    set({ items: get().items.filter(item => item.code !== code) })
  },

  clear: () => set({ items: [] }),

  has: (code) => get().items.some(item => item.code === code),

  // 교과군 수
  subjectGroupCount: () => {
    return new Set(get().items.map(item => item.subject_group)).size
  },

  // AI 설계 가능 여부 (2개 이상 교과)
  canDesign: () => {
    return new Set(get().items.map(item => item.subject_group)).size >= 2
  },
}))
