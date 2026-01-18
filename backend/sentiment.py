from textblob import TextBlob   # ✅ ADD THIS

VALID_EMOTIONS = [
    "grief",
    "regret",
    "love",
    "gratitude",
    "anger",
    "hope"
]

def detect_emotion(text):
    polarity = TextBlob(text).sentiment.polarity

    if polarity < -0.6:
        emotion = "grief"
    elif polarity < -0.2:
        emotion = "regret"
    elif polarity < 0.2:
        emotion = "hope"
    elif polarity < 0.5:
        emotion = "gratitude"
    else:
        emotion = "love"

    return emotion, polarity
