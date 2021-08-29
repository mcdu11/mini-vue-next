import { isArray } from '@mini-vue/shared'

export function effect(fn: () => any, options: { lazy?: boolean } = {}) {
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}

let uid = 0
let activeEffect: any
const effectStack: any[] = []

function createReactiveEffect(fn: () => any, options: { lazy?: boolean } = {}) {
  const effect = function reactiveEffect() {
    // 防止不停修改属性导致死循环
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect)
        activeEffect = effect

        return fn()
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }

  effect.fn = fn
  effect.options = options
  effect.id = uid++
  effect.deps = [] as any

  return effect
}

const targetMap = new WeakMap<object, Map<string, Set<any>>>()
type EffectType = 'add' | 'get' | 'set'

export function track(target: object, type: EffectType, key: string) {
  if (!activeEffect) {
    return
  }

  let depsMap = targetMap.get(target)

  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)

  if (!dep) {
    depsMap.set(key, (dep = new Set([])))
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger(
  target: object,
  type: EffectType,
  key: string,
  value: any,
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    console.log(`${target} 对象还未收集依赖`)
    return
  }

  // 存储依赖的 effects
  const effects = new Set<any>()

  const add = (effectsToAdd: Set<any>) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => effects.add(effect))
    }
  }

  const run = (effect: any) => effect()

  if (key !== null) {
    add(depsMap.get(key)!)
  }

  if (type === 'add') {
    add(depsMap.get(isArray(target) ? 'length' : '')!)
  }

  effects.forEach(run)
}
