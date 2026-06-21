import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';
import axios from 'axios';
import { api } from '../services/api';

axios.defaults.adapter = 'fetch';
api.defaults.adapter = 'fetch';
api.defaults.baseURL = 'http://localhost/api';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
