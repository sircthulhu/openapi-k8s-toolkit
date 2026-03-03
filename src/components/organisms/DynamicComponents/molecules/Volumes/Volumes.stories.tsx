import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Volumes } from './Volumes'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Volumes']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/Volumes',
  component: Volumes as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as `multiQueryData["req" + reqIndex]`, e.g. "0" -> req0)',
    },
    jsonPathToSpec: {
      control: 'text',
      description: 'data.jsonPathToSpec (jsonpath to pod spec containing containers and volumes)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown when root is missing/invalid)',
    },
    containerStyle: { control: 'object', description: 'data.containerStyle' },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into MultiQueryMockProvider',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      reqIndex: args.reqIndex,
      jsonPathToSpec: args.jsonPathToSpec,
      errorText: args.errorText,
      containerStyle: args.containerStyle,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <Volumes data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </Volumes>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Volumes',
            data,
          })}
          theme="vs-dark"
          options={{
            theme: 'vs-dark',
            readOnly: true,
          }}
        />
      </>
    )
  },

  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-volumes',
    reqIndex: '0',
    jsonPathToSpec: '.data.spec',
    errorText: 'No volume mounts found',
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        data: {
          spec: {
            volumes: [
              { name: 'config-volume', configMap: { name: 'app-config' } },
              { name: 'secret-volume', secret: { secretName: 'app-tls' } },
              { name: 'shared-data', emptyDir: {} },
              { name: 'log-volume', configMap: { name: 'log-config' } },
            ],
            containers: [
              {
                name: 'app',
                volumeMounts: [
                  { name: 'config-volume', mountPath: '/etc/config', subPath: '', readOnly: true },
                  { name: 'secret-volume', mountPath: '/etc/secrets', subPath: 'tls.crt', readOnly: true },
                ],
              },
              {
                name: 'sidecar',
                volumeMounts: [
                  { name: 'shared-data', mountPath: '/var/shared', subPath: '' },
                  { name: 'log-volume', mountPath: '/var/log/app', subPath: 'sidecar' },
                ],
              },
            ],
          },
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const MissingRoot: Story = {
  args: {
    ...Default.args,
    multiQueryData: {},
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const EmptyArray: Story = {
  args: {
    ...Default.args,
    multiQueryData: {
      req0: {
        data: {
          spec: {
            volumes: [],
            containers: [
              {
                name: 'app',
                volumeMounts: [],
              },
            ],
          },
        },
      },
    },
  },
}
