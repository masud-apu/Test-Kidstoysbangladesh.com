import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'

interface FormFieldData {
  fieldName: string
  value: string
  formName?: string
  isComplete?: boolean
}

interface CheckoutFormData {
  name?: string
  phone?: string
  address?: string
  email?: string
  specialNote?: string
  deliveryType?: string
}

/**
 * Hook for tracking form field interactions and progressive form completion
 * Sends data to PostHog as users fill out forms, even before submission
 */
export function useFormTracking(formName: string = 'generic_form') {
  const formDataRef = useRef<Record<string, string>>({})
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    return () => {
      // Cleanup debounce timers on unmount
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer))
    }
  }, [])

  const trackFieldInteraction = (fieldName: string, value: string, eventType: 'focus' | 'blur' | 'change') => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    const fieldData: FormFieldData = {
      fieldName,
      value: value || '', // Send actual value for data collection
      formName,
    }

    // Track different interaction types
    switch (eventType) {
      case 'focus':
        posthog.capture('form_field_focused', {
          ...fieldData,
          timestamp: new Date().toISOString(),
        })
        break

      case 'blur':
        posthog.capture('form_field_blurred', {
          ...fieldData,
          field_completed: !!value,
          timestamp: new Date().toISOString(),
        })
        break

      case 'change':
        // Debounce change events to avoid spam
        if (debounceTimersRef.current[fieldName]) {
          clearTimeout(debounceTimersRef.current[fieldName])
        }

        debounceTimersRef.current[fieldName] = setTimeout(() => {
          posthog.capture('form_field_changed', {
            ...fieldData,
            field_length: value?.length || 0,
            has_value: !!value,
            timestamp: new Date().toISOString(),
          })

          // Update stored form data
          formDataRef.current[fieldName] = value || ''
        }, 500) // Wait 500ms after user stops typing
        break
    }
  }

  const trackFormProgress = (completedFields: string[], totalFields: number) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    const progress = Math.round((completedFields.length / totalFields) * 100)

    posthog.capture('form_progress_updated', {
      form_name: formName,
      completed_fields: completedFields,
      total_fields: totalFields,
      progress_percentage: progress,
      timestamp: new Date().toISOString(),
    })
  }

  const trackFormAbandonment = (completedFields: string[], totalFields: number, timeSpent: number) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    posthog.capture('form_abandoned', {
      form_name: formName,
      completed_fields: completedFields,
      total_fields: totalFields,
      progress_percentage: Math.round((completedFields.length / totalFields) * 100),
      time_spent_seconds: Math.round(timeSpent / 1000),
      timestamp: new Date().toISOString(),
    })
  }

  return {
    trackFieldInteraction,
    trackFormProgress,
    trackFormAbandonment,
  }
}

/**
 * Specialized hook for tracking checkout form with progressive data capture
 * This identifies users early and tracks form completion in real-time
 *
 * IDENTIFICATION STRATEGY:
 * 1. User starts as anonymous (posthog.anonymous_id persisted in localStorage)
 * 2. When phone/email provided, we call posthog.alias() to link anonymous → identified
 * 3. This preserves ALL previous anonymous activity under the identified user
 * 4. User is tracked consistently even if they never provide phone (stays anonymous)
 */
