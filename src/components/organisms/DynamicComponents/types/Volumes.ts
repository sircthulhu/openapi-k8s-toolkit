import { CSSProperties } from 'react'

export type TVolumesProps = {
  id: number | string
  reqIndex: string
  jsonPathToSpec: string
  errorText?: string
  containerStyle?: CSSProperties
}
