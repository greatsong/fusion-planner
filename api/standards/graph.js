import { getGraph } from '../_store.js'

export default function handler(req, res) {
  res.json(getGraph())
}
