-- ============================================================================
-- MALHA SBGR • SCHEMA POSTGIS (SRID 0 LOCAL MÉTRICO + PARTIÇÃO TEMPORAL)
-- Marco Zero (0,0): Centro do Pátio 1 (lat0 = -23.4320, lon0 = -46.4695)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Função de Conversão WGS84 (SRID 4326) -> Sistema Métrico Local (SRID 0)
CREATE OR REPLACE FUNCTION public.wgs84_to_local_srid0(lat double precision, lon double precision)
RETURNS geometry(Point, 0) AS $$
DECLARE
  lat0 CONSTANT double precision := -23.4320;
  lon0 CONSTANT double precision := -46.4695;
  x_local double precision;
  y_local double precision;
BEGIN
  x_local := (lon - lon0) * 102135.2;
  y_local := (lat - lat0) * 110746.5;
  RETURN ST_SetSRID(ST_MakePoint(x_local, y_local), 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Tabela Unificada de Feições Cartográficas (map_features)
CREATE TABLE IF NOT EXISTS public.map_features (
  id text PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('patio', 'runway', 'taxiway', 'estacionamento', 'abastecimento', 'perimetral', 'remota', 'avia_geral')),
  patio_ref text,
  geometria geometry(Geometry, 0) NOT NULL,
  propriedades_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  z_order integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_features_geom ON public.map_features USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_map_features_tipo ON public.map_features (tipo, z_order);

-- 3. Cadastro de Viaturas e Aeronaves Rastreadas (vehicles)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  callsign text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('SRV', 'CTA', 'AIRCRAFT', 'SUPORTE')),
  icao24 text,
  rfid_tag text,
  status text NOT NULL DEFAULT 'ONLINE',
  last_geom geometry(Point, 0),
  last_heading numeric(5,2) DEFAULT 0,
  last_speed_kmh numeric(6,2) DEFAULT 0,
  last_seen_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_last_geom ON public.vehicles USING GIST (last_geom);

-- 4. Histórico de Rastreamento Particionado por Tempo (tracks)
CREATE TABLE IF NOT EXISTS public.tracks (
  id bigserial,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  geom_point geometry(Point, 0) NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  speed numeric(6,2) DEFAULT 0,
  heading numeric(5,2) DEFAULT 0,
  source text NOT NULL CHECK (source IN ('ADSB', 'RTLS_GPS', 'RFID')),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

CREATE TABLE IF NOT EXISTS public.tracks_current_month
  PARTITION OF public.tracks
  FOR VALUES FROM (date_trunc('month', now())) TO (date_trunc('month', now()) + interval '1 month');

CREATE INDEX IF NOT EXISTS idx_tracks_geom ON public.tracks USING GIST (geom_point);
CREATE INDEX IF NOT EXISTS idx_tracks_vehicle_ts ON public.tracks (vehicle_id, ts DESC);

-- 5. Cercas Virtuais de Segurança e Pátio (geofences)
CREATE TABLE IF NOT EXISTS public.geofences (
  id text PRIMARY KEY,
  nome text NOT NULL,
  geometria geometry(Polygon, 0) NOT NULL,
  severidade text NOT NULL CHECK (severidade IN ('CRITICA', 'ALERTA', 'OPERACIONAL')),
  regra_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_geofences_geom ON public.geofences USING GIST (geometria);
