#!/bin/sh
# What Vercel runs instead of `next build`, because package.json has a
# vercel-build script. A production deploy migrates first, so code never goes
# live ahead of the tables it needs: if a migration fails, the build fails and
# the live version stays up. Previews share the same database, so they never
# migrate.
#
# A step that gets skipped without anyone noticing is how lesson checks broke
# on 2026-11-02, so anything unexpected stops the build here.
set -e

case "$VERCEL_ENV" in
  production)
    if [ -z "$DATABASE_MIGRATE_URL" ]; then
      echo "Set DATABASE_MIGRATE_URL in Vercel (owner connection, Production only). See db/README.md." >&2
      exit 1
    fi
    npm run db:migrate
    ;;
  preview | development)
    echo "Skipping migrations: $VERCEL_ENV deploy."
    ;;
  *)
    echo "VERCEL_ENV is '$VERCEL_ENV', so this can't tell whether to migrate." >&2
    exit 1
    ;;
esac

exec next build
