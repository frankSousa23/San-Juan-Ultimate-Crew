import { useState, useCallback } from 'react'

export interface FormField {
  value: any
  error?: string
  touched: boolean
}

export interface FormState {
  [key: string]: FormField
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | undefined
}

export interface FormValidation {
  [key: string]: ValidationRule
}

export interface UseFormOptions {
  initialValues: Record<string, any>
  validation?: FormValidation
  onSubmit: (values: Record<string, any>) => void | Promise<void>
}

export function useForm({ initialValues, validation = {}, onSubmit }: UseFormOptions) {
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {}
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      }
    })
    return state
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateField = useCallback((name: string, value: any): string | undefined => {
    const rules = validation[name]
    if (!rules) return undefined

    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'Este campo es requerido'
    }

    if (value && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Debe tener al menos ${rules.minLength} caracteres`
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `Debe tener máximo ${rules.maxLength} caracteres`
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Formato inválido'
      }
    }

    if (rules.custom) {
      return rules.custom(value)
    }

    return undefined
  }, [validation])

  const validateForm = useCallback((): boolean => {
    let isValid = true
    const newFormState = { ...formState }

    Object.keys(formState).forEach(key => {
      const error = validateField(key, formState[key].value)
      if (error) {
        newFormState[key] = {
          ...newFormState[key],
          error,
          touched: true,
        }
        isValid = false
      } else {
        newFormState[key] = {
          ...newFormState[key],
          error: undefined,
        }
      }
    })

    setFormState(newFormState)
    return isValid
  }, [formState, validateField])

  const setFieldValue = useCallback((name: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: prev[name].touched ? validateField(name, value) : undefined,
      },
    }))
  }, [validateField])

  const setFieldTouched = useCallback((name: string, touched: boolean = true) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
        error: touched ? validateField(name, prev[name].value) : undefined,
      },
    }))
  }, [validateField])

  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }))
  }, [])

  const resetForm = useCallback(() => {
    const state: FormState = {}
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      }
    })
    setFormState(state)
    setSubmitError(null)
  }, [initialValues])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Mark all fields as touched
    const newFormState = { ...formState }
    Object.keys(newFormState).forEach(key => {
      newFormState[key] = {
        ...newFormState[key],
        touched: true,
      }
    })
    setFormState(newFormState)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const values = Object.keys(formState).reduce((acc, key) => {
        acc[key] = formState[key].value
        return acc
      }, {} as Record<string, any>)

      await onSubmit(values)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar el formulario'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [formState, validateForm, onSubmit])

  const getFieldProps = useCallback((name: string) => {
    const field = formState[name]
    if (!field) {
      throw new Error(`Field "${name}" not found in form state`)
    }

    return {
      value: field.value,
      error: field.error,
      touched: field.touched,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFieldValue(name, e.target.value)
      },
      onBlur: () => setFieldTouched(name),
    }
  }, [formState, setFieldValue, setFieldTouched])

  const getFieldError = useCallback((name: string) => {
    const field = formState[name]
    return field?.touched ? field.error : undefined
  }, [formState])

  const isFieldValid = useCallback((name: string) => {
    const field = formState[name]
    return field?.touched ? !field.error : true
  }, [formState])

  const isFormValid = useCallback(() => {
    return Object.values(formState).every(field => !field.error)
  }, [formState])

  const getFormValues = useCallback(() => {
    return Object.keys(formState).reduce((acc, key) => {
      acc[key] = formState[key].value
      return acc
    }, {} as Record<string, any>)
  }, [formState])

  return {
    formState,
    isSubmitting,
    submitError,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    handleSubmit,
    getFieldProps,
    getFieldError,
    isFieldValid,
    isFormValid,
    getFormValues,
    validateForm,
  }
}
