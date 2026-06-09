#!/usr/bin/env python3
"""
Import agents từ CSV export lên Supabase.
Yêu cầu: pip install pandas psycopg2-binary

Cách lấy DATABASE_URL:
1. Vào Supabase Dashboard > Project Settings > Database
2. Copy "Connection string" (URI tab) hoặc dùng Direct connection
Ví dụ: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

Lưu ý: File CSV export này dùng agent_code làm identifier (tương đương staff_id trong app).
Cột id là UUID trong DB, sẽ được giữ nguyên nếu có.
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

# ============================
# CONFIG
# ============================
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres')
CSV_FILE = 'docs/Test/agents_export_20260608.csv'
BATCH_SIZE = 500

# Các cột trong DB table public.agents (theo thứ tự schema hiện tại)
# Lưu ý: 'staff_id' được map từ CSV 'agent_code'
DB_COLUMNS = [
    'id', 'staff_id', 'agent_code', 'full_name', 'email', 'phone', 'rank_name',
    'contract_signing_date', 'status', 'register_date', 'agent_start_date',
    'end_date', 'deactivation_reason', 'business_email', 'id_card_number',
    'date_of_birth', 'id_card_issue_date', 'id_card_issue_place',
    'permanent_address', 'place_of_origin', 'gender', 'tax_code', 'bank_name',
    'bank_account_number', 'bank_branch_name', 'active_area',
    'real_estate_experience', 'broker_licence_number',
    'broker_licence_expiry_date', 'success_seminar_date', 'source'
]

# Map CSV column -> DB column
CSV_TO_DB_MAP = {
    'id': 'id',
    'agent_code': 'staff_id',   # App convention: agent_code = staff_id
    'full_name': 'full_name',
    'email': 'email',
    'phone': 'phone',
    'rank_name': 'rank_name',
    'contract_signing_date': 'contract_signing_date',
    'register_date': 'register_date',
    'agent_start_date': 'agent_start_date',
    'end_date': 'end_date',
    'deactivation_reason': 'deactivation_reason',
    'business_email': 'business_email',
    'id_card_number': 'id_card_number',
    'date_of_birth': 'date_of_birth',
    'id_card_issue_date': 'id_card_issue_date',
    'id_card_issue_place': 'id_card_issue_place',
    'permanent_address': 'permanent_address',
    'place_of_origin': 'place_of_origin',
    'gender': 'gender',
    'tax_code': 'tax_code',
    'bank_name': 'bank_name',
    'bank_account_number': 'bank_account_number',
    'bank_branch_name': 'bank_branch_name',
    'active_area': 'active_area',
    'real_estate_experience': 'real_estate_experience',
    'broker_licence_number': 'broker_licence_number',
    'broker_licence_expiry_date': 'broker_licence_expiry_date',
    'success_seminar_date': 'success_seminar_date',
    'source': 'source',
}

# Cột ngày cần clean
DATE_COLS = {
    'contract_signing_date', 'register_date', 'agent_start_date', 'end_date',
    'date_of_birth', 'id_card_issue_date', 'broker_licence_expiry_date',
    'success_seminar_date'
}


def clean_date(val):
    if val is None or (isinstance(val, str) and val.strip() == ''):
        return None
    dt = pd.to_datetime(val, errors='coerce')
    return dt.strftime('%Y-%m-%d') if pd.notna(dt) else None


def clean_phone(val):
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return str(int(val))
    s = str(val).strip()
    return s if s else None


def clean_str(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    return s if s else None


def clean_data(df: pd.DataFrame) -> list[dict]:
    """Làm sạch dữ liệu từ CSV, trả về list of dicts với key là DB column."""
    records = []
    for _, row in df.iterrows():
        rec = {}
        for csv_col, db_col in CSV_TO_DB_MAP.items():
            if csv_col not in df.columns:
                continue
            val = row[csv_col]
            if csv_col == 'phone':
                rec[db_col] = clean_phone(val)
            elif db_col in DATE_COLS:
                rec[db_col] = clean_date(val)
            else:
                rec[db_col] = clean_str(val)

        # agent_code mặc định = staff_id (đã map ở trên)
        # Đảm bảo nếu staff_id có thì agent_code cũng có cùng giá trị
        if rec.get('staff_id'):
            rec['agent_code'] = rec['staff_id']

        records.append(rec)
    return records


def upsert_agents(conn, records: list[dict]):
    """Upsert agents theo staff_id (unique constraint)."""
    # Chỉ lấy các cột có trong DB_COLUMNS và có giá trị trong ít nhất 1 record
    active_cols = [c for c in DB_COLUMNS if any(r.get(c) is not None for r in records)]

    # Đảm bảo staff_id luôn có để upsert
    if 'staff_id' not in active_cols:
        active_cols.insert(0, 'staff_id')
    if 'agent_code' not in active_cols:
        active_cols.insert(1, 'agent_code')

    rows = []
    for rec in records:
        rows.append(tuple(rec.get(c) for c in active_cols))

    # Build ON CONFLICT UPDATE clause
    update_cols = [c for c in active_cols if c not in ('id', 'staff_id')]
    set_clause = ', '.join([f"{c} = EXCLUDED.{c}" for c in update_cols])
    if set_clause:
        set_clause += ', updated_at = NOW()'
    else:
        set_clause = 'updated_at = NOW()'

    cursor = conn.cursor()
    total = len(rows)

    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        execute_values(
            cursor,
            f"""
            INSERT INTO public.agents ({', '.join(active_cols)})
            VALUES %s
            ON CONFLICT (staff_id) DO UPDATE SET
                {set_clause}
            """,
            batch
        )
        conn.commit()
        print(f"  Upserted {min(i + BATCH_SIZE, total)}/{total}")

    cursor.close()


def update_t1_from_agent_code(conn, records: list[dict]):
    """
    CSV có cột t1_agent_code (vd: LN00095) là agent_code của T1.
    Cần map sang UUID (id) của agent T1 tương ứng để set current_t1_id và referrer_id.
    """
    cursor = conn.cursor()

    # Lấy mapping agent_code -> id (UUID) từ DB
    cursor.execute("SELECT agent_code, id FROM public.agents WHERE deleted_at IS NULL")
    agent_code_to_uuid = {row[0]: row[1] for row in cursor.fetchall()}
    print(f"Loaded {len(agent_code_to_uuid)} agents for T1 mapping")

    t1_updates = []
    for rec in records:
        staff_id = rec.get('staff_id')
        t1_agent_code = rec.get('t1_agent_code')  # Lấy từ CSV original
        if not staff_id or not t1_agent_code:
            continue
        if t1_agent_code in agent_code_to_uuid:
            t1_uuid = agent_code_to_uuid[t1_agent_code]
            t1_updates.append((staff_id, t1_uuid))

    if t1_updates:
        execute_values(
            cursor,
            """
            UPDATE public.agents AS a
            SET current_t1_id = v.t1_id::UUID,
                referrer_id = v.t1_id::UUID
            FROM (VALUES %s) AS v(staff_id, t1_id)
            WHERE a.staff_id = v.staff_id
            """,
            t1_updates
        )
        conn.commit()
        print(f"  Updated current_t1_id/referrer_id for {len(t1_updates)} agents")
    else:
        print("  No T1 mapping updates needed")

    cursor.close()


def update_rank_id_from_rank_name(conn):
    """Map rank_name -> rank_id từ bảng ranks."""
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE public.agents a
        SET rank_id = r.id
        FROM public.ranks r
        WHERE a.rank_id IS NULL
          AND a.rank_name IS NOT NULL
          AND LOWER(TRIM(a.rank_name)) = LOWER(TRIM(r.name))
    """)
    conn.commit()
    print(f"  Mapped rank_id for {cursor.rowcount} agents")
    cursor.close()


def main():
    print(f"Reading {CSV_FILE}...")
    df = pd.read_csv(CSV_FILE)
    print(f"Total rows: {len(df)}")
    print(f"CSV columns: {list(df.columns)}")

    # Lưu lại t1_agent_code gốc để map FK sau
    df['t1_agent_code'] = df.get('t1_agent_code', None)

    print("Cleaning data...")
    records = clean_data(df)

    print(f"Connecting to Supabase...")
    conn = psycopg2.connect(DATABASE_URL)

    try:
        print("Upserting agents...")
        upsert_agents(conn, records)

        print("Updating T1 mappings (current_t1_id, referrer_id) from t1_agent_code...")
        # Truyền lại df gốc để có cột t1_agent_code
        raw_records = []
        for _, row in df.iterrows():
            raw_records.append({
                'staff_id': clean_str(row.get('agent_code')),
                't1_agent_code': clean_str(row.get('t1_agent_code'))
            })
        update_t1_from_agent_code(conn, raw_records)

        print("Updating rank_id from rank_name...")
        update_rank_id_from_rank_name(conn)

        print("\n✅ Import hoàn tất!")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
