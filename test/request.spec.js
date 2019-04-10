const { expect } = require('chai')
const Request = require('../lib/request')

describe('request', function () {
  it('should set the storage property if storage items are present', function () {
    const src = {
      plugin_install: {
        plugin_storage_items: [
          {
            key: 'foo',
            value: 'bar'
          },
          {
            key: 'a',
            value: 'b'
          }
        ]
      }
    }
    const req = new Request({}, src, {})
    expect(req.storage).to.deep.equal({ foo: 'bar', a: 'b' })
  })
  it('should still have the property set if no storage items are present', function () {
    const src = {
      plugin_install: {}
    }
    const req = new Request({}, src, {})
    expect(req.storage).to.deep.equal({})
  })
})
