import { NextRequest, NextResponse } from 'next/server';
import { db, shoutoutTypes } from '@/lib/db';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all shoutout types
    const types = await db
      .select({
        id: shoutoutTypes.id,
        name: shoutoutTypes.name,
        description: shoutoutTypes.description,
        createdAt: shoutoutTypes.createdAt,
      })
      .from(shoutoutTypes)
      .orderBy(shoutoutTypes.name);

    return NextResponse.json({
      success: true,
      shoutoutTypes: types,
    });

  } catch (error: any) {
    console.error('Get shoutout types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shoutout types' },
      { status: 500 }
    );
  }
}