/** Resolve a dot-separated path (e.g. ".items" or ".data.results") on an object. */
export const getValueByPath = (obj: Record<string, unknown>, path: string): unknown =>
  path
    .replace(/^\./, '')
    .split('.')
    .reduce<unknown>((current, key) => {
      if (current == null || typeof current !== 'object') return undefined
      return (current as Record<string, unknown>)[key]
    }, obj)

/** Check whether the response for a given reqIndex has an empty array at the specified path. */
export const isEmptyAtPath = (multiQueryData: Record<string, unknown>, reqIndex: number, path: string): boolean => {
  const reqData = multiQueryData[`req${reqIndex}`]
  if (reqData == null || typeof reqData !== 'object') return false
  const value = getValueByPath(reqData as Record<string, unknown>, path)
  return Array.isArray(value) && value.length === 0
}
