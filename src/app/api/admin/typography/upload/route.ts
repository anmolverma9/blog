import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const fileExtension = path.extname(originalName).toLowerCase();
    
    // Validate font file extension
    const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file type. Only TTF, OTF, WOFF, and WOFF2 fonts are allowed.' }, { status: 400 });
    }

    // Generate clean unique filename
    const sanitizedBase = path.basename(originalName, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const uniqueFilename = `${Date.now()}_${sanitizedBase}${fileExtension}`;

    // Ensure upload directory exists: public/uploads/fonts/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'fonts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);

    const relativePath = `/uploads/fonts/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      filename: uniqueFilename,
      url: relativePath,
      ext: fileExtension.slice(1) // e.g. "woff2"
    });
  } catch (err: any) {
    console.error('Admin POST font upload error:', err.message);
    return NextResponse.json({ error: 'Failed to upload font file' }, { status: 500 });
  }
}
