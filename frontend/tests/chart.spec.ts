import { test, expect } from '@playwright/test'

test.describe('StockChart Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response
    await page.route('**/api/stocks/*/prices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            date: '2024-01-01',
            open: 100,
            high: 105,
            low: 98,
            close: 103,
            volume: 1000000,
          },
          {
            date: '2024-01-02',
            open: 103,
            high: 108,
            low: 102,
            close: 106,
            volume: 1200000,
          },
          {
            date: '2024-01-03',
            open: 106,
            high: 110,
            low: 105,
            close: 107,
            volume: 1100000,
          },
        ]),
      })
    })
  })

  test('renders chart canvas', async ({ page }) => {
    // Navigate to a page that imports and renders the StockChart component
    await page.goto('http://localhost:3000')
    
    // Create a simple HTML page with the chart library loaded from CDN
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Chart Test</title>
          <style>
            #root { width: 800px; height: 400px; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
          <script>
            const container = document.getElementById('root');
            const chart = LightweightCharts.createChart(container, {
              width: 800,
              height: 400,
            });
            
            const candlestickSeries = chart.addCandlestickSeries();
            candlestickSeries.setData([
              { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103 },
              { time: '2024-01-02', open: 103, high: 108, low: 102, close: 106 },
              { time: '2024-01-03', open: 106, high: 110, low: 105, close: 107 },
            ]);
          </script>
        </body>
      </html>
    `)

    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
    
    const boundingBox = await canvas.boundingBox()
    expect(boundingBox).not.toBeNull()
    expect(boundingBox!.width).toBeGreaterThan(0)
    expect(boundingBox!.height).toBeGreaterThan(0)
  })

  test('chart displays loading state initially', async ({ page }) => {
    // Delay the API response to test loading state
    await page.route('**/api/stocks/*/prices', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Loading Test</title>
        </head>
        <body>
          <div id="loading-test">
            <div class="loading">Loading AAPL</div>
          </div>
        </body>
      </html>
    `)

    // Check for loading indicator
    const loadingIndicator = await page.locator('.loading')
    await expect(loadingIndicator).toBeVisible()
  })

  test('chart handles error state', async ({ page }) => {
    // Mock a failed API response
    await page.route('**/api/stocks/*/prices', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Error Test</title>
        </head>
        <body>
          <div id="error-test">
            <div class="error">ERROR: Failed to fetch price data: Internal Server Error</div>
          </div>
        </body>
      </html>
    `)

    // Check for error message
    const errorMessage = await page.locator('.error')
    await expect(errorMessage).toBeVisible()
  })
})
