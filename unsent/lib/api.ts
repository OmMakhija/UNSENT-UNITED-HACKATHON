const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

export async function submitUnsent(text: string) {
  const res = await fetch(`${API_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error("Failed to submit unsent message");
  }

  return res.json();
}

export async function fetchStars() {
  const res = await fetch(`${API_URL}/stars`);

  if (!res.ok) {
    throw new Error(`Failed to fetch stars: ${res.status}`);
  }

  return res.json();
}
