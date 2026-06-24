// src/test/setup.js

import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers between tests so one test's mocks don't leak into another
afterEach(() => {
    server.resetHandlers();
    cleanup();
    localStorage.clear();
});

// Clean up after all tests are done
afterAll(() => server.close());