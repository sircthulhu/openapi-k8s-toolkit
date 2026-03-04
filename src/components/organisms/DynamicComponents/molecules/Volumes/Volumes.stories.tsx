import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['Volumes']
type TArgs = TInner

const VolumesDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>Volumes</strong> builds table rows from mounted container volumes and renders them through the shared
      <code> EnrichedTable </code>.
    </p>
    <p style={{ marginBottom: 8 }}>
      It depends on runtime app providers (<code>useMultiQuery</code>, theme context, and lazy table wiring), so this
      Storybook entry is <strong>docs-only</strong> and does not render the real component.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use controls to edit factory <code>data</code> and copy the YAML snippet into your dynamic layout config.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/Volumes',
  component: VolumesDocsOnly,
  argTypes: {
    id: { control: 'text', description: 'data.id (unique identifier in your schema)' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as multiQueryData["req" + reqIndex])',
    },
    jsonPathToSpec: {
      control: 'text',
      description: 'data.jsonPathToSpec (jsonpath to object containing .containers and .volumes)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown when req root is missing)',
    },
    containerStyle: {
      control: 'object',
      description: 'Optional: container style applied to the outer wrapper div',
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
        <VolumesDocsOnly />
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
    docs: {
      description: {
        component:
          'Docs-only story for the **DynamicComponents Volumes** factory. ' +
          'The real component relies on runtime providers and lazy EnrichedTable rendering, so it is not rendered live here. ' +
          'Use controls to tune `data` and copy generated YAML into your factory definitions.',
      },
    },
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
  },
}
