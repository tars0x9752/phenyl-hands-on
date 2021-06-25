import { greet } from '../index'

describe('greet', () => {
  describe('valid inputs', () => {
    it('tars', () => {
      expect(greet('tars')).toBe('hello, tars')
    })
  })
})
