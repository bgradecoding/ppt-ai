'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/server/db'; // Updated Prisma client import

// Interface for the expected input (excluding the file from FormData)
// interface UploadTemplateInput { // This might not be needed if all data comes from FormData
//   name: string;
//   description?: string;
// }

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'presentation_templates');
const ALLOWED_FILE_TYPES = ['application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB example limit

export async function uploadPresentationTemplate(formData: FormData) {
  console.log('uploadPresentationTemplate action started...');

  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null; // Optional

  // 1. Basic Form Data Validation
  if (!file) {
    console.error('Validation Error: No file uploaded.');
    return { success: false, error: 'No file uploaded.' };
  }
  if (!name || name.trim() === '') {
    console.error('Validation Error: Template name is required.');
    return { success: false, error: 'Template name is required.' };
  }

  // 2. File Validation (Type, Size, Extension)
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    console.error(`Validation Error: Invalid file type - ${file.type}. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`);
    return { success: false, error: 'Invalid file type. Only .pptx files are allowed.' };
  }
  const fileExtension = path.extname(file.name).toLowerCase();
  if (fileExtension !== '.pptx') {
    console.error(`Validation Error: Invalid file extension - ${fileExtension}. Must be .pptx.`);
    return { success: false, error: 'Invalid file extension. Only .pptx files are allowed.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    console.error(`Validation Error: File size (${file.size} bytes) exceeds limit of ${MAX_FILE_SIZE} bytes.`);
    return { success: false, error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` };
  }

  console.log(`Received file: ${file.name} (size: ${file.size} bytes, type: ${file.type})`);
  console.log(`Template name: ${name}`);
  if (description) {
    console.log(`Template description: ${description}`);
  }

  let storedFilePath = '';

  try {
    // 3. File Storage
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`Upload directory '${UPLOAD_DIR}' ensured/created.`);

    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`; // Sanitize and make unique
    storedFilePath = path.join(UPLOAD_DIR, uniqueFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(storedFilePath, buffer);
    console.log(`File successfully saved to: ${storedFilePath}`);

    // 4. Database Interaction
    console.log('Attempting to create PresentationTemplate record in database...');
    const newTemplateRecord = await prisma.presentationTemplate.create({
      data: {
        name: name,
        description: description,
        filename: file.name, // Original filename
        storedFile: storedFilePath, // Path to the saved file on the server
        // userId: '...' // Placeholder for user ID if authentication is integrated
      },
    });
    console.log('PresentationTemplate record created successfully:', newTemplateRecord);

    return { success: true, template: newTemplateRecord };

  } catch (error) {
    console.error('Error during template upload process:', error);

    // Attempt to clean up stored file if an error occurs after file saving
    if (storedFilePath) {
      try {
        await fs.unlink(storedFilePath);
        console.log(`Cleaned up stored file: ${storedFilePath}`);
      } catch (cleanupError) {
        console.error('Error cleaning up stored file:', cleanupError);
      }
    }
    
    if (error instanceof Error) {
        // Check for Prisma specific errors if necessary, or generic ones
        return { success: false, error: `Failed to upload template: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred during template upload.' };
  } finally {
    console.log('uploadPresentationTemplate action finished.');
  }
}
