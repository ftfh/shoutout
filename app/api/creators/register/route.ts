import { NextRequest, NextResponse } from 'next/server';
import { db, creators } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { creatorRegistrationSchema } from '@/lib/validation/schemas';
import { verifyTurnstile } from '@/lib/services/turnstile';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);

    // Validate input
    const validatedData = creatorRegistrationSchema.parse(body);

    // Verify Turnstile
    const turnstileValid = await verifyTurnstile(validatedData.turnstileToken, ipAddress);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Turnstile verification failed' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCreator = await db
      .select()
      .from(creators)
      .where(eq(creators.email, validatedData.email))
      .limit(1);

    if (existingCreator.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if display name already exists
    const existingDisplayName = await db
      .select()
      .from(creators)
      .where(eq(creators.displayName, validatedData.displayName))
      .limit(1);

    if (existingDisplayName.length > 0) {
      return NextResponse.json(
        { error: 'Display name already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create creator
    const [newCreator] = await db
      .insert(creators)
      .values({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        displayName: validatedData.displayName,
        email: validatedData.email,
        password: hashedPassword,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        country: validatedData.country,
      })
      .returning({ id: creators.id, email: creators.email, displayName: creators.displayName });

    // Log activity
    await ActivityLogger.creatorRegistration(newCreator.id, newCreator.email, ipAddress, userAgent);

    // Generate JWT
    const token = await signJWT({
      sub: newCreator.id,
      email: newCreator.email,
      type: 'creator',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newCreator.id,
        email: newCreator.email,
        displayName: newCreator.displayName,
        type: 'creator',
      },
    });

  } catch (error: any) {
    console.error('Creator registration error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}