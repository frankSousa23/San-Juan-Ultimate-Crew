import React from 'react'
import { useForm, UseFormOptions } from '../hooks/useForm'
import { Button } from './Button'
import { Input } from './Input'
import { Card } from './Card'

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'date' | 'time' | 'datetime-local'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
  rows?: number
  min?: number
  max?: number
  step?: number
}

interface FormProps extends Omit<UseFormOptions, 'onSubmit'> {
  fields: FormField[]
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  className?: string
  showSubmitButton?: boolean
  showCancelButton?: boolean
  submitButtonProps?: React.ComponentProps<typeof Button>
  cancelButtonProps?: React.ComponentProps<typeof Button>
}

export const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Enviar',
  cancelLabel = 'Cancelar',
  onCancel,
  className = '',
  showSubmitButton = true,
  showCancelButton = false,
  submitButtonProps = {},
  cancelButtonProps = {},
  ...formOptions
}) => {
  const {
    formState,
    isSubmitting,
    submitError,
    handleSubmit,
    getFieldProps,
    getFieldError,
    isFieldValid,
  } = useForm({
    ...formOptions,
    onSubmit,
  })

  const renderField = (field: FormField) => {
    const fieldProps = getFieldProps(field.name)
    const error = getFieldError(field.name)
    const isValid = isFieldValid(field.name)

    const commonProps = {
      ...fieldProps,
      placeholder: field.placeholder,
      required: field.required,
      className: `w-full ${error ? 'border-red-500' : isValid ? 'border-green-500' : ''}`,
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
            className={`${commonProps.className} resize-vertical`}
          />
        )

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Seleccionar...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
          />
        )

      default:
        return (
          <input
            {...commonProps}
            type={field.type}
          />
        )
    }
  }

  return (
    <Card className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {getFieldError(field.name) && (
              <p className="text-sm text-red-600">
                {getFieldError(field.name)}
              </p>
            )}
          </div>
        ))}

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {(showSubmitButton || showCancelButton) && (
          <div className="flex justify-end space-x-3 pt-4">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                {...cancelButtonProps}
              >
                {cancelLabel}
              </Button>
            )}
            
            {showSubmitButton && (
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                {...submitButtonProps}
              >
                {submitLabel}
              </Button>
            )}
          </div>
        )}
      </form>
    </Card>
  )
}

// Specialized form components
interface PlayerFormProps {
  onSubmit: (values: any) => void | Promise<void>
  initialValues?: Record<string, any>
  onCancel?: () => void
  submitLabel?: string
}

export const PlayerForm: React.FC<PlayerFormProps> = ({
  onSubmit,
  initialValues = {},
  onCancel,
  submitLabel = 'Guardar Jugador',
}) => {
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre completo del jugador',
      required: true,
    },
    {
      name: 'number',
      label: 'Número',
      type: 'number',
      placeholder: 'Número de camiseta',
      required: true,
      min: 1,
      max: 99,
    },
    {
      name: 'position',
      label: 'Posición',
      type: 'select',
      required: true,
      options: [
        { value: 'HANDLER', label: 'Handler' },
        { value: 'CUTTER', label: 'Cutter' },
        { value: 'HYBRID', label: 'Híbrido' },
      ],
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'ACTIVE', label: 'Activo' },
        { value: 'INJURED', label: 'Lesionado' },
        { value: 'INACTIVE', label: 'Inactivo' },
      ],
    },
    {
      name: 'heightCm',
      label: 'Altura (cm)',
      type: 'number',
      placeholder: 'Altura en centímetros',
      min: 100,
      max: 250,
    },
    {
      name: 'experience',
      label: 'Experiencia',
      type: 'text',
      placeholder: 'Años de experiencia',
    },
  ]

  const validation = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    number: {
      required: true,
      custom: (value: number) => {
        if (value < 1 || value > 99) {
          return 'El número debe estar entre 1 y 99'
        }
        return undefined
      },
    },
    position: {
      required: true,
    },
    status: {
      required: true,
    },
    heightCm: {
      custom: (value: number) => {
        if (value && (value < 100 || value > 250)) {
          return 'La altura debe estar entre 100 y 250 cm'
        }
        return undefined
      },
    },
  }

  return (
    <Form
      fields={fields}
      initialValues={initialValues}
      validation={validation}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      onCancel={onCancel}
      showCancelButton={!!onCancel}
    />
  )
}

