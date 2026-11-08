#!/bin/sh
set -eu

python <<'PY'
import os

import psycopg

conn = psycopg.connect(
    dbname=os.environ["DB_NAME"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    host=os.environ["DB_HOST"],
    port=os.environ.get("DB_PORT", "5432"),
    sslmode="verify-full",
    sslrootcert=os.environ["DB_SSLROOTCERT"],
    connect_timeout=20,
)
conn.autocommit = True
with conn.cursor() as cur:
    cur.execute("CREATE EXTENSION IF NOT EXISTS postgis")
conn.close()
PY

python manage.py migrate --noinput
python manage.py seed_demo
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
