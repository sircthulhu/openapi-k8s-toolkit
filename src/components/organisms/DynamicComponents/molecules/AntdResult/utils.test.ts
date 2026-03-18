import { getValueByPath, isEmptyAtPath } from './utils'

// ── getValueByPath ───────────────────────────────────────────

describe('getValueByPath', () => {
  it('resolves a single-level path', () => {
    expect(getValueByPath({ items: [1, 2] }, '.items')).toEqual([1, 2])
  })

  it('resolves a path without leading dot', () => {
    expect(getValueByPath({ items: [1] }, 'items')).toEqual([1])
  })

  it('resolves a deeply nested path', () => {
    const obj = { data: { results: { nested: 'value' } } }
    expect(getValueByPath(obj, '.data.results.nested')).toBe('value')
  })

  it('returns undefined for missing intermediate key', () => {
    expect(getValueByPath({ data: { other: 1 } }, '.data.results.nested')).toBeUndefined()
  })

  it('returns undefined when intermediate is null', () => {
    expect(getValueByPath({ data: null } as unknown as Record<string, unknown>, '.data.items')).toBeUndefined()
  })

  it('returns undefined when intermediate is a primitive', () => {
    expect(getValueByPath({ data: 42 } as unknown as Record<string, unknown>, '.data.items')).toBeUndefined()
  })

  it('returns undefined for empty object', () => {
    expect(getValueByPath({}, '.items')).toBeUndefined()
  })

  it('returns the value even if it is falsy (0, false, empty string)', () => {
    expect(getValueByPath({ count: 0 }, '.count')).toBe(0)
    expect(getValueByPath({ flag: false }, '.flag')).toBe(false)
    expect(getValueByPath({ name: '' }, '.name')).toBe('')
  })
})

// ── isEmptyAtPath ────────────────────────────────────────────

describe('isEmptyAtPath', () => {
  it('returns true when array at path is empty', () => {
    expect(isEmptyAtPath({ req0: { items: [] } }, 0, '.items')).toBe(true)
  })

  it('returns false when array at path has elements', () => {
    expect(isEmptyAtPath({ req0: { items: [{ name: 'a' }] } }, 0, '.items')).toBe(false)
  })

  it('returns false when value at path is not an array', () => {
    expect(isEmptyAtPath({ req0: { items: 'string' } }, 0, '.items')).toBe(false)
    expect(isEmptyAtPath({ req0: { items: {} } }, 0, '.items')).toBe(false)
    expect(isEmptyAtPath({ req0: { items: 42 } }, 0, '.items')).toBe(false)
  })

  it('returns false when reqData is null', () => {
    expect(isEmptyAtPath({ req0: null } as unknown as Record<string, unknown>, 0, '.items')).toBe(false)
  })

  it('returns false when reqData is undefined (missing key)', () => {
    expect(isEmptyAtPath({}, 0, '.items')).toBe(false)
  })

  it('returns false when reqData is a non-object primitive', () => {
    expect(isEmptyAtPath({ req0: 'string' }, 0, '.items')).toBe(false)
  })

  it('returns false when path does not exist in reqData', () => {
    expect(isEmptyAtPath({ req0: { metadata: {} } }, 0, '.items')).toBe(false)
  })

  it('works with custom paths', () => {
    expect(isEmptyAtPath({ req1: { data: { results: [] } } }, 1, '.data.results')).toBe(true)
    expect(isEmptyAtPath({ req1: { data: { results: [1] } } }, 1, '.data.results')).toBe(false)
  })

  it('uses the correct reqIndex', () => {
    const data = { req0: { items: [1] }, req1: { items: [] } }
    expect(isEmptyAtPath(data, 0, '.items')).toBe(false)
    expect(isEmptyAtPath(data, 1, '.items')).toBe(true)
  })
})
