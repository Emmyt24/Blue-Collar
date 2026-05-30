import type { Meta, StoryObj } from '@storybook/react'
import Toast from '@/components/Toast'

const meta: Meta<typeof Toast> = {
  title: 'Design System/Toast',
  component: Toast,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof Toast>

export const Success: Story = {
  args: {
    toasts: [
      {
        id: 1,
        message: 'Worker added successfully!',
        type: 'success',
      },
    ],
    dismiss: () => {},
  },
}

export const Error: Story = {
  args: {
    toasts: [
      {
        id: 1,
        message: 'Failed to add worker. Please try again.',
        type: 'error',
      },
    ],
    dismiss: () => {},
  },
}

export const Multiple: Story = {
  args: {
    toasts: [
      {
        id: 1,
        message: 'Worker added successfully!',
        type: 'success',
      },
      {
        id: 2,
        message: 'Profile updated.',
        type: 'success',
      },
      {
        id: 3,
        message: 'Failed to load reviews.',
        type: 'error',
      },
    ],
    dismiss: () => {},
  },
}
