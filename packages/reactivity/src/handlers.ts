import { isObject, hasChanged, hasOwn } from '@mini-vue/shared'
import { track, trigger } from './effect'
import { reactive } from './reactive'

function createGetter(
  isReadonly = false,
  shallow = false,
): ProxyHandler<object>['get'] {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    console.log(`拦截到了get操作`, target, key)
    track(target, 'get', String(key))
    if (isObject(res)) {
      return reactive(res)
    }
    return res
  }
}

function createSetter(shallow = false): ProxyHandler<object>['set'] {
  return function set(target, key, value, receiver) {
    const hadKey = hasOwn(target, key)
    const oldValue = Reflect.get(target, key, receiver)
    const result = Reflect.set(target, key, value, receiver)
    if (!hadKey) {
      console.log(`用户新增了属性 key is ${String(key)} value is ${value}`)
      trigger(target, 'add', String(key), value)
    } else if (hasChanged(value, oldValue)) {
      console.log(`用户修改了属性 key is ${String(key)} value is ${value}`)
      trigger(target, 'set', String(key), value)
    }
    return result
  }
}

const get = createGetter()
const set = createSetter()

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  //   deleteProperty() {
  //     return true
  //   },
}
export const mutableCollectionHandlers = {}
