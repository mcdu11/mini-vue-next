import { reactive } from '../src/reactive'

describe('reactivity/reactive', () => {
  test('reactive', () => {
    const obj = reactive({ name: 'vue', arr: [1, 2, 3] })

    obj.name = 'asd'
    obj.arr.push(4)
    expect(obj).toEqual({
      name: 'asd',
      arr: [1, 2, 3, 4],
    })
  })
})
