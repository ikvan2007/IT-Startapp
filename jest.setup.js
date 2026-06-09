require('@testing-library/jest-dom')

const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

if (typeof global.Request === 'undefined') {
  global.Request = class Request {}
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {}
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {}
}

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      userId: 1,
      email: 'student@edu.ru',
      role: 'student',
    },
  }),
}))