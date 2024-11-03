import { createClient } from '@libsql/client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const client = createClient({
    url: config.turso.databaseUrl,
    authToken: config.turso.authToken,
  })

  try {
    // Ensure newStock is a number and sku is a string
    const newStock = Number(body.newStock)
    const sku = String(body.sku)

    if (isNaN(newStock)) {
      throw new Error('Invalid stock value')
    }

    const result = await client.execute({
      sql: 'UPDATE Instances SET qty = ? WHERE sku = ?',
      args: [newStock, sku],
    })

    if (result.rowsAffected === 0) {
      return { success: false, message: 'No product found with the given SKU' }
    }

    return { success: true, message: 'Stock updated successfully' }
  } catch (error: any) {
    console.error('Error updating stock:', error)
    return { 
      success: false, 
      message: 'Failed to update stock',
      error: error.message || 'Unknown error'
    }
  } finally {
    await client.close()
  }
})
