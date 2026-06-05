#!/usr/bin/env python3
"""
Import agents từ Excel lên Supabase.
Yêu cầu: pip install pandas openpyxl psycopg2-binary

Cách lấy DATABASE_URL:
1. Vào Supabase Dashboard > Project Settings > Database
2. Copy "Connection string" (URI tab) hoặc dùng Direct connection
Ví dụ: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

# ============================
# CONFIG
# ============================
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres')
EXCEL_FILE = 'template_agents 260605.xlsx'
BATCH_SIZE = 500


def clean_data(df: pd.DataFrame) -> list[dict]:
    """Làm sạch dữ liệu từ Excel, trả về list of dicts."""

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

    date_cols = {
        'contract_signing_date', 'register_date', 'agent_start_date', 'end_date',
        'date_of_birth', 'id_card_issue_date', 'broker_licence_expiry_date',
        'success_seminar_date'
    }

    records = []
    for _, row in df.iterrows():
        rec = {}
        for col in df.columns:
            val = row[col]
            if col == 'phone':
                rec[col] = clean_phone(val)
            elif col in date_cols:
                rec[col] = clean_date(val)
            else:
                rec[col] = clean_str(val)
        records.append(rec)
    return records


def upsert_agents(conn, records: list[dict]):
    """Upsert agents (không bao gồm FK current_t1_id, introducing_agent_id, rank_id)."""
    columns = [
        'staff_id', 'agent_code', 'full_name', 'email', 'phone', 'rank_name',
        'contract_signing_date', 'status', 'register_date', 'agent_start_date',
        'end_date', 'deactivation_reason', 'business_email', 'id_card_number',
        'date_of_birth', 'id_card_issue_date', 'id_card_issue_place',
        'permanent_address', 'place_of_origin', 'gender', 'tax_code', 'bank_name',
        'bank_account_number', 'bank_branch_name', 'active_area',
        'real_estate_experience', 'broker_licence_number',
        'broker_licence_expiry_date', 'success_seminar_date', 'source'
    ]

    rows = []
    for rec in records:
        # agent_code mặc định = staff_id nếu không có trong Excel
        if rec.get('agent_code') is None:
            rec['agent_code'] = rec.get('staff_id')
        rows.append(tuple(rec.get(c) for c in columns))

    cursor = conn.cursor()
    total = len(rows)

    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        execute_values(
            cursor,
            f"""
            INSERT INTO public.agents ({', '.join(columns)})
            VALUES %s
            ON CONFLICT (staff_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                rank_name = EXCLUDED.rank_name,
                contract_signing_date = EXCLUDED.contract_signing_date,
                status = EXCLUDED.status,
                register_date = EXCLUDED.register_date,
                agent_start_date = EXCLUDED.agent_start_date,
                end_date = EXCLUDED.end_date,
                deactivation_reason = EXCLUDED.deactivation_reason,
                business_email = EXCLUDED.business_email,
                id_card_number = EXCLUDED.id_card_number,
                date_of_birth = EXCLUDED.date_of_birth,
                id_card_issue_date = EXCLUDED.id_card_issue_date,
                id_card_issue_place = EXCLUDED.id_card_issue_place,
                permanent_address = EXCLUDED.permanent_address,
                place_of_origin = EXCLUDED.place_of_origin,
                gender = EXCLUDED.gender,
                tax_code = EXCLUDED.tax_code,
                bank_name = EXCLUDED.bank_name,
                bank_account_number = EXCLUDED.bank_account_number,
                bank_branch_name = EXCLUDED.bank_branch_name,
                active_area = EXCLUDED.active_area,
                real_estate_experience = EXCLUDED.real_estate_experience,
                broker_licence_number = EXCLUDED.broker_licence_number,
                broker_licence_expiry_date = EXCLUDED.broker_licence_expiry_date,
                success_seminar_date = EXCLUDED.success_seminar_date,
                source = EXCLUDED.source,
                agent_code = EXCLUDED.agent_code,
                updated_at = NOW()
            """,
            batch
        )
        conn.commit()
        print(f"  Upserted {min(i + BATCH_SIZE, total)}/{total}")

    cursor.close()


def update_fk_from_staff_id(conn, records: list[dict]):
    """
    current_t1_id và introducing_agent_id trong Excel là staff_id (TEXT),
    cần map sang UUID của agent tương ứng.
    """
    cursor = conn.cursor()

    # Lấy mapping staff_id -> id
    cursor.execute("SELECT staff_id, id FROM public.agents WHERE deleted_at IS NULL")
    staff_to_uuid = {row[0]: row[1] for row in cursor.fetchall()}
    print(f"Loaded {len(staff_to_uuid)} agents for FK mapping")

    # 1. Update current_t1_id + referrer_id
    t1_updates = []
    for rec in records:
        staff = rec.get('staff_id')
        t1_staff = rec.get('current_t1_id')
        if t1_staff and t1_staff in staff_to_uuid and staff in staff_to_uuid:
            t1_updates.append((staff_to_uuid[staff], staff_to_uuid[t1_staff]))

    if t1_updates:
        execute_values(
            cursor,
            """
            UPDATE public.agents AS a
            SET current_t1_id = v.t1_id::UUID,
                referrer_id = v.t1_id::UUID
            FROM (VALUES %s) AS v(agent_id, t1_id)
            WHERE a.id = v.agent_id::UUID
            """,
            t1_updates
        )
        conn.commit()
        print(f"  Updated current_t1_id/referrer_id for {len(t1_updates)} agents")

    # 2. Update introducing_agent_id
    intro_updates = []
    for rec in records:
        staff = rec.get('staff_id')
        intro_staff = rec.get('introducing_agent_id')
        if intro_staff and intro_staff in staff_to_uuid and staff in staff_to_uuid:
            intro_updates.append((staff_to_uuid[staff], staff_to_uuid[intro_staff]))

    if intro_updates:
        execute_values(
            cursor,
            """
            UPDATE public.agents AS a
            SET introducing_agent_id = v.intro_id::UUID
            FROM (VALUES %s) AS v(agent_id, intro_id)
            WHERE a.id = v.agent_id::UUID
            """,
            intro_updates
        )
        conn.commit()
        print(f"  Updated introducing_agent_id for {len(intro_updates)} agents")

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
    print(f"Reading {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE)
    print(f"Total rows: {len(df)}")

    print("Cleaning data...")
    records = clean_data(df)

    print(f"Connecting to Supabase...")
    conn = psycopg2.connect(DATABASE_URL)

    try:
        print("Upserting agents...")
        upsert_agents(conn, records)

        print("Updating FK mappings (current_t1_id, referrer_id, introducing_agent_id)...")
        update_fk_from_staff_id(conn, records)

        print("Updating rank_id from rank_name...")
        update_rank_id_from_rank_name(conn)

        print("\n✅ Import hoàn tất!")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
