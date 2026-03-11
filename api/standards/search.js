import { searchStandards } from '../_store.js'

export default function handler(req, res) {
  const { q, subject, grade, domain, school_level } = req.query
  const results = searchStandards({ q, subject, grade, domain, school_level })
  res.json(results)
}
