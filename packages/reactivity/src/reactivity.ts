export function reactive<T>(data: T): T {
  if (Object.prototype.toString.call(data) !== '[object, Object]') {
    return data
  }

  return data
}

export function effect(cb: () => any) {
  cb()
}
