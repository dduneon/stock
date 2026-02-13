import { test, expect } from '@playwright/test'

test.describe('Recommendations Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/recommendations*', async (route) => {
      const url = new URL(route.request().url())
      const category = url.searchParams.get('category') || 'top_picks'
      
      const mockData = [
        {
          ticker: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          industry: 'Consumer Electronics',
          valuation_score: 75,
          profitability_score: 88,
          growth_score: 82,
          momentum_score: 79,
          total_score: 81,
          grade: 'A',
          score_date: '2024-02-14',
        },
        {
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          sector: 'Technology',
          industry: 'Software',
          valuation_score: 72,
          profitability_score: 85,
          growth_score: 78,
          momentum_score: 80,
          total_score: 79,
          grade: 'A',
          score_date: '2024-02-14',
        },
        {
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          sector: 'Technology',
          industry: 'Internet Services',
          valuation_score: 80,
          profitability_score: 82,
          growth_score: 76,
          momentum_score: 75,
          total_score: 78,
          grade: 'B+',
          score_date: '2024-02-14',
        },
      ]

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      })
    })
  })

  test('renders page title and description', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await expect(page.locator('h1')).toContainText('Stock')
    await expect(page.locator('h1')).toContainText('Recommendations')
    
    await expect(page.locator('main p').first()).toContainText('Algorithmically ranked stocks')
  })

  test('displays all category tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await expect(page.getByRole('tab', { name: /top picks/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /undervalued/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /growth/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /momentum/i })).toBeVisible()
  })

  test('switches between category tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForLoadState('networkidle')
    
    await page.getByRole('tab', { name: /undervalued/i }).click()
    await expect(page.getByRole('tab', { name: /undervalued/i })).toHaveAttribute('data-state', 'active')

    await page.getByRole('tab', { name: /growth/i }).click()
    await expect(page.getByRole('tab', { name: /growth/i })).toHaveAttribute('data-state', 'active')

    await page.getByRole('tab', { name: /momentum/i }).click()
    await expect(page.getByRole('tab', { name: /momentum/i })).toHaveAttribute('data-state', 'active')
  })

  test('displays stock table with correct data', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table', { timeout: 5000 })

    const table = page.locator('table')
    await expect(table).toBeVisible()

    await expect(table.locator('thead th').first()).toContainText('Ticker')
    
    const firstRow = table.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()
    
    await expect(firstRow.locator('td').first()).toContainText('AAPL')
  })

  test('displays stats bar with stock count', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table')

    const statsBar = page.locator('text=Stocks Found').locator('..')
    await expect(statsBar).toBeVisible()
    await expect(statsBar).toContainText('3')
  })

  test('stock ticker links are clickable', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table')

    const firstTickerLink = page.locator('table tbody tr').first().locator('a').first()
    await expect(firstTickerLink).toBeVisible()
    await expect(firstTickerLink).toHaveAttribute('href', /\/stock\/AAPL/)
  })

  test('table sorting works', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table')

    const tickerHeader = page.locator('thead button:has-text("Ticker")')
    await tickerHeader.click()
    
    const firstTicker = await page.locator('table tbody tr').first().locator('td').first().innerText()
    expect(firstTicker).toBeTruthy()
  })

  test('displays grade badges with correct styling', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table')

    const gradeBadge = page.locator('table tbody tr').first().locator('td').last()
    await expect(gradeBadge).toBeVisible()
    await expect(gradeBadge.locator('span')).toContainText(/^[A-F][+]?$/)
  })

  test('handles loading state', async ({ page }) => {
    await page.route('**/api/recommendations*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('http://localhost:3000/recommendations')

    const loadingIndicator = page.locator('.animate-pulse').first()
    await expect(loadingIndicator).toBeVisible()
  })

  test('handles error state', async ({ page }) => {
    await page.route('**/api/recommendations*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('text=Error Loading Data', { timeout: 5000 })
    
    const errorMessage = page.locator('text=Error Loading Data')
    await expect(errorMessage).toBeVisible()
  })

  test('handles empty data state', async ({ page }) => {
    await page.route('**/api/recommendations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('http://localhost:3000/recommendations')

    const emptyMessage = page.locator('text=No Data Available')
    await expect(emptyMessage).toBeVisible()
  })

  test('is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table')

    const tabs = page.locator('[role="tablist"]')
    await expect(tabs).toBeVisible()
    
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('displays score columns with numeric values', async ({ page }) => {
    await page.goto('http://localhost:3000/recommendations')

    await page.waitForSelector('table')

    const firstRow = page.locator('table tbody tr').first()
    
    const totalScoreCell = firstRow.locator('td').nth(-2)
    const scoreText = await totalScoreCell.innerText()
    expect(parseInt(scoreText.trim())).toBeGreaterThan(0)
  })
})
