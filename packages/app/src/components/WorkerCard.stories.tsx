import type { Meta, StoryObj } from '@storybook/react'
import WorkerCard from '@/components/WorkerCard'
import type { Worker } from '@/types'

const meta: Meta<typeof WorkerCard> = {
  title: 'Components/WorkerCard',
  component: WorkerCard,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof WorkerCard>

const mockWorker: Worker = {
  id: '1',
  name: 'John Smith',
  category: { id: '1', name: 'Plumber', slug: 'plumber' },
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  bio: 'Professional plumber with 10 years of experience. Specializing in residential and commercial plumbing.',
  location: 'San Francisco, CA',
  averageRating: 4.8,
  reviewCount: 24,
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockWorkerNoRating: Worker = {
  ...mockWorker,
  id: '2',
  name: 'Jane Doe',
  averageRating: null,
  reviewCount: 0,
}

const mockWorkerNoBio: Worker = {
  ...mockWorker,
  id: '3',
  name: 'Bob Johnson',
  bio: null,
}

export const Default: Story = {
  args: {
    worker: mockWorker,
  },
}

export const NoRating: Story = {
  args: {
    worker: mockWorkerNoRating,
  },
}

export const NoBio: Story = {
  args: {
    worker: mockWorkerNoBio,
  },
}

export const NoAvatar: Story = {
  args: {
    worker: {
      ...mockWorker,
      id: '4',
      avatar: null,
    },
  },
}

export const HighRating: Story = {
  args: {
    worker: {
      ...mockWorker,
      id: '5',
      averageRating: 5.0,
      reviewCount: 50,
    },
  },
}
