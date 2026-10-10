import { NextRequest, NextResponse } from "next/server";
import { getDrivingMiles } from "@/lib/distance/google";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const origin = typeof body?.origin === "string" ? body.origin.trim() : "";
  const destination = typeof body?.destination === "string" ? body.destination.trim() : "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "Both a pickup and destination address are required." }, { status: 400 });
  }

  const result = await getDrivingMiles(origin, destination);
  if ("error" in result) {
    return NextResponse.json(result, { status: 422 });
  }
  return NextResponse.json(result);
}
