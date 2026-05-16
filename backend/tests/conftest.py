import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017/trustchain_test")
os.environ.setdefault("SQUAD_SECRET_KEY", "test_squad_secret_key")
os.environ.setdefault("SQUAD_PUBLIC_KEY", "test_squad_public_key")
os.environ.setdefault("SQUAD_MERCHANT_ID", "test_merchant_id")
