import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getStorageService } from '@/lib/services/storage';
import { v4 as uuidv4 } from 'uuid';

// Generate signed URL for avatar upload
async function POST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { contentType } = body;
    const userId = request.user!.id;

    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid content type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Unsupported image format. Please use JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    const storageService = await getStorageService();
    const fileKey = `avatars/${userId}/${uuidv4()}.${contentType.split('/')[1]}`;

    // Generate signed upload URL
    const uploadUrl = await storageService.getSignedUploadUrl(
      fileKey,
      contentType,
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileKey,
      message: 'Upload URL generated successfully',
    });

  } catch (error: any) {
    console.error('Generate upload URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

export { withAuth(POST, ['user']) as POST };