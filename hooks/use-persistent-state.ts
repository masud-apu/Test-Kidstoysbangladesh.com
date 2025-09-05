"use client"

import { useState, useEffect } from 'react'

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
  }
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options || {}

  // Initialize state from localStorage or use default
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue !== null) {
        return deserialize(storedValue)
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }

    return defaultValue
  })

  // Update localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(key, serialize(state))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, state, serialize])

  return [state, setState]
}

export function usePersistentObject<T extends Record<string, any>>(
  keyPrefix: string,
  defaultValue: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = usePersistentState(keyPrefix, defaultValue)

  const updateState = (updates: Partial<T>) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }))
  }

  return [state, updateState]
}