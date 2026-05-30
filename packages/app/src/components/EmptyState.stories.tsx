import type { Meta, StoryObj } from '@storybook/react'
import EmptyState from '@/components/EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof EmptyState>

export const NoWorkers: Story = {
  args: {
    variant: 'no-workers',
  },
}

export const NoBookmarks: Story = {
  args: {
    variant: 'no-bookmarks',
  },
}

export const NoReviews: Story = {
  args: {
    variant: 'no-reviews',
  },
}

export const NoSearchResults: Story = {
  args: {
    variant: 'no-search-results',
  },
}

export const WithCustomCTA: Story = {
  args: {
    variant: 'no-workers',
    ctaHref: '/custom-path',
  },
}
