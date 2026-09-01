import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    revalidatePath("/", "layout");
    return NextResponse.json({ message: "Successfully cleared Next.js cache for all paths!" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}
