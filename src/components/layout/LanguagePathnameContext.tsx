'use client';

import { createContext } from 'react';

/** Only the global 404 supplies a URL when Next exposes /_not-found. */
export const LanguagePathnameContext = createContext<string | null>(null);
