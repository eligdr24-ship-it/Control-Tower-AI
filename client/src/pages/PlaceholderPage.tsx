import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import styles from './PlaceholderPage.module.css'

interface PlaceholderPageProps {
  title: string
  iconName: string
  description: string
}

export function PlaceholderPage({ title, iconName, description }: PlaceholderPageProps) {
  return (
    <div className={styles.page}>
      <TopBar
        title={title}
        subtitle="Coming in the next sprint"
        actions={
          <Button variant="primary" icon="ti-plus">
            Get started
          </Button>
        }
      />
      <div className={styles.content}>
        <EmptyState
          iconName={iconName}
          title={title}
          description={description}
          action={
            <Button icon="ti-external-link">
              Learn more
            </Button>
          }
        />
      </div>
    </div>
  )
}
