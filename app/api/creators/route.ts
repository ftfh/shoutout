import { NextRequest, NextResponse } from 'next/server';
import { db, creators, creatorShoutouts, shoutoutTypes } from '@/lib/db';
import { creatorSearchSchema } from '@/lib/validation/schemas';
import { eq, and, gte, lte, ilike, or, desc, asc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryData = {
      query: searchParams.get('query') || undefined,
      shoutoutType: searchParams.get('shoutoutType') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      maxDeliveryTime: searchParams.get('maxDeliveryTime') ? Number(searchParams.get('maxDeliveryTime')) : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const validatedQuery = creatorSearchSchema.parse(queryData);

    // Build where conditions
    const whereConditions = [
      eq(creatorShoutouts.isActive, true)
    ];

    // Search by creator name or display name
    if (validatedQuery.query) {
      whereConditions.push(
        or(
          ilike(creators.displayName, `%${validatedQuery.query}%`),
          ilike(creators.firstName, `%${validatedQuery.query}%`),
          ilike(creators.lastName, `%${validatedQuery.query}%`)
        )!
      );
    }

    // Filter by shoutout type
    if (validatedQuery.shoutoutType) {
      whereConditions.push(eq(creatorShoutouts.shoutoutTypeId, validatedQuery.shoutoutType));
    }

    // Filter by price range
    if (validatedQuery.minPrice !== undefined) {
      whereConditions.push(gte(creatorShoutouts.price, validatedQuery.minPrice.toString()));
    }
    if (validatedQuery.maxPrice !== undefined) {
      whereConditions.push(lte(creatorShoutouts.price, validatedQuery.maxPrice.toString()));
    }

    // Filter by delivery time
    if (validatedQuery.maxDeliveryTime !== undefined) {
      whereConditions.push(lte(creatorShoutouts.deliveryTime, validatedQuery.maxDeliveryTime));
    }

    // Build order by clause
    let orderBy;
    switch (validatedQuery.sortBy) {
      case 'price_asc':
        orderBy = asc(creatorShoutouts.price);
        break;
      case 'price_desc':
        orderBy = desc(creatorShoutouts.price);
        break;
      case 'delivery_time':
        orderBy = asc(creatorShoutouts.deliveryTime);
        break;
      case 'newest':
        orderBy = desc(creators.createdAt);
        break;
      default:
        orderBy = desc(creators.isSponsored); // Sponsored creators first
    }

    // Calculate offset
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get creators with their shoutouts
    const creatorsQuery = db
      .select({
        creator: {
          id: creators.id,
          firstName: creators.firstName,
          lastName: creators.lastName,
          displayName: creators.displayName,
          avatar: creators.avatar,
          bio: creators.bio,
          isVerified: creators.isVerified,
          isSponsored: creators.isSponsored,
          createdAt: creators.createdAt,
        },
        shoutout: {
          id: creatorShoutouts.id,
          title: creatorShoutouts.title,
          description: creatorShoutouts.description,
          price: creatorShoutouts.price,
          deliveryTime: creatorShoutouts.deliveryTime,
        },
        shoutoutType: {
          id: shoutoutTypes.id,
          name: shoutoutTypes.name,
          description: shoutoutTypes.description,
        },
      })
      .from(creators)
      .innerJoin(creatorShoutouts, eq(creators.id, creatorShoutouts.creatorId))
      .innerJoin(shoutoutTypes, eq(creatorShoutouts.shoutoutTypeId, shoutoutTypes.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(validatedQuery.limit)
      .offset(offset);

    const results = await creatorsQuery;

    // Group results by creator
    const creatorsMap = new Map();
    results.forEach((row) => {
      const creatorId = row.creator.id;
      if (!creatorsMap.has(creatorId)) {
        creatorsMap.set(creatorId, {
          ...row.creator,
          shoutouts: [],
        });
      }
      creatorsMap.get(creatorId).shoutouts.push({
        ...row.shoutout,
        shoutoutType: row.shoutoutType,
      });
    });

    const creatorsData = Array.from(creatorsMap.values());

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(creators)
      .innerJoin(creatorShoutouts, eq(creators.id, creatorShoutouts.creatorId))
      .innerJoin(shoutoutTypes, eq(creatorShoutouts.shoutoutTypeId, shoutoutTypes.id))
      .where(and(...whereConditions));

    const [{ count: totalCount }] = await totalQuery;

    const totalPages = Math.ceil(totalCount / validatedQuery.limit);

    return NextResponse.json({
      success: true,
      creators: creatorsData,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: totalCount,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1,
      },
    });

  } catch (error: any) {
    console.error('Search creators error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search creators' },
      { status: 500 }
    );
  }
}