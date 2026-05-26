#!/usr/bin/env python3
"""
Trích xuất agents từ eravnTrans SQL dump
và transform sang schema T1 Change Tracker.
"""

import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
DUMP_PATH = SCRIPT_DIR / "../../../eravnTrans/cloud_20260522_154853.sql"
OUTPUT_PATH = SCRIPT_DIR / "../supabase/import_agents.sql"

def parse_copy_block(lines, start_idx):
    header = lines[start_idx]
    m = re.search(r'\((.*?)\)\s+FROM', header)
    cols = [c.strip() for c in m.group(1).split(',')]
    rows = []
    for j in range(start_idx + 1, len(lines)):
        line = lines[j].rstrip('\n')
        if line == '\\.':
            break
        values = line.split('\t')
        row = {}
        for col, val in zip(cols, values):
            row[col] = None if val == '\\N' else val
        rows.append(row)
    return rows

def main():
    print(f"Reading {DUMP_PATH} ...")
    with open(DUMP_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Parse ranks
    rank_map = {}
    for i, line in enumerate(lines):
        if line.startswith('COPY public.ranks '):
            for row in parse_copy_block(lines, i):
                rank_map[row['id']] = row['name']
            break
    print(f"Loaded {len(rank_map)} ranks")

    # Parse agents
    agents_rows = []
    for i, line in enumerate(lines):
        if line.startswith('COPY public.agents '):
            agents_rows = parse_copy_block(lines, i)
            break
    print(f"Loaded {len(agents_rows)} agents")

    inserts = []
    for row in agents_rows:
        if not row.get('id') or not row.get('agent_code'):
            continue

        status = 'inactive' if row.get('end_date') else 'active'
        rank_name = rank_map.get(row.get('rank_id'), '') or ''

        current_t1_id = row.get('introducing_agent_id') or row.get('referrer_id')
        if current_t1_id == row['id']:
            current_t1_id = None

        revenue = row.get('cumulative_personal_revenue') or '0'

        def esc(v):
            if v is None or v == 'NULL':
                return 'NULL'
            return "'" + str(v).replace("'", "''") + "'"

        vals = (
            esc(row['id']),
            esc(row['agent_code']),
            esc(row.get('full_name')),
            esc(row.get('email')),
            esc(row.get('phone')),
            esc(rank_name),
            esc(row['contract_signing_date']),
            esc(current_t1_id) if current_t1_id else 'NULL',
            esc(row.get('introducing_agent_id')) if row.get('introducing_agent_id') else 'NULL',
            'NULL',
            esc(revenue),
            '0',
            esc(status),
            'NULL',
            esc(row.get('created_at')) if row.get('created_at') else 'NOW()',
            esc(row.get('updated_at')) if row.get('updated_at') else 'NOW()'
        )

        val_str = "(" + ", ".join(vals) + ")"
        inserts.append(val_str)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as out:
        out.write("-- T1 Change Tracker - Agents imported from eravnTrans\n")
        out.write("-- Generated automatically\n\n")
        out.write("INSERT INTO public.agents ")
        out.write("(id, staff_id, full_name, email, phone, rank_name, ")
        out.write("contract_signing_date, current_t1_id, introducing_agent_id, ")
        out.write("division_id, cumulative_personal_revenue, my_era_points, status, ")
        out.write("deleted_at, created_at, updated_at)\n")
        out.write("VALUES\n")
        out.write(",\n".join(inserts) + ";\n")

    print(f"Wrote {len(inserts)} agents to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
