import QRCode from "qrcode";

type RouteProps = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { code } = await params;
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const targetUrl = `${baseUrl}/scan/${encodeURIComponent(code)}`;
  const qr = await QRCode.toBuffer(targetUrl, {
    width: 512,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return new Response(new Uint8Array(qr), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
