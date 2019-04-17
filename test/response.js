const { expect } = require('chai')
const Response = require('../lib/response')

describe('response', function () {
  describe('res.storage_set and res.storage_unset', function () {
    it('sets an array of ordered commands on the output meta', function () {
      let out = {}
      const context = {
        succeed: toOut => {
          out = toOut
        }
      }
      const res = new Response({ getLoggingSignature: () => {} }, context)
      res.storage_set('foo', 'bar')
      res.storage_set('a', { b: 'c' })
      res.storage_unset('baz')
      res.storage_set('bool', false)
      res.storage_unset('bat')
      res.storage_set_unique('something')
      res.storage_set_unique('with_chars', { chars: 'abcdefg' })
      res.storage_set_unique('with_size', { size: 3 })
      res._respond()
      expect(out.meta.storage_updates).to.deep.equal([
        { action: 'set', key: 'foo', value: 'bar' },
        { action: 'set', key: 'a', value: { b: 'c' } },
        { action: 'unset', key: 'baz' },
        { action: 'set', key: 'bool', value: false },
        { action: 'unset', key: 'bat' },
        { action: 'set_unique', key: 'something' },
        { action: 'set_unique', key: 'with_chars', chars: 'abcdefg' },
        { action: 'set_unique', key: 'with_size', size: 3 }
      ])
    })
  })
})
