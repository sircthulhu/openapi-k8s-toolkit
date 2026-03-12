/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import React, { FC, Suspense, useMemo } from 'react'
import jp from 'jsonpath'
import { TAdditionalPrinterColumnsKeyTypeProps, TAdditionalPrinterColumnsUndefinedValues } from 'localTypes/richTable'
import { EnrichedTable } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'

const ellipsisStyle = {
  display: 'inline-block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  verticalAlign: 'bottom' as const,
}

const VOLUME_TYPE_LABELS: Record<string, string> = {
  awsElasticBlockStore: 'AwsElasticBlockStore',
  azureDisk: 'AzureDisk',
  azureFile: 'AzureFile',
  cephfs: 'Cephfs',
  cinder: 'Cinder',
  configMap: 'ConfigMap',
  csi: 'CSI',
  downwardAPI: 'DownwardAPI',
  emptyDir: 'EmptyDir',
  ephemeral: 'Ephemeral',
  fc: 'FC',
  flexVolume: 'FlexVolume',
  flocker: 'Flocker',
  gcePersistentDisk: 'GcePersistentDisk',
  gitRepo: 'GitRepo',
  glusterfs: 'Glusterfs',
  hostPath: 'HostPath',
  image: 'Image',
  iscsi: 'ISCSI',
  nfs: 'NFS',
  persistentVolumeClaim: 'PersistentVolumeClaim',
  photonPersistentDisk: 'PhotonPersistentDisk',
  portworxVolume: 'PortworxVolume',
  projected: 'Projected',
  quobyte: 'Quobyte',
  rbd: 'RBD',
  scaleIO: 'ScaleIO',
  secret: 'Secret',
  storageos: 'StorageOS',
  vsphereVolume: 'VsphereVolume',
}

type TVolumeTypeMeta = {
  typeResource: string
  typeKey: string
  typeName: string
}

const getVolumeDisplayName = (typeKey: string, volumeConfig: any, fallbackName: string): string => {
  switch (typeKey) {
    case 'configMap':
      return volumeConfig?.name || fallbackName
    case 'secret':
      return volumeConfig?.secretName || fallbackName
    case 'persistentVolumeClaim':
      return volumeConfig?.claimName || fallbackName
    case 'azureDisk':
      return volumeConfig?.diskName || fallbackName
    case 'csi':
      return volumeConfig?.driver || fallbackName
    case 'image':
      return volumeConfig?.reference || fallbackName
    case 'projected':
      return Array.isArray(volumeConfig?.sources) && volumeConfig.sources.length > 0
        ? `${volumeConfig.sources.length} sources`
        : fallbackName
    default:
      return (
        volumeConfig?.volumeID ||
        volumeConfig?.path ||
        volumeConfig?.targetWWNs?.[0] ||
        volumeConfig?.datasetName ||
        volumeConfig?.repository ||
        volumeConfig?.server ||
        volumeConfig?.name ||
        fallbackName
      )
  }
}

const getVolumeTypeMeta = (volumeName: string, vol: any): TVolumeTypeMeta => {
  if (!vol) return { typeResource: 'Volume', typeKey: 'volume', typeName: volumeName }

  const matchedType = Object.keys(VOLUME_TYPE_LABELS).find(typeKey => Boolean(vol[typeKey]))
  if (matchedType) {
    return {
      typeResource: VOLUME_TYPE_LABELS[matchedType],
      typeKey: matchedType,
      typeName: getVolumeDisplayName(matchedType, vol[matchedType], volumeName),
    }
  }

  return { typeResource: 'Volume', typeKey: 'volume', typeName: volumeName }
}

