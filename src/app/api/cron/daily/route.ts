
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(){
  // Fan out to alerts runner with simulate=false
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/alerts/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ simulate: false }) });
  } catch (e) {
    // best-effort; platform might block self-calls
  }
  return NextResponse.json({ ok: true });
}
