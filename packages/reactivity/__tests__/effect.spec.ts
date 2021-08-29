import { reactive } from '../src/reactive'
import { effect } from '../src/effect'

describe('reactivity/effect', () => {
  test('has immediate called callback', () => {
    const callback = jest.fn()
    effect(callback)

    expect(callback.mock.calls.length).toBe(1)
  })

  test('effect with reactive', () => {
    const obj = reactive({ name: 'dwq', age: '24' })

    effect(() => {
      console.log(`effect called and name is ${obj.name}`)
    })

    obj.name = 'hch'
    expect(obj.name).toBe('hch')
  }, 2000)
})
