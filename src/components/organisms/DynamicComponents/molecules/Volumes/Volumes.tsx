/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import React, { FC, Suspense, useMemo } from 'react'
import jp from 'jsonpath'
import { TAdditionalPrinterColumnsKeyTypeProps } from 'localTypes/richTable'
import { EnrichedTable } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'

const getVolumeTypeMeta = (
  volumeName: string,
  volumesMap: Record<string, any>,
): { typeResource: string; typeName: string } => {
  const vol = volumesMap[volumeName]
  if (!vol) return { typeResource: 'Volume', typeName: volumeName }
  if (vol.configMap) return { typeResource: 'ConfigMap', typeName: vol.configMap.name }
  if (vol.secret) return { typeResource: 'Secret', typeName: vol.secret.secretName }
  return { typeResource: 'Volume', typeName: volumeName }
}

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Mount Path', dataIndex: 'mountPath', key: 'mountPath' },
  { title: 'Sub Path', dataIndex: 'subPath', key: 'subPath' },
  { title: 'Type', dataIndex: 'typeName', key: 'typeName' },
  { title: 'Access', dataIndex: 'access', key: 'access' },
  { title: 'Utilized by', dataIndex: 'containerName', key: 'containerName' },
  // { title: 'Type', dataIndex: 'typeResource', key: 'typeResource' },
]

const customColumns: TAdditionalPrinterColumnsKeyTypeProps = {
  typeName: {
    type: 'factory',
    customProps: {
      disableEventBubbling: true,
      items: [
        {
          type: 'antdFlex',
          data: {
            align: 'center',
            direction: 'row',
            gap: 6,
            id: 'resource-badge-link-row',
          },
          children: [
            {
              type: 'ResourceBadge',
              data: {
                id: 'typeName-badge',
                value: "{reqsJsonPath[0]['.typeResource']['-']}",
              },
            },
            {
              type: 'parsedText',
              data: {
                id: 'typeName-text',
                text: `{reqsJsonPath[0]['.typeName']['-']}`,
              },
            },
          ],
        },
      ],
    },
  },
  containerName: {
    type: 'factory',
    customProps: {
      disableEventBubbling: true,
      items: [
        {
          type: 'antdFlex',
          data: {
            align: 'center',
            direction: 'row',
            gap: 6,
            id: 'resource-badge-link-row',
          },
          children: [
            {
              type: 'ResourceBadge',
              data: {
                id: 'typeName-badge',
                value: 'Container',
              },
            },
            {
              type: 'parsedText',
              data: {
                id: 'typeName-text',
                text: `{reqsJsonPath[0]['.containerName']['-']}`,
              },
            },
          ],
        },
      ],
    },
  },
}

export const Volumes: FC<{ data: TDynamicComponentsAppTypeMap['Volumes']; children?: any }> = ({ data, children }) => {
  const { id, reqIndex, jsonPathToSpec, errorText, containerStyle } = data
  const theme = useTheme()

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()

  const dataSource = useMemo(() => {
    if (isMultiQueryLoading || isMultiQueryErrors || !multiQueryData) return []

    const jsonRoot = multiQueryData[`req${reqIndex}`]
    if (jsonRoot === undefined) return []

    const specResult = jp.query(jsonRoot || {}, `$${jsonPathToSpec}`)
    const spec: any = specResult?.[0]
    if (!spec) return []

    const containers: any[] = Array.isArray(spec.containers) ? spec.containers : []
    const volumes: any[] = Array.isArray(spec.volumes) ? spec.volumes : []
    const volumesMap: Record<string, any> = Array.isArray(volumes)
      ? volumes.reduce((acc: Record<string, any>, v: any) => {
          if (v?.name) acc[v.name] = v
          return acc
        }, {})
      : {}

    return containers.flatMap((container: any, cIdx: number) => {
      const mounts: any[] = Array.isArray(container.volumeMounts) ? container.volumeMounts : []
      return mounts.map((mount: any, mIdx: number) => ({
        ...getVolumeTypeMeta(mount.name, volumesMap),
        ...mount,
        containerName: container.name || `container-${cIdx}`,
        access: mount.readOnly ? 'RO' : 'RW',
        key: `${cIdx}-${mIdx}`,
      }))
    })
  }, [multiQueryData, isMultiQueryLoading, isMultiQueryErrors, reqIndex, jsonPathToSpec])

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (isMultiQueryErrors) {
    return (
      <div>
        <h4>Errors:</h4>
        {/* eslint-disable-next-line react/no-array-index-key */}
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    console.log(`Volumes: ${id}: No root for json path`)
    return <div style={containerStyle}>{errorText}</div>
  }

  return (
    <div style={containerStyle}>
      <Suspense fallback={<div>Loading...</div>}>
        <EnrichedTable
          theme={theme}
          columns={columns}
          dataSource={dataSource}
          additionalPrinterColumnsKeyTypeProps={customColumns}
          withoutControls
          tableProps={{ disablePagination: true }}
        />
      </Suspense>
      {children}
    </div>
  )
}
