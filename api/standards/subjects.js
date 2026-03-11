import { getStandards } from '../_store.js'

export default function handler(req, res) {
  const standards = getStandards()
  const subjects = [...new Set([...standards.values()].map(s => s.subject))].sort()
  res.json(subjects)
}
