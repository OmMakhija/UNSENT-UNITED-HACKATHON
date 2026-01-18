import uuid
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from supabase_client import supabase

SIMILARITY_THRESHOLD = 0.4


def create_thread(emotion):
    thread_id = str(uuid.uuid4())
    supabase.table("threads").insert({
        "id": thread_id,
        "emotion": emotion
    }).execute()
    return thread_id


def assign_thread(text, emotion):
    # Fetch active threads of the same emotion
    threads = supabase.table("threads") \
        .select("id") \
        .eq("emotion", emotion) \
        .eq("is_active", True) \
        .execute().data

    if not threads:
        return create_thread(emotion)

    thread_texts = []
    thread_map = []

    for t in threads:
        rows = supabase.table("thread_messages") \
            .select("message_id, unsent_messages(text)") \
            .eq("thread_id", t["id"]) \
            .execute().data

        for r in rows:
            if r.get("unsent_messages"):
                thread_texts.append(r["unsent_messages"]["text"])
                thread_map.append(t["id"])

    if not thread_texts:
        return create_thread(emotion)

    vectorizer = TfidfVectorizer(stop_words="english")
    vectors = vectorizer.fit_transform([text] + thread_texts)
    scores = cosine_similarity(vectors[0:1], vectors[1:])[0]

    best_score = max(scores)
    best_index = scores.tolist().index(best_score)

    if best_score >= SIMILARITY_THRESHOLD:
        return thread_map[best_index]

    return create_thread(emotion)
