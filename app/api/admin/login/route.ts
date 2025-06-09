import { NextRequest, NextResponse } from 'next/server';
import { db, admins } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { adminLoginSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, count } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);

    // Validate input
    const validatedData = adminLoginSchema.parse(body);

    // Check if this is the first admin login
    const [adminCount] = await db
      .select({ count: count() })
      .from(admins);

    if (adminCount.count === 0) {
      // Create first admin account
      const hashedPassword = await hashPassword(validatedData.password);
      
      const [newAdmin] = await db
        .insert(admins)
        .values({
          email: validatedData.email,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
        })
        .returning({ id: admins.id, email: admins.email });

      // Log activity
      await ActivityLogger.adminAction(
        newAdmin.id,
        'ADMIN_ACCOUNT_CREATED',
        'First admin account created',
        { ipAddress, userAgent }
      );

      // Generate JWT
      const token = await signJWT({
        sub: newAdmin.id,
        email: newAdmin.email,
        type: 'admin',
      });

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          firstName: 'Admin',
          lastName: 'User',
          type: 'admin',
        },
        message: 'Admin account created successfully',
      });
    }

    // Find existing admin
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, validatedData.email))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, admin.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log activity
    await ActivityLogger.adminAction(
      admin.id,
      'LOGIN',
      `Admin logged in: ${admin.email}`,
      { ipAddress, userAgent }
    );

    // Generate JWT
    const token = await signJWT({
      sub: admin.id,
      email: admin.email,
      type: 'admin',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        type: 'admin',
      },
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    
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