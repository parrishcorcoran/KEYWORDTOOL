import os
from dotenv import load_dotenv

load_dotenv()

DATAFORSEO_LOGIN = os.getenv("DATAFORSEO_LOGIN", "")
DATAFORSEO_PASSWORD = os.getenv("DATAFORSEO_PASSWORD", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
PORT = int(os.getenv("PORT", "8000"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./signal_vault.db")
APP_PASSWORD = os.getenv("APP_PASSWORD", "signalvault2026")

NICHES = {
    "human-design": {
        "id": "human-design",
        "name": "Human Design",
        "seed_keywords": [
            "human design", "bodygraph", "human design chart", "human design type",
            "gates", "profile", "authority", "channels", "centers", "generator",
            "projector", "manifestor", "reflector", "manifesting generator"
        ],
        "subreddits": ["humandesign", "Human_Design"],
        "competitors": ["mybodygraph.com", "jovianarchive.com", "geneticmatrix.com"],
        "gumroad_terms": ["human design"],
        "etsy_terms": ["human design chart", "human design reading", "human design print"],
        "appstore_terms": ["human design", "bodygraph"],
    },
    "astrology": {
        "id": "astrology",
        "name": "Astrology",
        "seed_keywords": [
            "birth chart", "natal chart", "astrology chart", "synastry chart",
            "transit chart", "moon sign", "rising sign", "astrology compatibility",
            "composite chart"
        ],
        "subreddits": ["astrology", "AskAstrologers", "astrologyreadings"],
        "competitors": ["costarastrology.com", "chaninicholas.com", "cafeastrology.com", "astro.com"],
        "gumroad_terms": ["astrology", "birth chart", "natal chart", "horoscope"],
        "etsy_terms": ["astrology", "birth chart", "natal chart", "horoscope"],
        "appstore_terms": ["astrology", "birth chart", "natal chart", "horoscope"],
    },
    "gene-keys": {
        "id": "gene-keys",
        "name": "Gene Keys",
        "seed_keywords": [
            "gene keys", "gene keys profile", "gene keys chart", "golden path",
            "sequences", "richard rudd", "activation", "contemplation", "shadow"
        ],
        "subreddits": ["genekeys"],
        "competitors": ["genekeys.com"],
        "gumroad_terms": ["gene keys"],
        "etsy_terms": ["gene keys"],
        "appstore_terms": ["gene keys"],
    },
    "polyvagal": {
        "id": "polyvagal",
        "name": "Polyvagal / Nervous System",
        "seed_keywords": [
            "polyvagal theory", "nervous system regulation", "vagus nerve",
            "nervous system reset", "somatic healing", "window of tolerance",
            "dysregulation", "vagal tone", "dorsal vagal", "ventral vagal"
        ],
        "subreddits": ["polyvagaltheory", "SomaticExperiencing", "CPTSD"],
        "competitors": ["justinlmft.com"],
        "gumroad_terms": ["polyvagal", "nervous system", "somatic", "vagus nerve"],
        "etsy_terms": ["polyvagal", "nervous system", "somatic", "vagus nerve"],
        "appstore_terms": ["polyvagal", "nervous system", "vagus nerve"],
    },
    "spiritual-wellness": {
        "id": "spiritual-wellness",
        "name": "Spiritual Wellness (Broad)",
        "seed_keywords": [
            "spiritual awakening", "chakra healing", "shadow work",
            "inner child healing", "spiritual self discovery", "energy healing",
            "manifestation journal"
        ],
        "subreddits": ["spirituality", "awakened", "energy_work", "shadowwork"],
        "competitors": ["insighttimer.com"],
        "gumroad_terms": ["spiritual", "shadow work", "chakra", "manifestation"],
        "etsy_terms": ["spiritual", "shadow work", "chakra", "manifestation"],
        "appstore_terms": ["spiritual", "shadow work", "chakra", "manifestation"],
    },
}
