import type { Meta, StoryObj } from '@storybook/react'
import { CategoryBadge, CategoryIcon } from '@/components/CategoryBadge'

const meta: Meta<typeof CategoryBadge> = {
  title: 'Components/CategoryBadge',
  component: CategoryBadge,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof CategoryBadge>

export const Plumber: Story = {
  args: {
    slug: 'plumber',
    size: 'md',
    showLabel: true,
  },
}

export const Electrician: Story = {
  args: {
    slug: 'electrician',
    size: 'md',
    showLabel: true,
  },
}

export const Carpenter: Story = {
  args: {
    slug: 'carpenter',
    size: 'md',
    showLabel: true,
  },
}

export const Small: Story = {
  args: {
    slug: 'plumber',
    size: 'sm',
    showLabel: true,
  },
}

export const Large: Story = {
  args: {
    slug: 'plumber',
    size: 'lg',
    showLabel: true,
  },
}

export const IconOnly: Story = {
  args: {
    slug: 'plumber',
    size: 'md',
    showLabel: false,
  },
}

export const AllCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {['plumber', 'electrician', 'carpenter', 'painter', 'welder', 'hvac', 'landscaper', 'mason', 'roofer', 'general'].map((slug) => (
        <CategoryBadge key={slug} slug={slug} size="md" showLabel={true} />
      ))}
    </div>
  ),
}

export const CategoryIconStory: Story = {
  render: () => (
    <div className="flex gap-4">
      <CategoryIcon slug="plumber" size={24} />
      <CategoryIcon slug="electrician" size={24} />
      <CategoryIcon slug="carpenter" size={24} />
    </div>
  ),
}
