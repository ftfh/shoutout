import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { userRegistrationSchema } from '@/lib/validation/schemas';
import { verifyTurnstile } from '@/lib/services/turnstile';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);

    // Validate input
    const validatedData = userRegistrationSchema.parse(body);

    // Verify Turnstile
    const turnstileValid = await verifyTurnstile(validatedData.turnstileToken, ipAddress);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Turnstile verification failed' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if display name already exists
    const existingDisplayName = await db
      .select()
      .from(users)
      .where(eq(users.displayName, validatedData.displayName))
      .limit(1);

    if (existingDisplayName.length > 0) {
      return NextResponse.json(
        { error: 'Display name already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        displayName: validatedData.displayName,
        email: validatedData.email,
        password: hashedPassword,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        country: validatedData.country,
      })
      .returning({ id: users.id, email: users.email, displayName: users.displayName });

    // Log activity
    await ActivityLogger.userRegistration(newUser.id, newUser.email, ipAddress, userAgent);

    // Generate JWT
    const token = await signJWT({
      sub: newUser.id,
      email: newUser.email,
      type: 'user',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        type: 'user',
      },
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
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