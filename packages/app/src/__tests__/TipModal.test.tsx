import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TipModal from '@/components/TipModal'

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

const mockIsConnected = vi.fn()
vi.mock('@stellar/freighter-api', () => ({
  isConnected: (...args: any[]) => mockIsConnected(...args),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}))

// lucide-react stubs
vi.mock('lucide-react', () => ({
  X: () => <span />,
  Loader2: () => <span />,
  CheckCircle2: () => <span />,
  AlertCircle: () => <span />,
  ExternalLink: () => <span />,
}))

const defaultProps = {
  workerName: 'John Plumber',
  walletAddress: 'GABCDEF1234567890',
}

describe('TipModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the trigger button', () => {
    render(<TipModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /send tip/i })).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<TipModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /send tip/i }))
    expect(await screen.findByText('Send a Tip')).toBeInTheDocument()
  })

  it('shows worker wallet address in modal', async () => {
    const user = userEvent.setup()
    render(<TipModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /send tip/i }))
    expect(await screen.findByText('GABCDEF1234567890')).toBeInTheDocument()
  })

  it('Send Tip submit button is disabled when amount is empty', async () => {
    const user = userEvent.setup()
    render(<TipModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /send tip/i }))
    // The footer "Send Tip" submit button (inside the dialog)
    const submitBtn = await screen.findByRole('button', { name: /^send tip$/i })
    expect(submitBtn).toBeDisabled()
  })

  it('Send Tip submit button is enabled when valid amount is entered', async () => {
    const user = userEvent.setup()
    render(<TipModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /send tip/i }))
    await user.type(await screen.findByLabelText(/amount/i), '5')
    const submitBtn = screen.getByRole('button', { name: /^send tip$/i })
    expect(submitBtn).not.toBeDisabled()
  })

  it('shows Freighter not installed when wallet is not connected', async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false })
    const user = userEvent.setup()
    render(<TipModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /send tip/i }))
    await user.type(await screen.findByLabelText(/amount/i), '5')
    await user.click(screen.getByRole('button', { name: /^send tip$/i }))
    expect(await screen.findByText(/freighter not installed/i)).toBeInTheDocument()
  })
})