const getProjectedSourceMeta = (projectedSource: any, fallbackName: string): TVolumeTypeMeta => {
  if (!projectedSource || typeof projectedSource !== 'object') {
    return { typeResource: 'Projected', typeKey: 'projected', typeName: fallbackName }
  }

  const projectedTypeKey = Object.keys(projectedSource).find(typeKey =>
    ['configMap', 'secret', 'downwardAPI', 'serviceAccountToken', 'clusterTrustBundle'].includes(typeKey),
  )

  if (!projectedTypeKey) {
    return { typeResource: 'Projected', typeKey: 'projected', typeName: fallbackName }
  }

  const sourceConfig = projectedSource[projectedTypeKey]

  if (projectedTypeKey === 'configMap') {
    return {
      typeResource: 'ConfigMap',
      typeKey: 'configMap',
      typeName: sourceConfig?.name || fallbackName,
    }
  }

  if (projectedTypeKey === 'secret') {
    return {
      typeResource: 'Secret',
      typeKey: 'secret',
      typeName: sourceConfig?.name || fallbackName,
    }
  }

  if (projectedTypeKey === 'downwardAPI') {
    return {
      typeResource: 'DownwardAPI',
      typeKey: 'downwardAPI',
      typeName: sourceConfig?.items?.[0]?.path || fallbackName,
    }
  }

  if (projectedTypeKey === 'serviceAccountToken') {
    return {
      typeResource: 'ServiceAccountToken',
      typeKey: 'serviceAccountToken',
      typeName: sourceConfig?.path || fallbackName,
    }
  }

  return {
    typeResource: 'ClusterTrustBundle',
    typeKey: 'clusterTrustBundle',
    typeName: sourceConfig?.path || sourceConfig?.name || fallbackName,
  }
}

const getVolumeTypeMetas = (volumeName: string, volumesMap: Record<string, any>): TVolumeTypeMeta[] => {
  const vol = volumesMap[volumeName]
  if (!vol) return [getVolumeTypeMeta(volumeName, vol)]

  if (Array.isArray(vol?.projected?.sources) && vol.projected.sources.length > 0) {
    return vol.projected.sources.map((source: any) => getProjectedSourceMeta(source, volumeName))
  }

  return [getVolumeTypeMeta(volumeName, vol)]
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

const undefinedValues: TAdditionalPrinterColumnsUndefinedValues = [
  { key: 'name', value: '-' },
  { key: 'mountPath', value: '-' },
  { key: 'subPath', value: '-' },
  { key: 'typeName', value: '-' },
  { key: 'access', value: '-' },
  { key: 'containerName', value: '-' },
]

const withUndefinedFallback = <T,>(value: T | null | undefined, fallback = '-'): T | string =>
  value === undefined || value === null || value === '' ? fallback : value

const customColumns: TAdditionalPrinterColumnsKeyTypeProps = {
  mountPath: {
    type: 'factory',
    customProps: {
      disableEventBubbling: true,
      items: [
        {
          type: 'parsedText',
          data: {
            id: 'mountPath-text',
            text: "{reqsJsonPath[0]['.mountPath']['-']}",
            tooltip: "{reqsJsonPath[0]['.mountPath']['-']}",
            style: ellipsisStyle,
          },
        },
      ],
    },
  },
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
              type: 'VisibilityContainer',
              data: {
                id: 'typeName-link-visible',
                value: "{reqsJsonPath[0]['.typeKey']['-']}",
                criteria: 'equals',
                valueToCompare: ['configMap', 'secret'],
              },
              children: [
                {
                  type: 'VisibilityContainer',
                  data: {
                    id: 'typeName-configmap-link-visible',
                    value: "{reqsJsonPath[0]['.typeKey']['-']}",
                    criteria: 'equals',
                    valueToCompare: ['configMap'],
                  },
                  children: [
                    {
                      type: 'antdLink',
                      data: {
                        href: "/openapi-ui/{2}/{3}/factory/configmap-details/v1/configmaps/{reqsJsonPath[0]['.typeName']['-']}",
                        id: 'typeName-link',
                        text: "{reqsJsonPath[0]['.typeName']['-']}",
                        title: "{reqsJsonPath[0]['.typeName']['-']}",
                        style: ellipsisStyle,
                      },
                    },
                  ],
                },
                {
                  type: 'VisibilityContainer',
                  data: {
                    id: 'typeName-secret-link-visible',
                    value: "{reqsJsonPath[0]['.typeKey']['-']}",
                    criteria: 'equals',
                    valueToCompare: ['secret'],
                  },
                  children: [
                    {
                      type: 'antdLink',
                      data: {
                        href: "/openapi-ui/{2}/{3}/factory/secret-details/v1/secrets/{reqsJsonPath[0]['.typeName']['-']}",
                        id: 'typeName-secret-link',
                        text: "{reqsJsonPath[0]['.typeName']['-']}",
                        title: "{reqsJsonPath[0]['.typeName']['-']}",
                        style: ellipsisStyle,
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'VisibilityContainer',
              data: {
                id: 'typeName-text-visible',
                value: "{reqsJsonPath[0]['.typeKey']['-']}",
                criteria: 'notEquals',
                valueToCompare: ['configMap', 'secret'],
              },
              children: [
                {
                  type: 'parsedText',
                  data: {
                    id: 'typeName-text',
                    text: "{reqsJsonPath[0]['.typeName']['-']}",
                    tooltip: "{reqsJsonPath[0]['.typeName']['-']}",
                    style: ellipsisStyle,
                  },
                },
              ],
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
              type: 'antdLink',
              data: {
                href: "/openapi-ui/{2}/{3}/factory/container-details/v1/containers/{reqsJsonPath[0]['.podName']['-']}/{reqsJsonPath[0]['.containerName']['-']}",
                id: 'container-link',
                text: "{reqsJsonPath[0]['.containerName']['-']}",
                title: "{reqsJsonPath[0]['.containerName']['-']}",
                style: ellipsisStyle,
              },
            },
          ],
        },
      ],
    },
  },
}

