/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { EnrichedTable } from './EnrichedTable'

jest.mock('components/molecules', () => ({
  EnrichedTableProvider: () => <div data-testid="enriched-provider" />,
}))

jest.mock('hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({ isPending: false, data: { status: { allowed: true } } })),
}))

jest.mock('hooks/useDirectUnknownResource', () => ({
  useDirectUnknownResource: jest.fn(() => ({ data: undefined, isLoading: false, error: undefined })),
}))

jest.mock('hooks/useK8sSmartResource', () => ({
  useK8sSmartResource: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(() => ({ data: {}, isLoading: false, isError: false, errors: [] })),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/partsOfUrlContext', () => ({
  usePartsOfUrl: jest.fn(() => ({ partsOfUrl: [] })),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/themeContext', () => ({
  useTheme: jest.fn(() => 'light'),
}))

const mockUseK8sSmartResource = useK8sSmartResource as unknown as jest.Mock

describe('Dynamic EnrichedTable error rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows socket error payload and does not fall through to table rendering', () => {
    mockUseK8sSmartResource.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: 'Access denied (403)',
    })

    render(
      <MemoryRouter>
        <EnrichedTable
          data={
            {
              id: 'pods-table',
              cluster: 'default',
              k8sResourceToFetch: { apiVersion: 'v1', plural: 'pods' },
              pathToItems: '.items',
            } as any
          }
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Access denied \(403\)/)).toBeInTheDocument()
    expect(screen.queryByTestId('enriched-provider')).not.toBeInTheDocument()
    expect(screen.queryByText(/No data/i)).not.toBeInTheDocument()
  })
})
