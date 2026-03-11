import { getStandards } from '../_store.js'

export default function handler(req, res) {
  const standards = getStandards()
  const levels = [...new Set([...standards.values()].map(s => s.school_level).filter(Boolean))].sort()
  res.json(levels)
}
