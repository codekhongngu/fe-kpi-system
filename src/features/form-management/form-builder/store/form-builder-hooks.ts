import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { type FormBuilderDispatch, type FormBuilderState } from './form-builder-store'

export const useFormBuilderDispatch = () => useDispatch<FormBuilderDispatch>()
export const useFormBuilderSelector: TypedUseSelectorHook<FormBuilderState> = useSelector
