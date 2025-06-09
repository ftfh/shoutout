import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    type: 'user' | 'creator' | 'admin';
    email: string;
  };
}

export async function authenticateToken(request: NextRequest): Promise<{
  success: boolean;
  user?: { id: string; type: 'user' | 'creator' | 'admin'; email: string };
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const payload = await verifyJWT(token);
    return {
      success: true,
      user: {
        id: payload.sub as string,
        type: payload.type as 'user' | 'creator' | 'admin',
        email: payload.email as string,
      },
    };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}

export function requireAuth(allowedRoles?: ('user' | 'creator' | 'admin')[]) {
  return async (request: NextRequest) => {
    const auth = await authenticateToken(request);
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (allowedRoles && !allowedRoles.includes(auth.user.type)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return null; // Continue to the handler
  };
}

export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: ('user' | 'creator' | 'admin')[]
) {
  return async (request: NextRequest) => {
    const authCheck = await requireAuth(allowedRoles)(request);
    if (authCheck) return authCheck;

    const auth = await authenticateToken(request);
    (request as AuthenticatedRequest).user = auth.user;

    return handler(request as AuthenticatedRequest);
  };
}