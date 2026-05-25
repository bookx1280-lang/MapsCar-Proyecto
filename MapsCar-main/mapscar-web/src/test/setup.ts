import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extiende los matchers de Vitest para que reconozcan comandos como .toBeInTheDocument() de forma nativa
expect.extend(matchers);

// Limpia el DOM virtual (jsdom) después de ejecutar cada test individual para evitar fugas de estado
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});