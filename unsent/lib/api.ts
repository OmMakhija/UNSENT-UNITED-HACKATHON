const API_URL = "process.env.NEXT_PUBLIC_BACKEND_URL!;";

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


export const fetchStars = async () => {
  const res = await fetch(`${API_URL}/stars`);
  return res.json();
};