import { createClient } from '@libsql/client'

export default defineEventHandler(async (event) => {
  console.log('Received request:', event.node.req.url);
  console.log('Request method:', event.node.req.method);
  console.log('Request headers:', event.node.req.headers);

  const config = useRuntimeConfig()
  console.log('Turso DB URL:', config.tursoDbUrl);
  console.log('Turso Auth Token:', config.tursoAuthToken ? 'Set' : 'Not set');

  const client = createClient({
    url: config.tursoDbUrl,
    authToken: config.tursoAuthToken,
  })

  try {
    const body = await readBody(event)
    console.log('Received body on server:')
    Object.entries(body).forEach(([key, value]) => {
      console.log(`${key}: ${value}`)
    })
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'instance', 'options', 'unit', 'storeid']
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    const result = await client.execute({
      sql: `INSERT INTO core (name, category, medias, instance, options, options1, options2, options3, options4, options5, notes, unit, storeid) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.name,
        body.category,
        body.medias || '',
        body.instance,
        parseInt(body.options), // Convert options to integer
        body.options1 || '',
        body.options2 || '',
        body.options3 || '',
        body.options4 || '',
        body.options5 || '',
        body.notes || '',
        body.unit,
        body.storeid
      ]
    })

    // Convert BigInt to a regular number or string
    const insertId = result.lastInsertRowid ? Number(result.lastInsertRowid) : null;

    return { success: true, message: 'Product saved successfully', id: insertId }
  } catch (error: unknown) {
    console.error('Error saving product:', error)
    if (error instanceof Error) {
      return { success: false, message: 'Failed to save product', error: error.message }
    } else {
      return { success: false, message: 'Failed to save product', error: 'Unknown error' }
    }
  } finally {
    await client.close()
  }
})
