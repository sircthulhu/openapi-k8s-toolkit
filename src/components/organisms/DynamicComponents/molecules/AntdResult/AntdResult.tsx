/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Result } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'

export const AntdResult: FC<{
  data: TDynamicComponentsAppTypeMap['antdResult']
  children?: any
}> = ({ data, children }) => {
  const { data: multiQueryData, isLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isLoading) {
    return null
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const parsedTitle = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : undefined

  const parsedSubTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : undefined

  return (
    <Result status={data.status} title={parsedTitle} subTitle={parsedSubTitle} style={data.style}>
      {children}
    </Result>
  )
}
