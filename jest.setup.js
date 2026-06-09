require('@testing-library/jest-dom')

const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map(Object.entries(init))
    }
    get(key) {
      return this.map.get(key) || null
    }
    set(key, value) {
      this.map.set(key, value)
    }
    append(key, value) {
      this.map.set(key, value)
    }
  }
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = input
      this.method = init.method || 'GET'
      this.headers = new global.Headers(init.headers || {})
      this._body = init.body || null
    }

    async json() {
      return this._body ? JSON.parse(this._body) : {}
    }

    async text() {
      return this._body || ''
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body = null, init = {}) {
      this._body = body
      this.status = init.status || 200
      this.headers = new global.Headers(init.headers || {})
    }

    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init.headers || {}),
        },
      })
    }

    async json() {
      return this._body ? JSON.parse(this._body) : {}
    }

    async text() {
      return this._body || ''
    }
  }
}