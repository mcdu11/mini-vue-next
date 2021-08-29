import { isObject } from '@mini-vue/shared'
import { mutableCollectionHandlers, mutableHandlers } from './handlers'
const collectionTypes = new Set([Set, Map, WeakMap, WeakSet])

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
  )
}

function createReactiveObject(
  target: any,
  isReadonly: boolean,
  baseHandlers: any,
  collectionHandlers: any,
) {
  if (!isObject(target)) {
    return
  }

  const isCollectionTarget = collectionTypes.has(target.constructor as any)
  const observed = new Proxy(
    target,
    isCollectionTarget ? collectionHandlers : baseHandlers,
  )

  return observed as any
}
