import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

interface Props { title: string; iconName: string; description: string }

export function PlaceholderPage({ title, iconName, description }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title={title} subtitle="Coming in the next phase" />
      <div className="flex-1 flex items-center justify-center p-10">
        <EmptyState
          iconName={iconName}
          title={title}
          description={description}
          action={<Button icon="ti-external-link">Learn more</Button>}
        />
      </div>
    </div>
  )
}
