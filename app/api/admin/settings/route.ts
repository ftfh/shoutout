import { NextRequest, NextResponse } from 'next/server';
import { db, siteSettings } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { siteSettingSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

// Get all site settings
async function getSiteSettings(request: AuthenticatedRequest) {
  try {
    const settings = await db
      .select({
        id: siteSettings.id,
        key: siteSettings.key,
        value: siteSettings.value,
        type: siteSettings.type,
        description: siteSettings.description,
        updatedAt: siteSettings.updatedAt,
      })
      .from(siteSettings)
      .orderBy(siteSettings.key);

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error: any) {
    console.error('Get site settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

// Create or update site setting
async function updateSiteSetting(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const adminId = request.user!.id;

    // Validate input
    const validatedData = siteSettingSchema.parse(body);

    // Check if setting exists
    const [existingSetting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, validatedData.key))
      .limit(1);

    let setting;
    if (existingSetting) {
      // Update existing setting
      [setting] = await db
        .update(siteSettings)
        .set({
          value: validatedData.value,
          type: validatedData.type,
          description: validatedData.description,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, validatedData.key))
        .returning();
    } else {
      // Create new setting
      [setting] = await db
        .insert(siteSettings)
        .values(validatedData)
        .returning();
    }

    // Log activity
    await ActivityLogger.adminAction(
      adminId,
      'SETTING_UPDATED',
      `Updated site setting: ${validatedData.key}`,
      { 
        ipAddress, 
        userAgent,
        settingKey: validatedData.key,
        oldValue: existingSetting?.value,
        newValue: validatedData.value,
      }
    );

    return NextResponse.json({
      success: true,
      setting,
      message: 'Setting updated successfully',
    });

  } catch (error: any) {
    console.error('Update site setting error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSiteSettings, ['admin']);
export const PUT = withAuth(updateSiteSetting, ['admin']);