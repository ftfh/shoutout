import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getStorageService } from '@/lib/services/storage';
import { v4 as uuidv4 } from 'uuid';

// Generate signed URL for file upload (delivery files)
async function POST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { contentType, purpose } = body;
    const creatorId = request.user!.id;

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    // Validate file types based on purpose
    let allowedTypes: string[] = [];
    let folder = '';

    if (purpose === 'avatar') {
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      folder = 'avatars';
    } else if (purpose === 'delivery') {
      allowedTypes = [
        'video/mp4', 'video/quicktime', 'video/x-msvideo',
        'audio/mpeg', 'audio/wav', 'audio/mp4',
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain'
      ];
      folder = 'deliveries';
    } else {
      return NextResponse.json(
        { error: 'Invalid upload purpose' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Unsupported file format' },
        { status: 400 }
      );
    }

    const storageService = await getStorageService();
    const fileExtension = contentType.split('/')[1];
    const fileKey = `${folder}/${creatorId}/${uuidv4()}.${fileExtension}`;

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

export { withAuth(POST, ['creator']) as POST };