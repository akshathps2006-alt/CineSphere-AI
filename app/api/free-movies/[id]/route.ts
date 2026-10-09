import { NextResponse } from "next/server";

export const revalidate = 3600;
const ALLOWED_LICENSES = [
  "creativecommons.org/publicdomain/mark/1.0",
  "creativecommons.org/licenses/publicdomain",
  "creativecommons.org/licenses/by/4.0",
  "creativecommons.org/licenses/by/3.0",
  "creativecommons.org/licenses/by/2.0",
  "creativecommons.org/licenses/by/1.0",
];
const allowed = (value: unknown) => typeof value === "string" && ALLOWED_LICENSES.some((license) => value.toLowerCase().includes(license));

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!/^[A-Za-z0-9._-]{1,180}$/.test(id)) return NextResponse.json({ error: "Invalid film identifier." }, { status: 400 });
  try {
    const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "Film metadata is unavailable." }, { status: 502 });
    const metadata = await response.json();
    const licenseUrl = metadata.metadata?.licenseurl || metadata.metadata?.license_url || "";
    if (!allowed(licenseUrl)) return NextResponse.json({ error: "This item does not have a supported public-domain or Creative Commons license, so playback is disabled." }, { status: 403 });
    const files = (metadata.files || []) as Array<{ name?: string; format?: string; source?: string; size?: string }>;
    const playable = files.filter((file) => file.name && !file.name.startsWith(".") && !file.name.includes("__ia_thumb") && !file.name.endsWith(".torrent") && /\.(mp4|m4v|webm|ogv)$/i.test(file.name) && (!file.source || file.source === "original"));
    playable.sort((a, b) => {
      const score = (file: typeof a) => (/\.mp4$/i.test(file.name || "") ? 100 : /\.webm$/i.test(file.name || "") ? 70 : /\.m4v$/i.test(file.name || "") ? 60 : 40) + (/h\.264|mpeg4|512kb|256kb/i.test(file.name || "") ? 5 : 0);
      return score(b) - score(a);
    });
    const file = playable[0];
    if (!file?.name) return NextResponse.json({ error: "No directly playable video file was found for this film." }, { status: 404 });
    const streamUrl = `https://archive.org/download/${encodeURIComponent(id)}/${file.name.split("/").map(encodeURIComponent).join("/")}`;
    return NextResponse.json({ id, title: metadata.metadata?.title || id, licenseUrl, streamUrl, sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`, fileName: file.name }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not load the movie file. Please try again later." }, { status: 502 });
  }
}
