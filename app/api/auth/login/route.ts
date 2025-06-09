import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
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

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log activity
    await ActivityLogger.userLogin(user.id, user.email, ipAddress, userAgent);

    // Generate JWT
    const token = await signJWT({
      sub: user.id,
      email: user.email,
      type: 'user',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        type: 'user',
      },
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
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