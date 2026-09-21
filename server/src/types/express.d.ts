import type { AuthContext } from './authContext.js';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by the `authenticate` middleware when a valid access token exists.
       */
      authenticated?: AuthContext;
      /**
       * Validated payloads are attached by the `validate` middleware as
       * `validatedBody` / `validatedQuery` / `validatedParams`.
       */
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export {};