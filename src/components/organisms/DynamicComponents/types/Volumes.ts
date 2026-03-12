import { CSSProperties } from 'react'

export type TVolumesProps = {
  id: number | string
  reqIndex: string
  jsonPathToSpec: string
  jsonPathToPodName?: string
  errorText?: string
  containerStyle?: CSSProperties
}
