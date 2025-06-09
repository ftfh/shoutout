import { NextRequest, NextResponse } from 'next/server';
import { db, creators } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';
import { verifyTurnstile } from '@/lib/services/turnstile';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Verify Turnstile
    const turnstileValid = await verifyTurnstile(validatedData.turnstileToken, ipAddress);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Turnstile verification failed' },
        { status: 400 }
      );
    }

    // Find creator
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.email, validatedData.email))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, creator.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log activity
    await ActivityLogger.creatorLogin(creator.id, creator.email, ipAddress, userAgent);

    // Generate JWT
    const token = await signJWT({
      sub: creator.id,
      email: creator.email,
      type: 'creator',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: creator.id,
        email: creator.email,
        displayName: creator.displayName,
        firstName: creator.firstName,
        lastName: creator.lastName,
        type: 'creator',
      },
    });

  } catch (error: any) {
    console.error('Creator login error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}