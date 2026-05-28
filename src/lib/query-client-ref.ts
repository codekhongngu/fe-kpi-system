/**
 * Singleton reference to the QueryClient instance.
 * Set from main.tsx after creation so non-React modules (e.g. api-client)
 * can access it without circular dependencies.
 */
import type { QueryClient } from '@tanstack/react-query'

let _queryClient: QueryClient | null = null

export function setQueryClientRef(qc: QueryClient): void {
  _queryClient = qc
}

export function getQueryClientRef(): QueryClient | null {
  return _queryClient
}
