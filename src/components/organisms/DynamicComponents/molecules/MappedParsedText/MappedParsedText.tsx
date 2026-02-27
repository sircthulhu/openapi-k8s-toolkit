/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'

export const MappedParsedText: FC<{ data: TDynamicComponentsAppTypeMap['MappedParsedText'] }> = ({ data }) => {
  const { value, valueMap, style } = data

  const { data: multiQueryData, isLoading, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, item, index) => {
    acc[index.toString()] = item
    return acc
  }, {})

  const parsedValue = parseAll({ text: value, replaceValues, multiQueryData })
  const renderedValue = Object.prototype.hasOwnProperty.call(valueMap, parsedValue)
    ? valueMap[parsedValue]
    : parsedValue

  return <span style={style}>{renderedValue}</span>
}
