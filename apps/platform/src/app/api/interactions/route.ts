import { NextResponse } from "next/server";

/**
 * Discord Interactions Endpoint URL.
 * Discord sends POST with type 1 (PING); we respond with type 1 (PONG).
 * Optional: extend to handle slash commands, buttons, etc.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type as number | undefined;

    if (type === 1) {
      return NextResponse.json({ type: 1 });
    }

    return NextResponse.json(
      { error: "Unsupported interaction type" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