export const Volumes: FC<{ data: TDynamicComponentsAppTypeMap['Volumes']; children?: any }> = ({ data, children }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, reqIndex, jsonPathToSpec, jsonPathToPodName, errorText, containerStyle } = data
  const theme = useTheme()

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()

  const dataSource = useMemo(() => {
    if (isMultiQueryLoading || isMultiQueryErrors || !multiQueryData) return []

    const jsonRoot = multiQueryData[`req${reqIndex}`] as any
    if (jsonRoot === undefined) return []

    const specResult = jp.query(jsonRoot || {}, `$${jsonPathToSpec}`)
    const spec: any = specResult?.[0]
    if (!spec) return []
    const namespace = jsonRoot?.metadata?.namespace || spec?.metadata?.namespace || ''
    const podNameFromPath = jsonPathToPodName ? jp.query(jsonRoot || {}, `$${jsonPathToPodName}`)?.[0] : undefined
    const podName = podNameFromPath || jsonRoot?.metadata?.name || spec?.metadata?.name || '-'

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
      return mounts.flatMap((mount: any, mIdx: number) =>
        getVolumeTypeMetas(mount.name, volumesMap).map((typeMeta: TVolumeTypeMeta, typeIdx: number) => ({
          ...typeMeta,
          ...mount,
          name: withUndefinedFallback(mount.name),
          mountPath: withUndefinedFallback(mount.mountPath),
          subPath: withUndefinedFallback(mount.subPath),
          typeName: withUndefinedFallback(typeMeta.typeName),
          containerName: withUndefinedFallback(container.name || `container-${cIdx}`),
          podName,
          namespace,
          access: withUndefinedFallback(mount.readOnly ? 'RO' : 'RW'),
          key: `${cIdx}-${mIdx}-${typeIdx}`,
        })),
      )
    })
  }, [multiQueryData, isMultiQueryLoading, isMultiQueryErrors, reqIndex, jsonPathToSpec, jsonPathToPodName])

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
    // console.log(`Volumes: ${id}: No root for json path`)
    return <div style={containerStyle}>{errorText}</div>
  }

  return (
    <div style={containerStyle}>
      <Suspense fallback={<div>Loading...</div>}>
        <EnrichedTable
          theme={theme}
          columns={columns}
          dataSource={dataSource}
          additionalPrinterColumnsUndefinedValues={undefinedValues}
          additionalPrinterColumnsKeyTypeProps={customColumns}
          withoutControls
          tableProps={{ disablePagination: true }}
        />
      </Suspense>
      {children}
    </div>
  )
}
