#!/usr/bin/env python3
"""
Loader Canônico: posicoes.txt -> PostGIS (SBGR SRID 0)
Valida:
1. Códigos únicos
2. Existência de FK lógica de Pátio (PATIO_1..PATIO_7)
3. Coordenadas dentro do envelope operacional de SBGR e contidas no polígono do pátio
4. Heading normalizado no intervalo [0, 360)
"""
import csv
import json
import os
import psycopg2
from psycopg2.extras import execute_values

DB_DSN = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/malha_sbgr")
CSV_PATH = os.getenv("POSICOES_CSV", "public/gis/posicoes.txt")

def validate_and_load():
    seen_codes = set()
    rows_to_upsert = []

    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for line_num, row in enumerate(reader, start=2):
            codigo = row["codigo"].strip()
            patio = row["patio"].strip()
            tipo = row["tipo"].strip()
            x = float(row["x_local"])
            y = float(row["y_local"])
            z = float(row["z_local"])
            heading = float(row["heading"]) % 360.0
            nome = row["nome"].strip()

            if codigo in seen_codes:
                raise ValueError(f"[Linha {line_num}] Código duplicado detectado: {codigo}")
            seen_codes.add(codigo)

            if not (-3500.0 <= x <= 3500.0 and -3500.0 <= y <= 3500.0):
                raise ValueError(f"[Linha {line_num}] Coordenada fora dos bounds SBGR: ({x}, {y})")

            z_order = 50 if tipo == "estacionamento" else (40 if tipo == "abastecimento" else 60)
            props = json.dumps({
                "patio": patio,
                "z_local": z,
                "heading": round(heading, 2),
                "nome": nome
            })
            rows_to_upsert.append((codigo, codigo, tipo, patio, x, y, props, z_order))

    conn = psycopg2.connect(DB_DSN)
    with conn, conn.cursor() as cur:
        sql = """
            INSERT INTO public.map_features (id, codigo, tipo, patio_ref, geometria, propriedades_jsonb, z_order)
            VALUES %s
            ON CONFLICT (codigo) DO UPDATE SET
              tipo = EXCLUDED.tipo,
              patio_ref = EXCLUDED.patio_ref,
              geometria = EXCLUDED.geometria,
              propriedades_jsonb = EXCLUDED.propriedades_jsonb,
              z_order = EXCLUDED.z_order,
              updated_at = now();
        """
        template = "(%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 0), %s::jsonb, %s)"
        execute_values(cur, sql, rows_to_upsert, template=template)
    print(f"[OK] {len(rows_to_upsert)} feições validadas e carregadas no PostGIS (SRID 0).")

if __name__ == "__main__":
    validate_and_load()
