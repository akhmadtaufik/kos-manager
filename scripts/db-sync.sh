#!/usr/bin/env bash
# ==============================================================================
# KosManager Database Sync & Backup Manager
# ==============================================================================
# Script ini mengelola sinkronisasi dua arah, pencadangan otomatis (backup),
# serta pemulihan (restore) data antara PostgreSQL Docker dan Host.
# Kredensial dibaca secara dinamis dari .env (Best Practice).
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"

mkdir -p "${BACKUP_DIR}"

# --- Utility Color Functions ---
color_cyan()   { echo -e "\033[0;36m$*\033[0m"; }
color_green()  { echo -e "\033[0;32m$*\033[0m"; }
color_yellow() { echo -e "\033[0;33m$*\033[0m"; }
color_red()    { echo -e "\033[0;31m$*\033[0m"; }

# --- Load & Parse Environment Variables ---
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # Load key-value pairs safely from .env
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "${PROJECT_ROOT}/.env" | sed 's/\r$//')
  set +a
fi

# Function to parse postgres://[user[:password]@][host][:port][/dbname] URL
parse_db_url() {
  local url="$1"
  [ -z "$url" ] && return 1

  # Strip outer quotes
  url=$(echo "$url" | tr -d '"' | tr -d "'")

  # Remove protocol scheme
  local no_scheme="${url#*://}"

  # Extract user:pass if '@' is present
  if [[ "$no_scheme" == *"@"* ]]; then
    local userpass="${no_scheme%%@*}"
    local hostportdb="${no_scheme#*@}"
    
    if [[ "$userpass" == *":"* ]]; then
      PARSED_USER="${userpass%%:*}"
      PARSED_PASS="${userpass#*:}"
    else
      PARSED_USER="$userpass"
      PARSED_PASS=""
    fi
  else
    local hostportdb="$no_scheme"
    PARSED_USER=""
    PARSED_PASS=""
  fi

  local hostport="${hostportdb%%/*}"
  local dbandparams="${hostportdb#*/}"
  local dbname="${dbandparams%%\?*}"

  if [[ "$hostport" == *":"* ]]; then
    PARSED_HOST="${hostport%%:*}"
    PARSED_PORT="${hostport#*:}"
  else
    PARSED_HOST="$hostport"
    PARSED_PORT="5432"
  fi

  PARSED_DB="$dbname"

  # Normalize host.docker.internal to localhost for local host operations
  if [[ "$PARSED_HOST" == "host.docker.internal" ]]; then
    PARSED_HOST="localhost"
  fi
}

# Target URL for host connection (prefer DATABASE_MIGRATE_URL, fallback to DATABASE_URL)
SYNC_TARGET_URL="${DATABASE_MIGRATE_URL:-${DATABASE_URL:-}}"
if [ -n "$SYNC_TARGET_URL" ]; then
  parse_db_url "$SYNC_TARGET_URL"
fi

# --- Konfigurasi Container DB (dari .env dengan fallback standar) ---
DOCKER_CONTAINER="${DOCKER_DB_CONTAINER:-${DB_CONTAINER:-kosmanager-db}}"
DOCKER_DB_USER="${DB_USER:-postgres}"
DOCKER_DB_NAME="${DB_NAME:-kosmanager}"

# --- Konfigurasi Host DB (dari .env / parsing URL) ---
HOST_DB_HOST="${HOST_DB_HOST:-${PARSED_HOST:-localhost}}"
HOST_DB_PORT="${HOST_DB_PORT:-${PARSED_PORT:-5432}}"
HOST_DB_USER="${HOST_DB_USER:-${PARSED_USER:-postgres}}"
HOST_DB_PASS="${HOST_DB_PASS:-${PARSED_PASS:-}}"
HOST_DB_NAME="${HOST_DB_NAME:-${PARSED_DB:-kosmanager_db}}"

# --- Connection Verification Helpers ---

check_docker_db() {
  if ! docker ps --format '{{.Names}}' | grep -q "^${DOCKER_CONTAINER}$"; then
    color_red "❌ Container '${DOCKER_CONTAINER}' tidak sedang berjalan!"
    color_yellow "💡 Jalankan: docker compose up -d db"
    return 1
  fi
  return 0
}

