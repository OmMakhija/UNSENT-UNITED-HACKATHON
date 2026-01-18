import requests
from config import SUPABASE_URL, SUPABASE_KEY

print("🔎 SUPABASE_URL =", SUPABASE_URL[:60])

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

class SupabaseREST:
    def select(self, table):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        print("➡️ SELECT URL:", url)

        res = requests.get(url, headers=HEADERS, timeout=10)
        print("⬅️ STATUS:", res.status_code)
        print("⬅️ BODY:", res.text[:300])

        res.raise_for_status()
        return res.json()

    def insert(self, table, payload):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        print("➡️ INSERT URL:", url)

        res = requests.post(url, headers=HEADERS, json=payload, timeout=10)
        print("⬅️ STATUS:", res.status_code)
        print("⬅️ BODY:", res.text[:300])

        res.raise_for_status()
        return res.json()

supabase = SupabaseREST()
