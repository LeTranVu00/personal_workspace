export function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`
}