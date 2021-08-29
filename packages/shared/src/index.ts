export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const isArray = (val: any) => Array.isArray(val)

export const hasOwn = (target: object, key: string | symbol) =>
  Object.prototype.hasOwnProperty.call(target, key)

export const hasChanged = (newValue: any, oldValue: any) =>
  newValue !== oldValue
