import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream, TransformStream, WritableStream } from 'stream/web'
import { fetch, Request, Response, Headers } from 'undici'
import '@testing-library/jest-dom'

Object.assign(global, {
  fetch,
  Request,
  Response,
  Headers,
  ReadableStream,
  TransformStream,
  WritableStream,
  TextDecoder,
  TextEncoder,
})
