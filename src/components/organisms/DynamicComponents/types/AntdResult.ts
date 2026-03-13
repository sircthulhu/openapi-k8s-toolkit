import { CSSProperties } from 'react'

export type TAntdResultProps = {
  id: number | string
  status?: 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500' | 403 | 404 | 500
  title?: string
  subTitle?: string
  style?: CSSProperties
}
