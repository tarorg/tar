import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { fileUrl } = body

  if (!fileUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File URL is required',
    })
  }

  // Extract the key from the file URL
  const urlParts = new URL(fileUrl)
  const key = urlParts.pathname.slice(1) // Remove leading '/'

  console.log('Attempting to delete file:', key)

  if (!config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.bucketName) {
    console.error('Missing required R2 configuration')
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error',
    })
  }

  try {
    const s3Client = new S3Client({
      region: config.r2.region,
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    })

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    })

    const response = await s3Client.send(deleteCommand)
    console.log('Delete response:', response)

    return {
      success: true,
      message: 'File deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting file from R2:', error)
    return {
      success: false,
      message: 'Failed to delete file from R2',
      error: error instanceof Error ? error.message : String(error),
    }
  }
})
