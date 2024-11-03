import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { readFiles } from 'h3-formidable'
import fs from 'fs/promises'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    const { files } = await readFiles(event, {
      includeFields: true,
    })

    const file = files.file?.[0]

    if (!file) {
      throw new Error('No file uploaded')
    }

    const s3Client = new S3Client({
      region: config.r2.region,
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    })

    const fileExtension = file.originalFilename?.split('.').pop() || ''
    const key = `${randomUUID()}.${fileExtension}`

    const fileContent = await fs.readFile(file.filepath)

    const putObjectCommand = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype,
    })

    await s3Client.send(putObjectCommand)

    // Ensure the URL is correctly formatted with https://
    const fileUrl = `https://${config.r2.publicCustomDomain}/${key}`

    return {
      success: true,
      fileUrl: fileUrl,
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : String(error),
    }
  }
})
