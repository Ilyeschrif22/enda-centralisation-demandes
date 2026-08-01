from groq import Groq
from app.config import settings

PROMPT_TEMPLATE = """
You are a transliteration engine.

TASK:
Convert the Arabic name into French spelling.

RULES:
- Output ONLY the final name
- No explanation
- No extra words
- No sentences
- No punctuation
- One line only

INPUT: {name}
"""


def call_groq_api(name: str) -> str:
    client = Groq(api_key=settings.GROQ_API_KEY)

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(name=name)}],
        temperature=0,
        max_completion_tokens=50,
    )

    return completion.choices[0].message.content.strip()
