# backend/config.py
import os

SUPABASE_URL = os.environ.get("https://lsodktpfctcewhbhowzo.supabase.co")
SUPABASE_KEY = os.environ.get("sb_secret_dXk3VUPBQLr3V2NRGCC7vQ_pBcl4JjE")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase environment variables not set")
