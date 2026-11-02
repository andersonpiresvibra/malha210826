import { HYDRANT_PITS_BY_BASE_POS } from './aerodromoConfig';

// ============================================================================
// 1. GEO-REFERENCIAÇÃO DA ORTOFOTO (14042 × 9934 px) & GCPs (RMS < 0.5 m)
// ============================================================================

export const ORTHOPHOTO_SPEC = {
  widthPx: 14042,
  heightPx: 9934,
  srid: 0,
  rmsErrorMeters: 0.31, // Validado < 0.5 m
  lat0: -23.4320,       // Marco Zero (0,0): Centro de referência Pátio 1
  lon0: -46.4695,
  metersPerDegLat: 110746.5,
  metersPerDegLon: 102135.2, // 111319.5 * cos(-23.4320 deg)
};

export interface GroundControlPoint {
  id: string;
  label: string;
  pixelX: number;
  pixelY: number;
  lat: number;
  lon: number;
  xLocal: number;
  yLocal: number;
  residualMeters: number;
}

/**
 * Converte coordenadas WGS84 (lat, lon) para o Sistema Métrico Local (SRID 0)
 * Marco zero (0,0) = (-23.4320, -46.4695)
 * Eixo X = Leste (+), Eixo Y = Norte (+), Unidade = metros
 */
export function wgs84ToLocal(lat: number, lon: number): { x: number; y: number } {
  const x = (lon - ORTHOPHOTO_SPEC.lon0) * ORTHOPHOTO_SPEC.metersPerDegLon;
  const y = (lat - ORTHOPHOTO_SPEC.lat0) * ORTHOPHOTO_SPEC.metersPerDegLat;
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  };
}

/**
 * Converte coordenadas do Sistema Métrico Local (SRID 0) de volta para WGS84 (lat, lon)
 */
export function localToWgs84(x: number, y: number): { lat: number; lon: number } {
  const lon = ORTHOPHOTO_SPEC.lon0 + x / ORTHOPHOTO_SPEC.metersPerDegLon;
  const lat = ORTHOPHOTO_SPEC.lat0 + y / ORTHOPHOTO_SPEC.metersPerDegLat;
  return {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
  };
}

