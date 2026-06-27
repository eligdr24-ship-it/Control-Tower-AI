import { useState, useCallback } from 'react'
import type { PageId } from '@/types'

export function useNavigation(initialPage: PageId = 'dashboard') {
  const [currentPage, setCurrentPage] = useState<PageId>(initialPage)

  const navigate = useCallback((page: PageId) => {
    setCurrentPage(page)
    // Scroll content area to top on page change
    const contentEl = document.getElementById('main-content')
    if (contentEl) contentEl.scrollTop = 0
  }, [])

  return { currentPage, navigate }
}
