export async function verifyTurnstileToken(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY no está configurada");
  }

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteip) body.append("remoteip", remoteip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  return response.json();
}