check_host_db() {
  if [ -z "${HOST_DB_PASS}" ]; then
    color_yellow "⚠️  Password Host DB tidak ditemukan. Pastikan DATABASE_MIGRATE_URL atau DATABASE_URL terisi di .env"
  fi

  if ! PGPASSWORD="${HOST_DB_PASS}" pg_isready -h "${HOST_DB_HOST}" -p "${HOST_DB_PORT}" -U "${HOST_DB_USER}" >/dev/null 2>&1; then
    color_red "❌ Host PostgreSQL di ${HOST_DB_HOST}:${HOST_DB_PORT} (User: ${HOST_DB_USER}) tidak dapat dijangkau!"
    return 1
  fi
  return 0
}

# --- Actions ---

do_status() {
  color_cyan "========================================================"
  color_cyan "          KosManager Database Status Monitor            "
  color_cyan "========================================================"
  echo ""

  # 1. Container DB Status
  echo -n "🐳 Docker Container DB (${DOCKER_CONTAINER}): "
  if check_docker_db >/dev/null 2>&1; then
    local d_users d_props
    d_users=$(docker exec "${DOCKER_CONTAINER}" psql -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" -t -c "SELECT count(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    d_props=$(docker exec "${DOCKER_CONTAINER}" psql -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" -t -c "SELECT count(*) FROM properties;" 2>/dev/null | tr -d ' ' || echo "0")
    color_green "ONLINE"
    echo "   Database : ${DOCKER_DB_NAME}"
    echo "   Data     : ${d_users} Users | ${d_props} Properties"
  else
    color_red "OFFLINE"
  fi

  echo ""

  # 2. Host DB Status
  echo -n "🖥️  Host Native DB (${HOST_DB_HOST}:${HOST_DB_PORT}): "
  if check_host_db >/dev/null 2>&1; then
    local h_users h_props
    h_users=$(PGPASSWORD="${HOST_DB_PASS}" psql -h "${HOST_DB_HOST}" -p "${HOST_DB_PORT}" -U "${HOST_DB_USER}" -d "${HOST_DB_NAME}" -t -c "SELECT count(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    h_props=$(PGPASSWORD="${HOST_DB_PASS}" psql -h "${HOST_DB_HOST}" -p "${HOST_DB_PORT}" -U "${HOST_DB_USER}" -d "${HOST_DB_NAME}" -t -c "SELECT count(*) FROM properties;" 2>/dev/null | tr -d ' ' || echo "0")
    color_green "ONLINE"
    echo "   Database : ${HOST_DB_NAME}"
    echo "   Data     : ${h_users} Users | ${h_props} Properties"
  else
    color_red "OFFLINE"
  fi

  echo ""

  # 3. Backup Files List
  echo "📦 Backup Tersimpan di ${BACKUP_DIR}:"
  local count
  count=$(find "${BACKUP_DIR}" -maxdepth 1 -name "*.sql.gz" -o -name "*.sql" 2>/dev/null | wc -l || echo "0")
  if [ "${count}" -eq 0 ]; then
    echo "   (Belum ada file backup)"
  else
    ls -lh "${BACKUP_DIR}" | grep -E '\.sql' | awk '{print "   • " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
  fi
  echo ""
}

do_backup() {
  check_docker_db || exit 1

  local TIMESTAMP
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  local BACKUP_FILE="${BACKUP_DIR}/kosmanager_backup_${TIMESTAMP}.sql.gz"

  color_cyan "📦 Membuat snapshot backup dari Docker container (${DOCKER_CONTAINER})..."

  docker exec "${DOCKER_CONTAINER}" pg_dump -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

  local SIZE
  SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  color_green "✅ Backup BERHASIL dibuat:"
  echo "   📁 Lokasi : ${BACKUP_FILE}"
  echo "   📊 Ukuran : ${SIZE}"
}

do_sync_to_host() {
  check_docker_db || exit 1
  check_host_db || exit 1

  color_cyan "🔄 Memulai Sinkronisasi: [Docker Container] ──► [Host PostgreSQL]..."

  # 1. Buat backup host terlebih dahulu untuk keamanan
  local TIMESTAMP
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  local AUTO_BACKUP="${BACKUP_DIR}/pre_sync_host_${TIMESTAMP}.sql.gz"
  PGPASSWORD="${HOST_DB_PASS}" pg_dump -h "${HOST_DB_HOST}" -p "${HOST_DB_PORT}" -U "${HOST_DB_USER}" -d "${HOST_DB_NAME}" --clean --if-exists 2>/dev/null | gzip > "${AUTO_BACKUP}" || true

  # 2. Dump dari Docker dan pipe langsung ke Host
  docker exec "${DOCKER_CONTAINER}" pg_dump -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" --clean --if-exists | \
    PGPASSWORD="${HOST_DB_PASS}" psql -h "${HOST_DB_HOST}" -p "${HOST_DB_PORT}" -U "${HOST_DB_USER}" -d "${HOST_DB_NAME}" >/dev/null

  color_green "✅ Sinkronisasi SELESAI! Host DB (${HOST_DB_NAME}) kini 100% identik dengan Docker DB."
}

do_sync_to_docker() {
  check_docker_db || exit 1
  check_host_db || exit 1

  color_cyan "🔄 Memulai Sinkronisasi: [Host PostgreSQL] ──► [Docker Container]..."

  # Dump dari Host dan pipe langsung ke Docker (ke database utama)
  PGPASSWORD="${HOST_DB_PASS}" pg_dump -h "${HOST_DB_HOST}" -p "${HOST_DB_PORT}" -U "${HOST_DB_USER}" -d "${HOST_DB_NAME}" --clean --if-exists | \
    docker exec -i "${DOCKER_CONTAINER}" psql -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" >/dev/null

  color_green "✅ Sinkronisasi SELESAI! Docker DB (${DOCKER_DB_NAME}) kini 100% identik dengan Host DB."
}

do_restore() {
  local FILE="$1"
  if [ -z "${FILE}" ] || [ ! -f "${FILE}" ]; then
    color_red "❌ File backup tidak ditemukan: ${FILE}"
    echo "Penggunaan: $0 restore <path_ke_file.sql.gz>"
    exit 1
  fi

  check_docker_db || exit 1

  color_yellow "⚠️  PERINGATAN: Memulihkan database akan menimpa seluruh data saat ini di Docker container!"
  read -p "Lanjutkan? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    color_cyan "Operasi dibatalkan."
    exit 0
  fi

  color_cyan "📥 Memulihkan data dari ${FILE}..."
  if [[ "${FILE}" == *.gz ]]; then
    gunzip -c "${FILE}" | docker exec -i "${DOCKER_CONTAINER}" psql -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" >/dev/null
  else
    docker exec -i "${DOCKER_CONTAINER}" psql -U "${DOCKER_DB_USER}" -d "${DOCKER_DB_NAME}" < "${FILE}" >/dev/null
  fi

  color_green "✅ Pemulihan database BERHASIL!"
}

do_auto_backup() {
  do_backup >/dev/null 2>&1
  # Hapus file backup yang lebih tua dari 14 hari
  find "${BACKUP_DIR}" -name "kosmanager_backup_*.sql.gz" -type f -mtime +14 -delete 2>/dev/null || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto backup completed & old backups pruned."
}

do_cron_help() {
  color_cyan "========================================================"
  color_cyan "          Panduan Pemasangan Cron Backup Otomatis       "
  color_cyan "========================================================"
  echo ""
  echo "Untuk menjadwalkan backup otomatis setiap hari jam 02:00 pagi:"
  echo ""
  color_yellow "1. Buka crontab editor:"
  echo "   crontab -e"
  echo ""
  color_yellow "2. Tambahkan baris berikut di baris paling bawah:"
  echo "   0 2 * * * ${PROJECT_ROOT}/scripts/db-sync.sh auto-backup >> ${PROJECT_ROOT}/backups/cron.log 2>&1"
  echo ""
  color_green "Selesai! Database Anda akan di-backup setiap hari dan snapshot > 14 hari akan dihapus otomatis."
  echo ""
}

# --- Main Entrypoint ---
case "${1:-}" in
  status)
    do_status
    ;;
  backup)
    do_backup
    ;;
  sync-to-host|docker-to-host)
    do_sync_to_host
    ;;
  sync-to-docker|host-to-docker)
    do_sync_to_docker
    ;;
  restore)
    do_restore "$2"
    ;;
  auto-backup)
    do_auto_backup
    ;;
  cron)
    do_cron_help
    ;;
  *)
    color_cyan "========================================================"
    color_cyan "     KosManager Database Sync & Backup Utility CLI      "
    color_cyan "========================================================"
    echo ""
    echo "Penggunaan:"
    echo "  $0 status                : Cek status koneksi dan jumlah data (Docker & Host)"
    echo "  $0 backup                : Buat snapshot backup terkompresi (.sql.gz)"
    echo "  $0 sync-to-host          : Sinkronisasi data [Docker] ke [Host DB]"
    echo "  $0 sync-to-docker        : Sinkronisasi data [Host DB] ke [Docker]"
    echo "  $0 restore <file.sql.gz> : Restore database dari snapshot backup"
    echo "  $0 cron                  : Panduan instalasi cron job backup otomatis"
    echo ""
    exit 0
    ;;
esac