export function useCheckoutFormTracking() {
  const formStartTime = useRef<number>(Date.now())
  const hasIdentified = useRef<boolean>(false)

  useEffect(() => {
    formStartTime.current = Date.now()

    // Check if user was already identified in a previous session
    try {
      const storedIdentity = localStorage.getItem('posthog_identified_user')
      if (storedIdentity) {
        hasIdentified.current = true
      }
    } catch (e) {
      console.error('Failed to check stored identity:', e)
    }

    return () => {
      // Track form abandonment on unmount if form wasn't submitted
      const timeSpent = Date.now() - formStartTime.current
      if (timeSpent > 3000) { // Only if spent more than 3 seconds
        // This will be tracked by the component when it unmounts
      }
    }
  }, [])

  /**
   * Track checkout form field changes and identify user progressively
   */
  const trackCheckoutField = (fieldName: keyof CheckoutFormData, value: string | undefined) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    const hasValue = !!value && value.length > 0

    // Track field completion with ACTUAL VALUES
    posthog.capture('checkout_field_completed', {
      field_name: fieldName,
      field_value: value || '', // Send actual value
      has_value: hasValue,
      field_length: value?.length || 0,
      timestamp: new Date().toISOString(),
    })

    // Progressive user identification strategy
    // Priority: phone > email (use whichever comes first)

    // Phone-based identification
    if (fieldName === 'phone' && value && value.length === 11 && !hasIdentified.current) {
      const anonymousId = posthog.get_distinct_id() // Get current anonymous ID
      const identifiedUserId = `customer_${value}`

      // Use alias() to link anonymous user to identified user
      // This preserves all previous anonymous activity
      posthog.alias(identifiedUserId, anonymousId)

      // Then identify with properties
      posthog.identify(identifiedUserId, {
        phone: value,
        user_type: 'customer',
        identified_at: new Date().toISOString(),
        identification_source: 'checkout_form_phone',
        was_anonymous: true,
        previous_anonymous_id: anonymousId,
      })

      hasIdentified.current = true

      // Store for persistence across sessions
      try {
        localStorage.setItem('posthog_identified_user', identifiedUserId)
        localStorage.setItem('posthog_user_phone', value)
      } catch (e) {
        console.error('Failed to store phone identification:', e)
      }

      // Track identification event
      posthog.capture('user_identified', {
        identification_method: 'phone',
        user_id: identifiedUserId,
        timestamp: new Date().toISOString(),
      })
    }

    // Email-based identification (fallback if no phone yet)
    if (fieldName === 'email' && value && value.includes('@') && !hasIdentified.current) {
      const anonymousId = posthog.get_distinct_id()
      const identifiedUserId = `customer_email_${value.split('@')[0]}_${Date.now()}`

      posthog.alias(identifiedUserId, anonymousId)

      posthog.identify(identifiedUserId, {
        email: value,
        user_type: 'customer',
        identified_at: new Date().toISOString(),
        identification_source: 'checkout_form_email',
        was_anonymous: true,
        previous_anonymous_id: anonymousId,
      })

      hasIdentified.current = true

      try {
        localStorage.setItem('posthog_identified_user', identifiedUserId)
        localStorage.setItem('posthog_user_email', value)
      } catch (e) {
        console.error('Failed to store email identification:', e)
      }

      posthog.capture('user_identified', {
        identification_method: 'email',
        user_id: identifiedUserId,
        timestamp: new Date().toISOString(),
      })
    }

    // Always update user properties with actual values (whether identified or anonymous)
    if (fieldName === 'name' && value) {
      posthog.people.set({ name: value })
      posthog.setPersonProperties({ name: value })
    }

    if (fieldName === 'phone' && value) {
      posthog.people.set({ phone: value })
      posthog.setPersonProperties({ phone: value })
    }

    if (fieldName === 'email' && value) {
      posthog.people.set({ email: value })
      posthog.setPersonProperties({ email: value })
    }

    if (fieldName === 'address' && value) {
      posthog.people.set({ address: value })
      posthog.setPersonProperties({ address: value })
    }

    if (fieldName === 'specialNote' && value) {
      posthog.people.set({ special_note: value })
      posthog.setPersonProperties({ special_note: value })
    }

    if (fieldName === 'deliveryType' && value) {
      posthog.capture('delivery_type_selected', {
        delivery_type: value,
        timestamp: new Date().toISOString(),
      })
      posthog.people.set({ preferred_delivery_type: value })
    }
  }

  /**
   * Track complete checkout form state (call this periodically or on significant changes)
   */
  const trackCheckoutFormState = (formData: CheckoutFormData) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    const completedFields = Object.entries(formData)
      .filter(([_, value]) => !!value && value.length > 0)
      .map(([key]) => key)

    const requiredFields = ['name', 'phone', 'address']
    const allRequiredCompleted = requiredFields.every(field =>
      formData[field as keyof CheckoutFormData]
    )

    posthog.capture('checkout_form_state', {
      // Include ACTUAL form data values
      form_data: formData,
      // Metadata
      completed_fields: completedFields,
      completed_count: completedFields.length,
      total_fields: Object.keys(formData).length,
      progress_percentage: Math.round((completedFields.length / Object.keys(formData).length) * 100),
      all_required_completed: allRequiredCompleted,
      time_spent_seconds: Math.round((Date.now() - formStartTime.current) / 1000),
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Track when user is ready to submit (all required fields completed)
   */
  const trackCheckoutReady = () => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    posthog.capture('checkout_ready_to_submit', {
      time_to_ready_seconds: Math.round((Date.now() - formStartTime.current) / 1000),
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Send complete form data as person properties
   * Call this when form is nearly complete or on submission
   */
  const updatePersonProfile = (formData: CheckoutFormData) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return

    const profileData: Record<string, unknown> = {}

    if (formData.name) profileData.name = formData.name
    if (formData.phone) profileData.phone = formData.phone
    if (formData.email) profileData.email = formData.email
    if (formData.address) profileData.address = formData.address
    if (formData.specialNote) profileData.special_note = formData.specialNote
    if (formData.deliveryType) profileData.preferred_delivery_type = formData.deliveryType

    // Update last form interaction
    profileData.last_checkout_attempt = new Date().toISOString()
    profileData.checkout_form_completion = Object.keys(profileData).length

    // Set all properties at once
    posthog.people.set(profileData)
    posthog.setPersonProperties(profileData)
  }

  return {
    trackCheckoutField,
    trackCheckoutFormState,
    trackCheckoutReady,
    updatePersonProfile,
    formStartTime: formStartTime.current,
  }
}
