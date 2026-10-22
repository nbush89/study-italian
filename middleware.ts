import { NextResponse } from "next/server";

/**
 * Login removed: the app is open to anyone with the URL.
 * This file now does nothing and can be deleted.
 * The matcher points at a path that never exists, so it never runs.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/__middleware-disabled"],
};
