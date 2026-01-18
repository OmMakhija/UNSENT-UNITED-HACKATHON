import requests
from config import SUPABASE_URL, SUPABASE_KEY

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

class SupabaseREST:
    def select(self, table_query):
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_query}",
            headers=HEADERS,
            timeout=10
        )
        res.raise_for_status()
        return res.json()

    def insert(self, table, payload):
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=HEADERS,
            json=payload,
            timeout=10
        )
        res.raise_for_status()
        return res.json()

    def delete_older_than(self, table, iso_time):
        res = requests.delete(
            f"{SUPABASE_URL}/rest/v1/{table}?created_at=lt.{iso_time}",
            headers=HEADERS,
            timeout=10
        )
        res.raise_for_status()
        return True

supabase = SupabaseREST()