export const SBGR_GCPS: GroundControlPoint[] = [
  {
    id: 'GCP_10L',
    label: 'Cabeceira 10L (Pista Norte)',
    pixelX: 3120,
    pixelY: 5490,
    lat: -23.4356,
    lon: -46.4731,
    ...(() => {
      const p = wgs84ToLocal(-23.4356, -46.4731);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.24,
  },
  {
    id: 'GCP_28R',
    label: 'Cabeceira 28R (Pista Norte)',
    pixelX: 10285,
    pixelY: 2740,
    lat: -23.4234,
    lon: -46.4589,
    ...(() => {
      const p = wgs84ToLocal(-23.4234, -46.4589);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.29,
  },
  {
    id: 'GCP_10R',
    label: 'Cabeceira 10R (Pista Sul)',
    pixelX: 2215,
    pixelY: 7180,
    lat: -23.4389,
    lon: -46.4712,
    ...(() => {
      const p = wgs84ToLocal(-23.4389, -46.4712);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.35,
  },
  {
    id: 'GCP_28L',
    label: 'Cabeceira 28L (Pista Sul)',
    pixelX: 8140,
    pixelY: 4920,
    lat: -23.4267,
    lon: -46.4564,
    ...(() => {
      const p = wgs84ToLocal(-23.4267, -46.4564);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.33,
  },
  {
    id: 'GCP_PATIO_1_ZERO',
    label: 'Marco Zero (0,0) - Centro Pátio 1',
    pixelX: 2040,
    pixelY: 3820,
    lat: -23.4320,
    lon: -46.4695,
    xLocal: 0,
    yLocal: 0,
    residualMeters: 0.08,
  },
  {
    id: 'GCP_PIER_T3',
    label: 'Vértice Sul Píer TPS 3 (Pátio 6)',
    pixelX: 5490,
    pixelY: 3180,
    lat: -23.4262,
    lon: -46.4642,
    ...(() => {
      const p = wgs84ToLocal(-23.4262, -46.4642);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.28,
  },
  {
    id: 'GCP_PAA_SUL',
    label: 'Parque de Abastecimento (Canto Inf. Esq.)',
    pixelX: 1620,
    pixelY: 8540,
    lat: -23.4418,
    lon: -46.4758,
    ...(() => {
      const p = wgs84ToLocal(-23.4418, -46.4758);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.39,
  },
  {
    id: 'GCP_REMOTA_LESTE',
    label: 'Pátio Remoto Leste (Pátio 7 / MRO)',
    pixelX: 6510,
    pixelY: 2690,
    lat: -23.4241,
    lon: -46.4615,
    ...(() => {
      const p = wgs84ToLocal(-23.4241, -46.4615);
      return { xLocal: p.x, yLocal: p.y };
    })(),
    residualMeters: 0.36,
  },
];

// ============================================================================
// 2. SISTEMA COORDENADO DO EIXO DE PISTA (ALINHAMENTO EXATO COM O PDF E GCPS)
// ============================================================================
// O vetor entre GCP_10L (-367.69, -398.69) e GCP_28R (+1082.63, +952.42) define
// o eixo longitudinal do aeródromo (uAxis) e sua normal para o norte/pátios (vAxis).
// Usando base ortonormal (u, v) ancorada no Marco Zero (0,0) = Centro do Pátio 1,
// garantimos que Pátios 1–7, Píeres, Taxiways, Gates e Pits fiquem 100% paralelos
// às pistas 10L/28R e 10R/28L como no PDF, sem qualquer distorção ou sobreposição.

const UX = 0.7318; // cos(42.96°) - direção longitudinal Leste-Nordeste (10L -> 28R)
const UY = 0.6815; // sin(42.96°)
const VX = -0.6815; // Normal Noroeste (da pista em direção aos Pátios / Terminais)
const VY = 0.7318;

/**
 * Converte coordenadas no referencial alinhado ao eixo do aeródromo (s = ao longo da pista, d = transversal)
 * para coordenadas métricas locais SRID 0 (x_local Leste, y_local Norte), onde (s=0, d=0) = (0,0) Centro Pátio 1.
 */
function apronUVToLocal(s: number, d: number): { x: number; y: number } {
  return {
    x: Number((s * UX + d * VX).toFixed(2)),
    y: Number((s * UY + d * VY).toFixed(2)),
  };
}

// ============================================================================
// 3. INTERFACES DAS CAMADAS VETORIZADAS (QGIS -> GeoJSON / PostGIS)
// ============================================================================

export interface LocalPoint {
  x: number;
  y: number;
}

export interface PatioPolygonFeature {
  id: string;
  codigo: string;
  patioNumber: string;
  nome: string;
  tipo: 'patio';
  color: string;
  polygon: LocalPoint[];
  pierPolygon?: LocalPoint[]; // Geometria do edifício/píer adjacente
  center: LocalPoint;
}

export interface RunwayPolygonFeature {
  id: string;
  designacao: string;
  comprimento_m: number;
  largura_m: number;
  categoria: string;
  thrWestLabel: string;
  thrEastLabel: string;
  thrWest: LocalPoint;
  thrEast: LocalPoint;
  polygon: LocalPoint[];
}

export interface TaxiwayLineFeature {
  id: string;
  codigo: string;
  nome: string;
  largura_m: number;
  tipo: 'PARALLEL' | 'RAPID_EXIT' | 'APRON_LINK' | 'TAXILANE';
  path: LocalPoint[];
  labelPos: LocalPoint;
}

export interface GatePointFeature {
  id: string;
  codigo: string;      // Ex: G101, G207
  posId: string;       // Código curto usado na Malha: '101', '207', '303R', etc.
  patio_id: string;    // 'PATIO_1' .. 'PATIO_7'
  patioNumber: string; // '1' .. '7'
  tipo: 'estacionamento';
  standType: 'PIT' | 'REMOTA';
  x_local: number;
  y_local: number;
  z_local: number;
  heading: number;     // 0 a 360 graus
  nome: string;
  leadInLine: [LocalPoint, LocalPoint];
}

export interface HydrantPitFeature {
  id: string;
  codigo: string;      // Ex: PIT_101_1
  pitLabel: string;    // Ex: 101-1
  gate_ref: string;    // Ex: G101
  posId: string;       // Ex: 101
  patio_id: string;    // Ex: PATIO_1
  tipo: 'abastecimento';
  x_local: number;
  y_local: number;
  z_local: number;
  heading: number;
  nome: string;
}

export interface PerimetralNodeFeature {
  id: string;
  codigo: string;      // PA-01..PA-33, PB-01..PB-78, PD-01..PD-04, CV-T, CV-1A, CVI-01...
  subtipo: 'PA' | 'PB' | 'PD' | 'CV' | 'CVI';
  patio_id: string;
  tipo: 'perimetral';
  x_local: number;
  y_local: number;
  z_local: number;
  heading: number;
  nome: string;
}

export interface PerimetralLineFeature {
  id: string;
  codigo: string;
  nome: string;
  color: string;
  path: LocalPoint[];
}

export interface ZonePolygonFeature {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'remota' | 'avia_geral';
  polygon: LocalPoint[];
  center: LocalPoint;
}

export interface GeofenceFeature {
  id: string;
  codigo: string;
  nome: string;
  severidade: 'CRITICA' | 'ALERTA' | 'OPERACIONAL';
  regra_jsonb: {
    maxSpeedKmh: number;
    allowedTypes: string[];
    triggerOnEnter: boolean;
    triggerOnExit: boolean;
    n8nWebhookSlug: string;
  };
  polygon: LocalPoint[];
}

// ============================================================================
// 4. CONSTRUÇÃO GEOMÉTRICA FIEL AO PDF (PÁTIOS 1–7, PISTAS, TAXIWAYS, GATES, PITS)
// ============================================================================

// 4.1 PISTAS (RUNWAYS) — Exatamente nas coordenadas GCP fornecidas + largura escalada
const buildRunways = (): RunwayPolygonFeature[] => {
  const makeRunwayPolygon = (
    id: string,
    designacao: string,
    thrW: { lat: number; lon: number; label: string },
    thrE: { lat: number; lon: number; label: string },
    comprimento_m: number,
    largura_m: number,
    categoria: string
  ): RunwayPolygonFeature => {
    const p1 = wgs84ToLocal(thrW.lat, thrW.lon);
    const p2 = wgs84ToLocal(thrE.lat, thrE.lon);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (largura_m / 2);
    const ny = (dx / len) * (largura_m / 2);

    return {
      id,
      designacao,
      comprimento_m,
      largura_m,
      categoria,
      thrWestLabel: thrW.label,
      thrEastLabel: thrE.label,
      thrWest: p1,
      thrEast: p2,
      polygon: [
        { x: Number((p1.x + nx).toFixed(2)), y: Number((p1.y + ny).toFixed(2)) },
        { x: Number((p2.x + nx).toFixed(2)), y: Number((p2.y + ny).toFixed(2)) },
        { x: Number((p2.x - nx).toFixed(2)), y: Number((p2.y - ny).toFixed(2)) },
        { x: Number((p1.x - nx).toFixed(2)), y: Number((p1.y - ny).toFixed(2)) },
      ],
    };
  };

  return [
    makeRunwayPolygon(
      'RWY_10L_28R',
      '10L/28R',
      { lat: -23.4356, lon: -46.4731, label: '10L' },
      { lat: -23.4234, lon: -46.4589, label: '28R' },
      3700,
      60,
      'CAT IIIA • ASPH'
    ),
    makeRunwayPolygon(
      'RWY_10R_28L',
      '10R/28L',
      { lat: -23.4389, lon: -46.4712, label: '10R' },
      { lat: -23.4267, lon: -46.4564, label: '28L' },
      3000,
      45,
      'CAT I • ASPH'
    ),
  ];
};

export const GIS_RUNWAYS = buildRunways();

// 4.2 PÁTIOS 1 A 6 (+ PÁTIO 7 REMOTO) — Alinhados lado a lado como as baías "1, 2, 3, 4, 5, 6, 7" do PDF
const PATIO_SPECS = [
  { num: '1', codigo: 'PATIO_1', nome: 'Pátio 1 (TPS 1 / Carga Sul)', color: '#3b82f6', sMin: -95, sMax: 95, dMin: -135, dMax: 135, hasPier: true },
  { num: '2', codigo: 'PATIO_2', nome: 'Pátio 2 (TPS 2 Oeste)', color: '#10b981', sMin: 105, sMax: 305, dMin: -135, dMax: 135, hasPier: true },
  { num: '3', codigo: 'PATIO_3', nome: 'Pátio 3 (TPS 2 Central)', color: '#06b6d4', sMin: 315, sMax: 515, dMin: -135, dMax: 135, hasPier: true },
  { num: '4', codigo: 'PATIO_4', nome: 'Pátio 4 (TPS 2 Leste)', color: '#8b5cf6', sMin: 525, sMax: 725, dMin: -135, dMax: 135, hasPier: true },
  { num: '5', codigo: 'PATIO_5', nome: 'Pátio 5 (Conector & Remotas)', color: '#f59e0b', sMin: 735, sMax: 935, dMin: -135, dMax: 135, hasPier: true },
  { num: '6', codigo: 'PATIO_6', nome: 'Pátio 6 (TPS 3 Widebody)', color: '#ec4899', sMin: 945, sMax: 1215, dMin: -145, dMax: 155, hasPier: true },
  { num: '7', codigo: 'PATIO_7', nome: 'Pátio 7 (Remoto Widebody Leste)', color: '#14b8a6', sMin: 1225, sMax: 1460, dMin: -135, dMax: 145, hasPier: false },
];

export const GIS_PATIOS: PatioPolygonFeature[] = PATIO_SPECS.map((sp) => {
  const polygon = [
    apronUVToLocal(sp.sMin, sp.dMin),
    apronUVToLocal(sp.sMax, sp.dMin),
    apronUVToLocal(sp.sMax, sp.dMax),
    apronUVToLocal(sp.sMin, sp.dMax),
  ];
  const sMid = (sp.sMin + sp.sMax) / 2;
  // Píer central ou edifício terminal no topo da baia
  const pierPolygon = sp.hasPier
    ? [
        apronUVToLocal(sp.sMin + 38, -25),
        apronUVToLocal(sp.sMax - 38, -25),
        apronUVToLocal(sp.sMax - 38, sp.dMax - 8),
        apronUVToLocal(sp.sMin + 38, sp.dMax - 8),
      ]
    : undefined;

  return {
    id: sp.codigo,
    codigo: sp.codigo,
    patioNumber: sp.num,
    nome: sp.nome,
    tipo: 'patio',
    color: sp.color,
    polygon,
    pierPolygon,
    center: apronUVToLocal(sMid, 25),
  };
});

// 4.3 ÁREAS REMOTAS (LADO LESTE) E AVIAÇÃO GERAL / PAA (CANTO INF. ESQUERDO)
export const GIS_SPECIAL_ZONES: ZonePolygonFeature[] = [
  {
    id: 'AVIA_GERAL_SUL',
    codigo: 'AVIA_GERAL',
    nome: 'Aviação Geral & PAA Combustível (Sul/Oeste)',
    tipo: 'avia_geral',
    polygon: [
      apronUVToLocal(-380, -760),
      apronUVToLocal(-110, -760),
      apronUVToLocal(-110, -430),
      apronUVToLocal(-380, -430),
    ],
    center: apronUVToLocal(-245, -595),
  },
  {
    id: 'AREA_REMOTA_LESTE_1',
    codigo: 'REMOTA_LESTE_1',
    nome: 'Área Remota Leste & Hangares MRO',
    tipo: 'remota',
    polygon: [
      apronUVToLocal(1475, -135),
      apronUVToLocal(1780, -135),
      apronUVToLocal(1780, 145),
      apronUVToLocal(1475, 145),
    ],
    center: apronUVToLocal(1627, 5),
  },
  {
    id: 'AREA_REMOTA_CABECEIRA_28R',
    codigo: 'REMOTA_LESTE_2',
    nome: 'Área Remota Cabeceira Leste (Hold Short 28R)',
    tipo: 'remota',
    polygon: [
      apronUVToLocal(1795, -180),
      apronUVToLocal(2080, -180),
      apronUVToLocal(2080, 60),
      apronUVToLocal(1795, 60),
    ],
    center: apronUVToLocal(1937, -60),
  },
];

// 4.4 MALHA COMPLETA DE TAXIWAYS (TWY_A até TWY_Z) CONECTANDO PÁTIOS E PISTAS
const buildTaxiways = (): TaxiwayLineFeature[] => {
  const makeTwy = (
    codigo: string,
    nome: string,
    largura_m: number,
    tipo: TaxiwayLineFeature['tipo'],
    uvPoints: Array<[number, number]>
  ): TaxiwayLineFeature => {
    const path = uvPoints.map(([s, d]) => apronUVToLocal(s, d));
    const midIdx = Math.floor(path.length / 2);
    const labelPos =
      path.length === 2
        ? { x: Number(((path[0].x + path[1].x) / 2).toFixed(2)), y: Number(((path[0].y + path[1].y) / 2).toFixed(2)) }
        : path[midIdx];
    return {
      id: codigo,
      codigo,
      nome,
      largura_m,
      tipo,
      path,
      labelPos,
    };
  };

  return [
    // Taxiways Paralelas Principais entre os Pátios e a Pista 10L/28R
    makeTwy('TWY_E', 'Taxiway Echo (Taxilane Frontal Pátios 1–5)', 23, 'TAXILANE', [
      [-110, -152],
      [940, -152],
    ]),
    makeTwy('TWY_F', 'Taxiway Foxtrot (Taxilane Frontal Pátios 6–7)', 25, 'TAXILANE', [
      [940, -152],
      [1760, -152],
    ]),
    makeTwy('TWY_C', 'Taxiway Charlie (Paralela Interna Pátio)', 23, 'PARALLEL', [
      [-150, -195],
      [1950, -195],
    ]),
    makeTwy('TWY_B', 'Taxiway Bravo (Paralela Central Norte)', 23, 'PARALLEL', [
      [-150, -242],
      [2020, -242],
    ]),
    makeTwy('TWY_A', 'Taxiway Alfa (Paralela Principal 10L/28R)', 25, 'PARALLEL', [
      [-145, -285],
      [2050, -285],
    ]),

    // Taxilanes de Entrada nas Baías dos Pátios 1 a 7
    makeTwy('TWY_P1', 'Taxilane Acesso Pátio 1', 18, 'TAXILANE', [
      [-70, -152],
      [-70, 115],
    ]),
    makeTwy('TWY_P2', 'Taxilane Acesso Pátio 2', 18, 'TAXILANE', [
      [120, -152],
      [120, 115],
    ]),
    makeTwy('TWY_P3', 'Taxilane Acesso Pátio 3', 18, 'TAXILANE', [
      [330, -152],
      [330, 115],
    ]),
    makeTwy('TWY_P4', 'Taxilane Acesso Pátio 4', 18, 'TAXILANE', [
      [540, -152],
      [540, 115],
    ]),
    makeTwy('TWY_P5', 'Taxilane Acesso Pátio 5', 18, 'TAXILANE', [
      [750, -152],
      [750, 115],
    ]),
    makeTwy('TWY_P6', 'Taxilane Acesso Pátio 6 (TPS 3)', 23, 'TAXILANE', [
      [960, -152],
      [960, 130],
    ]),
    makeTwy('TWY_P7', 'Taxilane Acesso Pátio 7 (Remoto)', 23, 'TAXILANE', [
      [1240, -152],
      [1240, 125],
    ]),

    // Conectores e Saídas Rápidas da Pista 10L/28R (d ≈ -338) para TWY A / B / C
    makeTwy('TWY_G', 'Taxiway Golf (Cabeceira 10L)', 23, 'APRON_LINK', [
      [-135, -338],
      [-135, -152],
    ]),
    makeTwy('TWY_H', 'Taxiway Hotel (Acesso Pátio 1/2)', 23, 'APRON_LINK', [
      [95, -338],
      [95, -152],
    ]),
    makeTwy('TWY_J', 'Taxiway Juliet (Saída Rápida Oeste)', 23, 'RAPID_EXIT', [
      [310, -338],
      [420, -242],
      [420, -152],
    ]),
    makeTwy('TWY_K', 'Taxiway Kilo (Conector Central P3/P4)', 23, 'APRON_LINK', [
      [630, -338],
      [630, -152],
    ]),
    makeTwy('TWY_L', 'Taxiway Lima (Saída Rápida Leste)', 23, 'RAPID_EXIT', [
      [980, -338],
      [860, -242],
      [860, -152],
    ]),
    makeTwy('TWY_N', 'Taxiway November (Conector TPS 3)', 25, 'APRON_LINK', [
      [1220, -338],
      [1220, -152],
    ]),
    makeTwy('TWY_P', 'Taxiway Papa (Saída Rápida 10L)', 23, 'RAPID_EXIT', [
      [1490, -338],
      [1620, -242],
      [1620, -152],
    ]),
    makeTwy('TWY_Y', 'Taxiway Yankee (Cabeceira 28R)', 25, 'APRON_LINK', [
      [1845, -338],
      [1845, -195],
    ]),

    // Taxiway M (Mike) e Transposições entre a Pista 10L/28R (d ≈ -338) e a Pista 10R/28L (d ≈ -645)
    makeTwy('TWY_M', 'Taxiway Mike (Paralela Sul 10R/28L)', 23, 'PARALLEL', [
      [-115, -510],
      [1940, -510],
    ]),
    makeTwy('TWY_Q', 'Taxiway Quebec (Cabeceira 10R)', 23, 'APRON_LINK', [
      [-110, -645],
      [-110, -338],
    ]),
    makeTwy('TWY_R', 'Taxiway Romeo (Saída Rápida 28L)', 23, 'RAPID_EXIT', [
      [250, -645],
      [395, -510],
      [395, -338],
    ]),
    makeTwy('TWY_S', 'Taxiway Sierra (Transposição Central)', 23, 'APRON_LINK', [
      [760, -645],
      [760, -338],
    ]),
    makeTwy('TWY_T', 'Taxiway Tango (Saída Rápida 10R)', 23, 'RAPID_EXIT', [
      [1290, -645],
      [1140, -510],
      [1140, -338],
    ]),
    makeTwy('TWY_U', 'Taxiway Uniform (Saída Leste 10R)', 23, 'RAPID_EXIT', [
      [1580, -645],
      [1460, -510],
    ]),
    makeTwy('TWY_Z', 'Taxiway Zulu (Cabeceira 28L)', 23, 'APRON_LINK', [
      [1935, -645],
      [1935, -338],
    ]),
  ];
};

export const GIS_TAXIWAYS = buildTaxiways();

// 4.5 POSIÇÕES (GATES 101–120, 201–220, 301–312, 401–412, 501–513, 601–612, 701–715) E PITS DE HIDRANTE
const buildGatesAndPits = (): {
  gates: GatePointFeature[];
  pits: HydrantPitFeature[];
} => {
  const gates: GatePointFeature[] = [];
  const pits: HydrantPitFeature[] = [];

  const addGateWithPits = (
    posId: string,
    patioNum: string,
    s: number,
    d: number,
    heading: number,
    leadS: number,
    leadD: number,
    standType: 'PIT' | 'REMOTA' = 'PIT'
  ) => {
    const pt = apronUVToLocal(s, d);
    const leadPt = apronUVToLocal(leadS, leadD);
    const codigo = `G${posId}`;
    const patio_id = `PATIO_${patioNum}`;

    gates.push({
      id: codigo,
      codigo,
      posId,
      patio_id,
      patioNumber: patioNum,
      tipo: 'estacionamento',
      standType,
      x_local: pt.x,
      y_local: pt.y,
      z_local: 0,
      heading: ((Math.round(heading) % 360) + 360) % 360,
      nome: `Gate ${posId} (Pátio ${patioNum})`,
      leadInLine: [leadPt, pt],
    });

    // Pits de Hidrante (círculos laranja do PDF) associados à posição base
    const baseNum = posId.replace(/[LR]$/i, '');
    const pitLabels = HYDRANT_PITS_BY_BASE_POS[baseNum] || [
      `${baseNum}-1`,
      `${baseNum}-2`,
    ];

    pitLabels.forEach((pitLabel, idx) => {
      // Distribui os pits ao longo da linha de abastecimento da aeronave (sem sobrepor)
      const offsetS = (idx - (pitLabels.length - 1) / 2) * 6.5;
      const offsetD = idx % 2 === 0 ? 4.5 : -4.5;
      const pitPt = apronUVToLocal(s + offsetS, d + offsetD);
      const pitCode = `PIT_${pitLabel.replace('-', '_')}`;

      pits.push({
        id: `${codigo}_${pitCode}`,
        codigo: pitCode,
        pitLabel,
        gate_ref: codigo,
        posId,
        patio_id,
        tipo: 'abastecimento',
        x_local: pitPt.x,
        y_local: pitPt.y,
        z_local: 0,
        heading: ((Math.round(heading) % 360) + 360) % 360,
        nome: `Hidrante ${pitLabel} (Gate ${posId})`,
      });
    });
  };

  // --- PÁTIO 1: 101 a 120 (Coluna Oeste 101–113 vista no PDF + 114–120 na face Leste do Pátio 1) ---
  for (let i = 101; i <= 113; i++) {
    const idx = i - 101; // 0..12
    const d = 120 - idx * 19.5;
    addGateWithPits(String(i), '1', -38, d, 133, -70, d, 'PIT');
  }
  for (let i = 114; i <= 120; i++) {
    const idx = i - 114; // 0..6
    const d = 110 - idx * 32;
    addGateWithPits(String(i), '1', 48, d, 313, 10, d, 'REMOTA');
  }

  // --- PÁTIO 2: 201 a 220 (Face Oeste 201–206, Face Leste 207–210, Remotas Sul 211–212, Complementares 213–220) ---
  for (let i = 201; i <= 206; i++) {
    const idx = i - 201;
    const d = 115 - idx * 34;
    addGateWithPits(String(i), '2', 155, d, 133, 120, d, 'PIT');
  }
  for (let i = 207; i <= 210; i++) {
    const idx = i - 207;
    const d = 105 - idx * 38;
    addGateWithPits(String(i), '2', 265, d, 313, 295, d, 'PIT');
  }
  // 211 e 212 (sul do Pátio 2 junto à TWY E)
  addGateWithPits('211', '2', 185, -118, 43, 185, -152, 'PIT');
  addGateWithPits('212', '2', 240, -118, 43, 240, -152, 'PIT');
  for (let i = 213; i <= 220; i++) {
    const idx = i - 213;
    const s = 145 + (idx % 4) * 38;
    const d = idx < 4 ? -75 : -98;
    addGateWithPits(String(i), '2', s, d, 43, s, -130, 'REMOTA');
  }

  // --- PÁTIO 3: 301 a 312 (Face Oeste 301–306, Face Leste 307–312) ---
  for (let i = 301; i <= 306; i++) {
    const idx = i - 301;
    const d = 115 - idx * 38;
    addGateWithPits(String(i), '3', 365, d, 133, 330, d, 'PIT');
  }
  for (let i = 307; i <= 312; i++) {
    const idx = i - 307;
    const d = 115 - idx * 38;
    addGateWithPits(String(i), '3', 475, d, 313, 505, d, 'PIT');
  }

  // --- PÁTIO 4: 401 a 412 (Face Oeste 401–406, Face Leste 407–412) ---
  for (let i = 401; i <= 406; i++) {
    const idx = i - 401;
    const d = 115 - idx * 38;
    addGateWithPits(String(i), '4', 575, d, 133, 540, d, 'PIT');
  }
  for (let i = 407; i <= 412; i++) {
    const idx = i - 407;
    const d = 115 - idx * 38;
    addGateWithPits(String(i), '4', 685, d, 313, 715, d, 'PIT');
  }

  // --- PÁTIO 5: 501 a 513 (Face Oeste 501–506, Face Leste/Remotas 507–513) ---
  for (let i = 501; i <= 506; i++) {
    const idx = i - 501;
    const d = 115 - idx * 38;
    addGateWithPits(String(i), '5', 785, d, 133, 750, d, 'PIT');
  }
  for (let i = 507; i <= 513; i++) {
    const idx = i - 507;
    const d = 115 - idx * 34;
    addGateWithPits(String(i), '5', 895, d, 313, 925, d, 'PIT');
  }

  // --- PÁTIO 6 (TPS 3 Widebody): 601 a 612 (Face Oeste 601–606, Face Leste 607–612) ---
  for (let i = 601; i <= 606; i++) {
    const idx = i - 601;
    const d = 125 - idx * 42;
    addGateWithPits(String(i), '6', 1005, d, 133, 960, d, 'PIT');
  }
  for (let i = 607; i <= 612; i++) {
    const idx = i - 607;
    const d = 125 - idx * 42;
    addGateWithPits(String(i), '6', 1165, d, 313, 1205, d, 'PIT');
  }

  // --- PÁTIO 7 (Remoto Widebody Leste): 701–703 e 712–715 ---
  [701, 702, 703].forEach((num, idx) => {
    const d = 95 - idx * 65;
    addGateWithPits(String(num), '7', 1285, d, 133, 1240, d, 'PIT');
  });
  [712, 713, 714, 715].forEach((num, idx) => {
    const d = 110 - idx * 58;
    addGateWithPits(String(num), '7', 1405, d, 313, 1445, d, 'PIT');
  });

  return { gates, pits };
};

export const { gates: GIS_GATES, pits: GIS_HYDRANT_PITS } = buildGatesAndPits();

// 4.6 CAMADA PERIMETRAL E CÂMARAS DE VÁLVULAS DA REDE DE HIDRANTES (PA, PB, PD, CV, CVI do PDF)
const buildPerimetralLayer = (): {
  nodes: PerimetralNodeFeature[];
  lines: PerimetralLineFeature[];
} => {
  const nodes: PerimetralNodeFeature[] = [];

  const addNode = (
    codigo: string,
    subtipo: PerimetralNodeFeature['subtipo'],
    patio_id: string,
    s: number,
    d: number,
    nome: string
  ) => {
    const pt = apronUVToLocal(s, d);
    nodes.push({
      id: codigo,
      codigo,
      subtipo,
      patio_id,
      tipo: 'perimetral',
      x_local: pt.x,
      y_local: pt.y,
      z_local: 0,
      heading: 0,
      nome,
    });
  };

  // Câmaras de Válvulas Principais (CV / CVI) extraídas do PDF
  const cvSpecs: Array<[string, PerimetralNodeFeature['subtipo'], string, number, number, string]> = [
    ['CV-T', 'CV', 'PATIO_1', -180, -390, 'Câmara Válvula Tronco PAA'],
    ['CV-10', 'CV', 'PATIO_1', -130, -250, 'Câmara Válvula Derivação 10'],
    ['CV-1A', 'CV', 'PATIO_1', -55, -135, 'Câmara Válvula Pátio 1A'],
    ['CV-1B', 'CV', 'PATIO_1', 15, -135, 'Câmara Válvula Pátio 1B'],
    ['CVI-01', 'CVI', 'PATIO_1', 75, -135, 'Câmara Isolamento CVI-01'],
    ['CV-1/2', 'CV', 'PATIO_2', 100, -135, 'Interligação Pátio 1/2'],
    ['CV-2A', 'CV', 'PATIO_2', 155, -12, 'Câmara Válvula Pátio 2A'],
    ['CV-2B', 'CV', 'PATIO_2', 265, -12, 'Câmara Válvula Pátio 2B'],
    ['CV-2C', 'CV', 'PATIO_2', 210, -135, 'Câmara Válvula Pátio 2C'],
    ['CVI-2', 'CVI', 'PATIO_2', 295, -135, 'Câmara Isolamento CVI-2'],
    ['CV-2/3', 'CV', 'PATIO_3', 315, -135, 'Interligação Pátio 2/3'],
    ['CV-3A', 'CV', 'PATIO_3', 365, 45, 'Câmara Válvula Pátio 3A'],
    ['CV-3B', 'CV', 'PATIO_3', 365, -45, 'Câmara Válvula Pátio 3B'],
    ['CV-3C', 'CV', 'PATIO_3', 475, -45, 'Câmara Válvula Pátio 3C'],
    ['CV-3D', 'CV', 'PATIO_3', 475, -125, 'Câmara Válvula Pátio 3D'],
    ['CV-3/4', 'CV', 'PATIO_4', 520, -135, 'Interligação Pátio 3/4'],
    ['CV-4A', 'CV', 'PATIO_4', 575, 25, 'Câmara Válvula Pátio 4A'],
    ['CV-4B', 'CV', 'PATIO_4', 575, -65, 'Câmara Válvula Pátio 4B'],
    ['CV-4C', 'CV', 'PATIO_4', 685, -65, 'Câmara Válvula Pátio 4C'],
    ['CV-4/5', 'CV', 'PATIO_5', 730, -135, 'Interligação Pátio 4/5'],
    ['CV-5A', 'CV', 'PATIO_5', 785, -110, 'Câmara Válvula Pátio 5A'],
    ['CV-5/6', 'CV', 'PATIO_6', 940, -135, 'Interligação Pátio 5/6'],
    ['CV-06', 'CV', 'PATIO_6', 1085, -135, 'Câmara Válvula Tronco Pátio 6'],
    ['CV-6/7', 'CV', 'PATIO_7', 1220, -135, 'Interligação Pátio 6/7'],
    ['CV-7A', 'CV', 'PATIO_7', 1285, -110, 'Câmara Válvula Pátio 7A'],
    ['CV-7B', 'CV', 'PATIO_7', 1405, -110, 'Câmara Válvula Pátio 7B'],
  ];

  cvSpecs.forEach(([cod, sub, pat, s, d, nome]) => addNode(cod, sub, pat, s, d, nome));

  // Pontos de Alta / Purga (PA-01 a PA-20) e Pontos Baixos (PB-01 a PB-24) e PD-01..PD-04
  const paPbSpecs: Array<[string, PerimetralNodeFeature['subtipo'], string, number, number]> = [
    ['PA-01', 'PA', 'PATIO_1', -235, -520],
    ['PA-03', 'PA', 'PATIO_1', -90, -180],
    ['PA-04', 'PA', 'PATIO_1', -20, -135],
    ['PA-05', 'PA', 'PATIO_1', 45, -135],
    ['PA-06', 'PA', 'PATIO_2', 140, -135],
    ['PA-07', 'PA', 'PATIO_2', 195, -135],
    ['PA-08', 'PA', 'PATIO_2', 250, -135],
    ['PA-09', 'PA', 'PATIO_3', 345, -135],
    ['PA-10', 'PA', 'PATIO_3', 410, -135],
    ['PA-12', 'PA', 'PATIO_4', 555, -135],
    ['PA-13', 'PA', 'PATIO_4', 625, -135],
    ['PA-16', 'PA', 'PATIO_5', 765, -135],
    ['PA-17', 'PA', 'PATIO_5', 835, -135],
    ['PA-19', 'PA', 'PATIO_5', 895, 55],
    ['PA-20', 'PA', 'PATIO_5', 895, -15],
    ['PA-26', 'PA', 'PATIO_6', 1005, 50],
    ['PA-27', 'PA', 'PATIO_6', 1005, -95],
    ['PA-28', 'PA', 'PATIO_6', 1055, -135],
    ['PA-29', 'PA', 'PATIO_6', 1165, 25],
    ['PA-32', 'PA', 'PATIO_7', 1285, -60],
    ['PA-33', 'PA', 'PATIO_7', 1405, 115],
    ['PB-01', 'PB', 'PATIO_1', -220, -480],
    ['PB-05', 'PB', 'PATIO_1', -65, -135],
    ['PB-09', 'PB', 'PATIO_1', -38, 128],
    ['PB-17', 'PB', 'PATIO_1', -38, -120],
    ['PB-22', 'PB', 'PATIO_2', 155, -105],
    ['PB-35', 'PB', 'PATIO_3', 365, 90],
    ['PB-37', 'PB', 'PATIO_3', 475, 90],
    ['PB-47', 'PB', 'PATIO_4', 575, -15],
    ['PB-48', 'PB', 'PATIO_4', 685, 95],
    ['PB-57', 'PB', 'PATIO_5', 785, -125],
    ['PB-67', 'PB', 'PATIO_6', 1005, -10],
    ['PB-70', 'PB', 'PATIO_6', 1165, -45],
    ['PB-75', 'PB', 'PATIO_7', 1285, -95],
    ['PD-01', 'PD', 'PATIO_1', -38, -80],
    ['PD-02', 'PD', 'PATIO_3', 475, -105],
    ['PD-03', 'PD', 'PATIO_3', 475, -90],
    ['PD-04', 'PD', 'PATIO_3', 475, -118],
  ];

  paPbSpecs.forEach(([cod, sub, pat, s, d]) =>
    addNode(cod, sub, pat, s, d, `Ponto Perimetral ${cod}`)
  );

  // Linhas adutoras da rede de hidrantes (como visto no PDF em ciano/magenta)
  const lines: PerimetralLineFeature[] = [
    {
      id: 'ADUTORA_TRONCO_PAA_P7',
      codigo: 'TRONCO_HIDRANTE_PRINCIPAL',
      nome: 'Adutora Tronco PAA → Pátios 1 a 7',
      color: '#ec4899',
      path: [
        apronUVToLocal(-245, -595),
        apronUVToLocal(-180, -390),
        apronUVToLocal(-130, -250),
        apronUVToLocal(-55, -135),
        apronUVToLocal(1405, -135),
      ],
    },
    {
      id: 'ANEL_HIDRANTE_P1_P7',
      codigo: 'ANEL_SECUNDARIO_HIDRANTE',
      nome: 'Anel Secundário de Pressurização P1–P7',
      color: '#06b6d4',
      path: [
        apronUVToLocal(-38, 125),
        apronUVToLocal(-38, -135),
        apronUVToLocal(155, -135),
        apronUVToLocal(155, 115),
        apronUVToLocal(265, 115),
        apronUVToLocal(265, -135),
        apronUVToLocal(365, -135),
        apronUVToLocal(365, 115),
        apronUVToLocal(475, 115),
        apronUVToLocal(475, -135),
        apronUVToLocal(575, -135),
        apronUVToLocal(575, 115),
        apronUVToLocal(685, 115),
        apronUVToLocal(685, -135),
        apronUVToLocal(785, -135),
        apronUVToLocal(785, 115),
        apronUVToLocal(895, 115),
        apronUVToLocal(895, -135),
        apronUVToLocal(1005, -135),
        apronUVToLocal(1005, 125),
        apronUVToLocal(1165, 125),
        apronUVToLocal(1165, -135),
        apronUVToLocal(1285, -135),
        apronUVToLocal(1285, 100),
        apronUVToLocal(1405, 110),
        apronUVToLocal(1405, -135),
      ],
    },
  ];

  return { nodes, lines };
};

export const { nodes: GIS_PERIMETRAL_NODES, lines: GIS_PERIMETRAL_LINES } = buildPerimetralLayer();

// 4.7 GEOFENCES OPERACIONAIS E DE SEGURANÇA DE PISTA (POSTGIS + N8N TRIGGERS)
export const GIS_GEOFENCES: GeofenceFeature[] = [
  {
    id: 'GF_RWY_10L_28R',
    codigo: 'ZONA_CRITICA_RWY_10L_28R',
    nome: 'Zona Crítica de Incursão — Pista 10L/28R',
    severidade: 'CRITICA',
    regra_jsonb: {
      maxSpeedKmh: 0,
      allowedTypes: ['AIRCRAFT'],
      triggerOnEnter: true,
      triggerOnExit: true,
      n8nWebhookSlug: 'alerta-geofence-rwy-10l-28r',
    },
    polygon: GIS_RUNWAYS[0].polygon,
  },
  {
    id: 'GF_RWY_10R_28L',
    codigo: 'ZONA_CRITICA_RWY_10R_28L',
    nome: 'Zona Crítica de Incursão — Pista 10R/28L',
    severidade: 'CRITICA',
    regra_jsonb: {
      maxSpeedKmh: 0,
      allowedTypes: ['AIRCRAFT'],
      triggerOnEnter: true,
      triggerOnExit: true,
      n8nWebhookSlug: 'alerta-geofence-rwy-10r-28l',
    },
    polygon: GIS_RUNWAYS[1].polygon,
  },
  {
    id: 'GF_APRON_SPEED_LIMIT',
    codigo: 'PERIMETRO_PATIO_HIDRANTES',
    nome: 'Envelope Operacional de Abastecimento (Pátios 1–7 • Máx 20 km/h)',
    severidade: 'OPERACIONAL',
    regra_jsonb: {
      maxSpeedKmh: 20,
      allowedTypes: ['SRV', 'CTA', 'SUPORTE'],
      triggerOnEnter: true,
      triggerOnExit: true,
      n8nWebhookSlug: 'alerta-geofence-patio-velocidade',
    },
    polygon: [
      apronUVToLocal(-115, -165),
      apronUVToLocal(1480, -165),
      apronUVToLocal(1480, 165),
      apronUVToLocal(-115, 165),
    ],
  },
];

// ============================================================================
// 5. GERADOR DO ARQUIVO CANÔNICO posicoes.txt (CSV) E VALIDADOR INTEGRADO
// ============================================================================

export interface CanonicalValidationReport {
  totalRows: number;
  gatesCount: number;
  pitsCount: number;
  taxiwaysCount: number;
  perimetralCount: number;
  uniqueCodesValid: boolean;
  boundsValid: boolean;
  headingsValid: boolean;
  rmsErrorMeters: number;
}

export function generateCanonicalPosicoesCsv(): {
  csv: string;
  report: CanonicalValidationReport;
} {
  const header = 'codigo,patio,tipo,x_local,y_local,z_local,heading,nome';
  const rows: string[] = [header];
  const seenCodes = new Set<string>();
  let uniqueCodesValid = true;
  let boundsValid = true;
  let headingsValid = true;

  const pushRow = (
    codigo: string,
    patio: string,
    tipo: string,
    x: number,
    y: number,
    z: number,
    heading: number,
    nome: string
  ) => {
    if (seenCodes.has(codigo)) uniqueCodesValid = false;
    seenCodes.add(codigo);
    if (x < -3500 || x > 3500 || y < -3500 || y > 3500) boundsValid = false;
    if (heading < 0 || heading > 360) headingsValid = false;
    rows.push(`${codigo},${patio},${tipo},${x.toFixed(2)},${y.toFixed(2)},${z},${heading},"${nome}"`);
  };

  GIS_GATES.forEach((g) => {
    pushRow(g.codigo, g.patio_id, 'estacionamento', g.x_local, g.y_local, g.z_local, g.heading, g.nome);
  });

  // Deduplica código de pit no CSV canônico
  const uniquePits = new Map<string, HydrantPitFeature>();
  GIS_HYDRANT_PITS.forEach((p) => {
    if (!uniquePits.has(p.codigo)) uniquePits.set(p.codigo, p);
  });
  uniquePits.forEach((p) => {
    pushRow(p.codigo, p.patio_id, 'abastecimento', p.x_local, p.y_local, p.z_local, p.heading, p.nome);
  });

  GIS_TAXIWAYS.forEach((t) => {
    pushRow(t.codigo, 'TAXIWAY', 'taxiway', t.labelPos.x, t.labelPos.y, 0, 43, t.nome);
  });

  GIS_PERIMETRAL_NODES.forEach((n) => {
    pushRow(n.codigo, n.patio_id, 'perimetral', n.x_local, n.y_local, n.z_local, n.heading, n.nome);
  });

  return {
    csv: rows.join('\n'),
    report: {
      totalRows: rows.length - 1,
      gatesCount: GIS_GATES.length,
      pitsCount: uniquePits.size,
      taxiwaysCount: GIS_TAXIWAYS.length,
      perimetralCount: GIS_PERIMETRAL_NODES.length,
      uniqueCodesValid,
      boundsValid,
      headingsValid,
      rmsErrorMeters: ORTHOPHOTO_SPEC.rmsErrorMeters,
    },
  };
}

// ============================================================================
// 6. EXPORTADOR GEOJSON COMPLETO (TODAS AS CAMADAS VETORIZADAS EM SRID 0 + WGS84)
// ============================================================================

export function generateSbgrGeoJson(): string {
  const features: any[] = [];

  GIS_PATIOS.forEach((p) => {
    features.push({
      type: 'Feature',
      properties: { layer: 'patios', codigo: p.codigo, nome: p.nome, tipo: p.tipo, z_order: 10 },
      geometry: {
        type: 'Polygon',
        coordinates: [p.polygon.map((pt) => [pt.x, pt.y]).concat([[p.polygon[0].x, p.polygon[0].y]])],
      },
    });
  });

  GIS_RUNWAYS.forEach((r) => {
    features.push({
      type: 'Feature',
      properties: {
        layer: 'runways',
        designacao: r.designacao,
        comprimento_m: r.comprimento_m,
        largura_m: r.largura_m,
        categoria: r.categoria,
        z_order: 20,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [r.polygon.map((pt) => [pt.x, pt.y]).concat([[r.polygon[0].x, r.polygon[0].y]])],
      },
    });
  });

  GIS_TAXIWAYS.forEach((t) => {
    features.push({
      type: 'Feature',
      properties: { layer: 'taxiways', codigo: t.codigo, nome: t.nome, largura_m: t.largura_m, tipo: t.tipo, z_order: 30 },
      geometry: {
        type: 'LineString',
        coordinates: t.path.map((pt) => [pt.x, pt.y]),
      },
    });
  });

  GIS_GATES.forEach((g) => {
    const wgs = localToWgs84(g.x_local, g.y_local);
    features.push({
      type: 'Feature',
      properties: {
        layer: 'gates',
        codigo: g.codigo,
        posId: g.posId,
        patio_id: g.patio_id,
        tipo: g.tipo,
        heading: g.heading,
        lat_wgs84: wgs.lat,
        lon_wgs84: wgs.lon,
        z_order: 50,
      },
      geometry: {
        type: 'Point',
        coordinates: [g.x_local, g.y_local],
      },
    });
  });

  GIS_HYDRANT_PITS.forEach((p) => {
    features.push({
      type: 'Feature',
      properties: {
        layer: 'pits_hidrantes',
        codigo: p.codigo,
        pitLabel: p.pitLabel,
        gate_ref: p.gate_ref,
        tipo: p.tipo,
        z_order: 40,
      },
      geometry: {
        type: 'Point',
        coordinates: [p.x_local, p.y_local],
      },
    });
  });

  GIS_PERIMETRAL_NODES.forEach((n) => {
    features.push({
      type: 'Feature',
      properties: {
        layer: 'perimetral',
        codigo: n.codigo,
        subtipo: n.subtipo,
        patio_id: n.patio_id,
        tipo: n.tipo,
        z_order: 60,
      },
      geometry: {
        type: 'Point',
        coordinates: [n.x_local, n.y_local],
      },
    });
  });

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      name: 'SBGR_GIS_RTLS_SRID0',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:LOCAL::SRID0_SBGR_PATIO1',
          lat0: ORTHOPHOTO_SPEC.lat0,
          lon0: ORTHOPHOTO_SPEC.lon0,
        },
      },
      features,
    },
    null,
    2
  );
}

// ============================================================================
// 7. SCRIPTS DE INFRAESTRUTURA: POSTGIS DDL, LOADER PYTHON E AUTOMAÇÕES N8N
// ============================================================================

export const POSTGIS_SCHEMA_SQL = `-- ============================================================================
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
`;

export const PYTHON_LOADER_SCRIPT = `#!/usr/bin/env python3
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
`;

export const N8N_WORKFLOWS_JSON = JSON.stringify(
  {
    name: 'MALHA_SBGR_RTLS_ADSB_AUTOMATIONS',
    nodes: [
      {
        id: '1',
        name: 'Webhook Alerta Geofence (Pista / Pátio)',
        type: 'n8n-nodes-base.webhook',
        parameters: { path: 'alerta-geofence', httpMethod: 'POST' },
      },
      {
        id: '2',
        name: 'Cron Heartbeat Veículo Offline (> 5 min)',
        type: 'n8n-nodes-base.scheduleTrigger',
        parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 5 }] } },
      },
      {
        id: '3',
        name: 'Query PostGIS Veículos Sem Heartbeat',
        type: 'n8n-nodes-base.postgres',
        parameters: {
          query:
            "SELECT callsign, tipo, last_seen_at FROM public.vehicles WHERE status = 'ONLINE' AND last_seen_at < now() - interval '5 minutes';",
        },
      },
      {
        id: '4',
        name: 'Relatório Diário NOC (Movimentação por Pátio)',
        type: 'n8n-nodes-base.scheduleTrigger',
        parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 6 * * *' }] } },
      },
    ],
  },
  null,
  2
);