interface EventFormProps {
  onSubmit: (values: any) => void | Promise<void>
  initialValues?: Record<string, any>
  onCancel?: () => void
  submitLabel?: string
}

export const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  initialValues = {},
  onCancel,
  submitLabel = 'Guardar Evento',
}) => {
  const fields: FormField[] = [
    {
      name: 'title',
      label: 'Título',
      type: 'text',
      placeholder: 'Título del evento',
      required: true,
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Descripción del evento',
      rows: 3,
    },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'TRAINING', label: 'Entrenamiento' },
        { value: 'TOURNAMENT', label: 'Torneo' },
        { value: 'SOCIAL', label: 'Social' },
        { value: 'WORKSHOP', label: 'Taller' },
      ],
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'UPCOMING', label: 'Próximo' },
        { value: 'ONGOING', label: 'En curso' },
        { value: 'COMPLETED', label: 'Completado' },
        { value: 'CANCELLED', label: 'Cancelado' },
      ],
    },
    {
      name: 'location',
      label: 'Ubicación',
      type: 'text',
      placeholder: 'Ubicación del evento',
    },
    {
      name: 'startsAt',
      label: 'Fecha y hora de inicio',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'endsAt',
      label: 'Fecha y hora de fin',
      type: 'datetime-local',
    },
  ]

  const validation = {
    title: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    type: {
      required: true,
    },
    status: {
      required: true,
    },
    startsAt: {
      required: true,
    },
  }

  return (
    <Form
      fields={fields}
      initialValues={initialValues}
      validation={validation}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      onCancel={onCancel}
      showCancelButton={!!onCancel}
    />
  )
}

interface TransactionFormProps {
  onSubmit: (values: any) => void | Promise<void>
  initialValues?: Record<string, any>
  onCancel?: () => void
  submitLabel?: string
  accounts?: Array<{ id: number; name: string }>
  categories?: Array<{ id: number; name: string; kind: string }>
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  initialValues = {},
  onCancel,
  submitLabel = 'Guardar Transacción',
  accounts = [],
  categories = [],
}) => {
  const fields: FormField[] = [
    {
      name: 'accountId',
      label: 'Cuenta',
      type: 'select',
      required: true,
      options: accounts.map(account => ({
        value: account.id,
        label: account.name,
      })),
    },
    {
      name: 'categoryId',
      label: 'Categoría',
      type: 'select',
      options: [
        { value: '', label: 'Sin categoría' },
        ...categories.map(category => ({
          value: category.id,
          label: category.name,
        })),
      ],
    },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'INCOME', label: 'Ingreso' },
        { value: 'EXPENSE', label: 'Gasto' },
        { value: 'TRANSFER', label: 'Transferencia' },
      ],
    },
    {
      name: 'amountCents',
      label: 'Monto (centavos)',
      type: 'number',
      placeholder: 'Monto en centavos',
      required: true,
      min: 1,
    },
    {
      name: 'occurredAt',
      label: 'Fecha',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Descripción de la transacción',
      rows: 2,
    },
  ]

  const validation = {
    accountId: {
      required: true,
    },
    type: {
      required: true,
    },
    amountCents: {
      required: true,
      custom: (value: number) => {
        if (value <= 0) {
          return 'El monto debe ser mayor a 0'
        }
        return undefined
      },
    },
    occurredAt: {
      required: true,
    },
  }

  return (
    <Form
      fields={fields}
      initialValues={initialValues}
      validation={validation}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      onCancel={onCancel}
      showCancelButton={!!onCancel}
    />
  )
}
