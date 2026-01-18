const API_URL = "http://localhost:5000";
import { getClientId } from "@/lib/clientId";

export async function submitUnsent(text: string) {
  const res = await fetch("http://localhost:5000/submit", {
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
  if (!res.ok) throw new Error("Failed to fetch stars");
  return res.json();
}
