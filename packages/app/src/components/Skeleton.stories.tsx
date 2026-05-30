import type { Meta, StoryObj } from '@storybook/react'
import Skeleton, { WorkerCardSkeleton, WorkerProfileSkeleton } from '@/components/Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: {
    className: 'h-12 w-12 rounded-md',
  },
}

export const Text: Story = {
  args: {
    className: 'h-4 w-full',
  },
}

export const Avatar: Story = {
  args: {
    className: 'h-12 w-12 rounded-full',
  },
}

export const WorkerCard: Story = {
  render: () => <WorkerCardSkeleton />,
}

export const WorkerProfile: Story = {
  render: () => <WorkerProfileSkeleton />,
}

export const Line: Story = {
  args: {
    className: 'h-2 w-full',
  },
}
