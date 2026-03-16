import React from 'react'
import { render, screen } from '@testing-library/react'
import { AntdResult } from './AntdResult'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/partsOfUrlContext', () => ({
  usePartsOfUrl: jest.fn(),
}))

const mockUseMultiQuery = useMultiQuery as unknown as jest.Mock
const mockUsePartsOfUrl = usePartsOfUrl as unknown as jest.Mock

const defaultPartsOfUrl = { partsOfUrl: ['openapi-ui', 'default', 'practice'] }

beforeEach(() => {
  jest.clearAllMocks()
  mockUsePartsOfUrl.mockReturnValue(defaultPartsOfUrl)
})

// ── Loading state ──────────────────────────────────────────────

describe('loading state', () => {
  it('renders nothing while loading', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: true, isError: false, errors: [] })

    const { container } = render(
      <AntdResult data={{ id: 'test', reqIndex: 0 }}>
        <div data-testid="child" />
      </AntdResult>,
    )

    expect(container.innerHTML).toBe('')
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })
})

// ── Manual mode (no reqIndex) ──────────────────────────────────

describe('manual mode (no reqIndex)', () => {
  it('renders Result with static status, title, subTitle', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: false, isError: false, errors: [] })

    render(<AntdResult data={{ id: 'manual', status: '403', title: 'Access Denied', subTitle: 'No permission' }} />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('No permission')).toBeInTheDocument()
  })

  it('renders children inside Result in manual mode', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: false, isError: false, errors: [] })

    render(
      <AntdResult data={{ id: 'manual-children', status: 'info', title: 'Info' }}>
        <div data-testid="manual-child">Extra content</div>
      </AntdResult>,
    )

    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByTestId('manual-child')).toBeInTheDocument()
  })

  it('supports template syntax in title and subTitle', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { metadata: { name: 'my-pod' } } },
      isLoading: false,
      isError: false,
      errors: [],
    })

    render(
      <AntdResult
        data={{
          id: 'templates',
          status: 'warning',
          title: 'Namespace: {2}',
          subTitle: 'Cluster: {1}',
        }}
      />,
    )

    expect(screen.getByText('Namespace: practice')).toBeInTheDocument()
    expect(screen.getByText('Cluster: default')).toBeInTheDocument()
  })
})

// ── Auto-detect mode (reqIndex provided) ───────────────────────

describe('auto-detect mode (reqIndex)', () => {
  it('renders children when request succeeded and data exists', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [{ metadata: { name: 'nginx' } }] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'ok', reqIndex: 0 }}>
        <div data-testid="page-content">Pod details here</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('renders null when no error and no children', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [{ metadata: { name: 'nginx' } }] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    const { container } = render(<AntdResult data={{ id: 'no-children', reqIndex: 0 }} />)

    expect(container.innerHTML).toBe('')
  })

  it('renders error Result when HTTP error exists', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: [{ response: { status: 403, statusText: 'Forbidden' }, message: 'Request failed' }],
    })

    render(
      <AntdResult data={{ id: 'http-error', reqIndex: 0 }}>
        <div data-testid="should-not-render" />
      </AntdResult>,
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('uses error message when statusText is empty', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: [{ response: { status: 500 }, message: 'Internal Server Error' }],
    })

    render(<AntdResult data={{ id: 'error-msg', reqIndex: 0 }} />)

    // Ant Design's 500 SVG also has a <title>Server Error</title>, so multiple matches
    expect(screen.getAllByText('Server Error').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
  })

  it('allows YAML to override status and title on HTTP error', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: [{ response: { status: 403 }, message: 'Forbidden' }],
    })

    render(<AntdResult data={{ id: 'override', reqIndex: 0, status: 'warning', title: 'Custom Title' }} />)

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })
})

// ── emptyAsNotFound ────────────────────────────────────────────

describe('emptyAsNotFound', () => {
  it('renders 404 Result when items is empty and flag is true', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'empty', reqIndex: 0, emptyAsNotFound: true }}>
        <div data-testid="should-not-render" />
      </AntdResult>,
    )

    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.getByText('The requested resource was not found')).toBeInTheDocument()
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('renders children when items is empty but flag is false', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'no-flag', reqIndex: 0, emptyAsNotFound: false }}>
        <div data-testid="page-content">Should render</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('renders children when items is empty but flag is not set', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'no-flag-default', reqIndex: 0 }}>
        <div data-testid="page-content">Should render</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('renders children when items has data and flag is true', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [{ metadata: { name: 'nginx' } }] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'has-data', reqIndex: 0, emptyAsNotFound: true }}>
        <div data-testid="page-content">Pod exists</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('allows YAML to override status and title on empty list', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })
    mockUsePartsOfUrl.mockReturnValue({ partsOfUrl: ['nginx-missing', 'default'] })

    render(
      <AntdResult
        data={{
          id: 'custom-empty',
          reqIndex: 0,
          emptyAsNotFound: true,
          status: 'warning',
          title: 'Pod {0} is not found',
          subTitle: 'Namespace: {1}',
        }}
      />,
    )

    expect(screen.getByText('Pod nginx-missing is not found')).toBeInTheDocument()
    expect(screen.getByText('Namespace: default')).toBeInTheDocument()
  })

  it('prefers HTTP error over emptyAsNotFound when both apply', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: true,
      errors: [{ response: { status: 403, statusText: 'Forbidden' }, message: 'Forbidden' }],
    })

    render(<AntdResult data={{ id: 'error-priority', reqIndex: 0, emptyAsNotFound: true }} />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
  })
})

// ── isEmptyK8sList edge cases ──────────────────────────────────

describe('isEmptyK8sList edge cases', () => {
  it.each([
    ['null reqData', { req0: null }],
    ['undefined reqData', {}],
    ['non-object reqData', { req0: 'string-value' }],
    ['reqData without items key', { req0: { metadata: {} } }],
    ['items is not an array', { req0: { items: 'not-array' } }],
    ['items is an object', { req0: { items: {} } }],
  ])('renders children when data is %s', (_label, data) => {
    mockUseMultiQuery.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'edge', reqIndex: 0, emptyAsNotFound: true }}>
        <div data-testid="page-content">Should render</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })
})
