import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useFetch – lightweight hook for GET-style API calls.
 *
 * @param {Function} fetcher  async function that returns an axios response
 * @param {Array}    deps     re-fetch when these change
 * @param {Object}   opts     { immediate: bool (default true), transform: fn }
 */
export function useFetch(fetcher, deps = [], opts = {}) {
  const { immediate = true, transform } = opts
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const run = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      const payload = res?.data ?? res
      setData(transform ? transform(payload) : payload)
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err?.response?.data?.message ?? err.message ?? 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => {
    if (immediate) run()
    return () => abortRef.current?.abort()
  }, [run]) // eslint-disable-line

  return { data, loading, error, refetch: run }
}

/**
 * useMutation – for POST/PUT/DELETE calls with manual trigger.
 */
export function useMutation(mutationFn, opts = {}) {
  const { onSuccess, onError } = opts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await mutationFn(...args)
      onSuccess?.(res?.data ?? res)
      return res?.data ?? res
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Something went wrong'
      setError(msg)
      onError?.(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn]) // eslint-disable-line

  return { mutate, loading, error }
}
