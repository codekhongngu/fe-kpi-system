import { configureStore } from '@reduxjs/toolkit'
import { formBuilderReducer } from './form-builder-slice'

export function createFormBuilderStore() {
  return configureStore({
    reducer: {
      formBuilder: formBuilderReducer,
    },
  })
}

export type FormBuilderStore = ReturnType<typeof createFormBuilderStore>
export type FormBuilderState = ReturnType<FormBuilderStore['getState']>
export type FormBuilderDispatch = FormBuilderStore['dispatch']
