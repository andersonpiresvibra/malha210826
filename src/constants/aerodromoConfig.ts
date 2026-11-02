export type PositionType = 'PIT' | 'REMOTA';

export interface PositionMetadata {
    type: PositionType;
    patio: string;
}

export const POSITIONS_METADATA: Record<string, PositionMetadata> = {
    // PÁTIO 1
    '101L': { patio: '1', type: 'PIT' }, '101': { patio: '1', type: 'PIT' }, '101R': { patio: '1', type: 'PIT' },
    '102': { patio: '1', type: 'PIT' }, '103L': { patio: '1', type: 'PIT' }, '103R': { patio: '1', type: 'PIT' },
    '104': { patio: '1', type: 'PIT' }, '105L': { patio: '1', type: 'PIT' }, '105R': { patio: '1', type: 'PIT' },
    '106': { patio: '1', type: 'PIT' }, '107L': { patio: '1', type: 'PIT' }, '107R': { patio: '1', type: 'PIT' },
    '108L': { patio: '1', type: 'PIT' }, '108R': { patio: '1', type: 'PIT' }, '109': { patio: '1', type: 'PIT' },
    '110': { patio: '1', type: 'REMOTA' }, '111': { patio: '1', type: 'PIT' }, '112L': { patio: '1', type: 'PIT' },
    '112': { patio: '1', type: 'PIT' }, '112R': { patio: '1', type: 'PIT' }, '113': { patio: '1', type: 'PIT' },
    '113L': { patio: '1', type: 'PIT' }, '113R': { patio: '1', type: 'PIT' }, '114': { patio: '1', type: 'REMOTA' },
    '115': { patio: '1', type: 'REMOTA' },

    // PÁTIO 2
    '201': { patio: '2', type: 'PIT' }, '202': { patio: '2', type: 'PIT' }, '202L': { patio: '2', type: 'PIT' },
    '202R': { patio: '2', type: 'PIT' }, '203': { patio: '2', type: 'PIT' }, '204L': { patio: '2', type: 'PIT' },
    '204': { patio: '2', type: 'PIT' }, '204R': { patio: '2', type: 'PIT' }, '205': { patio: '2', type: 'PIT' },
    '206': { patio: '2', type: 'PIT' }, '207': { patio: '2', type: 'PIT' }, '208': { patio: '2', type: 'PIT' },
    '209': { patio: '2', type: 'PIT' }, '210': { patio: '2', type: 'PIT' }, '211L': { patio: '2', type: 'PIT' },
    '211': { patio: '2', type: 'PIT' }, '211R': { patio: '2', type: 'PIT' }, '212L': { patio: '2', type: 'PIT' },
    '212R': { patio: '2', type: 'PIT' },

    // PÁTIO 3
    '301': { patio: '3', type: 'PIT' }, '302L': { patio: '3', type: 'PIT' }, '302R': { patio: '3', type: 'PIT' },
    '303L': { patio: '3', type: 'PIT' }, '303R': { patio: '3', type: 'PIT' }, '304': { patio: '3', type: 'PIT' },
    '305': { patio: '3', type: 'PIT' }, '306': { patio: '3', type: 'PIT' }, '307': { patio: '3', type: 'PIT' },
    '308': { patio: '3', type: 'PIT' }, '309': { patio: '3', type: 'PIT' }, '310': { patio: '3', type: 'PIT' },
    '311': { patio: '3', type: 'PIT' }, '312': { patio: '3', type: 'PIT' },

    // PÁTIO 4
    '401': { patio: '4', type: 'PIT' }, '402L': { patio: '4', type: 'PIT' }, '402': { patio: '4', type: 'PIT' },
    '402R': { patio: '4', type: 'PIT' }, '403': { patio: '4', type: 'PIT' }, '404': { patio: '4', type: 'PIT' },
    '405': { patio: '4', type: 'PIT' }, '406': { patio: '4', type: 'PIT' }, '407': { patio: '4', type: 'PIT' },
    '408': { patio: '4', type: 'PIT' }, '409': { patio: '4', type: 'PIT' }, '410L': { patio: '4', type: 'PIT' },
    '410R': { patio: '4', type: 'PIT' }, '411': { patio: '4', type: 'PIT' }, '411L': { patio: '4', type: 'PIT' },
    '411R': { patio: '4', type: 'PIT' }, '412': { patio: '4', type: 'PIT' },

    // PÁTIO 5
    '503': { patio: '5', type: 'PIT' }, '504L': { patio: '5', type: 'PIT' }, '504': { patio: '5', type: 'PIT' },
    '504R': { patio: '5', type: 'PIT' }, '505': { patio: '5', type: 'PIT' }, '505R': { patio: '5', type: 'PIT' },
    '506': { patio: '5', type: 'PIT' }, '507L': { patio: '5', type: 'PIT' }, '507': { patio: '5', type: 'PIT' },
    '507R': { patio: '5', type: 'PIT' }, '508L': { patio: '5', type: 'PIT' }, '508R': { patio: '5', type: 'PIT' },
    '509L': { patio: '5', type: 'PIT' }, '509': { patio: '5', type: 'PIT' }, '509R': { patio: '5', type: 'PIT' },
    '510L': { patio: '5', type: 'PIT' }, '510R': { patio: '5', type: 'PIT' }, '510': { patio: '5', type: 'PIT' },
    '511L': { patio: '5', type: 'PIT' }, '511': { patio: '5', type: 'PIT' }, '511R': { patio: '5', type: 'PIT' },
    '512': { patio: '5', type: 'PIT' }, '513': { patio: '5', type: 'PIT' },
    '501L': { patio: '5', type: 'REMOTA' }, '502': { patio: '5', type: 'REMOTA' }, '502R': { patio: '5', type: 'REMOTA' },

    // PÁTIO 6
    '601L': { patio: '6', type: 'PIT' }, '601R': { patio: '6', type: 'PIT' }, '602L': { patio: '6', type: 'PIT' },
    '602R': { patio: '6', type: 'PIT' }, '603L': { patio: '6', type: 'PIT' }, '603R': { patio: '6', type: 'PIT' },
    '604L': { patio: '6', type: 'PIT' }, '604R': { patio: '6', type: 'PIT' }, '605L': { patio: '6', type: 'PIT' },
    '605R': { patio: '6', type: 'PIT' }, '606L': { patio: '6', type: 'PIT' }, '606': { patio: '6', type: 'PIT' },
    '606R': { patio: '6', type: 'PIT' }, '607L': { patio: '6', type: 'PIT' }, '607R': { patio: '6', type: 'PIT' },
    '608L': { patio: '6', type: 'PIT' }, '608R': { patio: '6', type: 'PIT' }, '609L': { patio: '6', type: 'PIT' },
    '609R': { patio: '6', type: 'PIT' }, '610L': { patio: '6', type: 'PIT' }, '610R': { patio: '6', type: 'PIT' },
    '611L': { patio: '6', type: 'PIT' }, '611R': { patio: '6', type: 'PIT' }, '612L': { patio: '6', type: 'PIT' },
    '612R': { patio: '6', type: 'PIT' },

    // PÁTIO 7
    '701L': { patio: '7', type: 'PIT' }, '701R': { patio: '7', type: 'PIT' }, '702L': { patio: '7', type: 'PIT' },
    '702R': { patio: '7', type: 'PIT' }, '703L': { patio: '7', type: 'PIT' }, '703R': { patio: '7', type: 'PIT' },
    '713L': { patio: '7', type: 'PIT' }, '713R': { patio: '7', type: 'PIT' }, '714L': { patio: '7', type: 'PIT' },
    '714R': { patio: '7', type: 'PIT' }, '715L': { patio: '7', type: 'PIT' }, '715R': { patio: '7', type: 'PIT' },

    // PVIP
    'V1': { patio: 'VIP', type: 'REMOTA' }, 'V2': { patio: 'VIP', type: 'REMOTA' }, 'V3': { patio: 'VIP', type: 'REMOTA' },
};

export const POSITIONS_BY_PATIO: Record<string, string[]> = Object.entries(POSITIONS_METADATA).reduce((acc, [id, meta]) => {
    if (!acc[meta.patio]) acc[meta.patio] = [];
    acc[meta.patio].push(id);
    return acc;
}, {} as Record<string, string[]>);

export const PATIO_LABELS = [
    { id: '1', label: 'P1' }, { id: '2', label: 'P2' }, { id: '3', label: 'P3' },
    { id: '4', label: 'P4' }, { id: '5', label: 'P5' }, { id: '6', label: 'P6' }, { id: '7', label: 'P7' }, { id: 'VIP', label: 'PVIP' }
];

// ============================================================================
// ARQUITETURA GIS & RTLS - PLANTA BAIXA DE ALTA PRECISÃO SBGR (WGS84 / DECEA)
// ============================================================================

export const SBGR_CENTER = { lat: -23.4275, lng: -46.4765 };

export const SBGR_STRICT_BOUNDS = {
    north: -23.4110,
    south: -23.4465,
    west: -46.5010,
    east: -46.4440,
};

export const SBGR_WORLD_MASK_OUTER = [
    { lat: -23.30, lng: -46.65 },
    { lat: -23.30, lng: -46.30 },
    { lat: -23.56, lng: -46.30 },
    { lat: -23.56, lng: -46.65 },
];

/**
 * Polígono patrimonial oficial do sítio aeroportuário de Guarulhos (SBGR)
 */
export const SBGR_PERIMETER_POLYGON = [
    { lat: -23.4310, lng: -46.4968 }, // Acesso Rod. Hélio Smidt / Oeste TECA
    { lat: -23.4242, lng: -46.4940 }, // Noroeste TECA / Pátio 1
    { lat: -23.4202, lng: -46.4858 }, // Norte TPS 1 / TPS 2
    { lat: -23.4175, lng: -46.4770 }, // Norte TPS 3 / Hangares
    { lat: -23.4152, lng: -46.4675 }, // Norte MRO / Base Aérea BAGRU
    { lat: -23.4145, lng: -46.4515 }, // Nordeste Cabeceira 28R
    { lat: -23.4218, lng: -46.4470 }, // Extremo Leste das Pistas
    { lat: -23.4308, lng: -46.4535 }, // Sudeste Cabeceira 28L
    { lat: -23.4368, lng: -46.4685 }, // Sul Central Pista 10R/28L
    { lat: -23.4432, lng: -46.4865 }, // Sudoeste Cabeceira 10R
    { lat: -23.4438, lng: -46.4932 }, // Sul PAA Vibra / Parque de Tanques
    { lat: -23.4365, lng: -46.4965 }, // Sudoeste Perimetral
];

/**
 * Presets de câmera GIS para navegação instantânea no aeródromo
 */
export const PATIO_CAMERA_VIEWS: Record<string, { lat: number; lng: number; zoom: number; heading: number }> = {
    ALL: { lat: -23.4275, lng: -46.4755, zoom: 15, heading: -22 },
    RUNWAYS: { lat: -23.4295, lng: -46.4720, zoom: 15, heading: -22 },
    '1': { lat: -23.4268, lng: -46.4872, zoom: 17, heading: -22 },
    '2': { lat: -23.4257, lng: -46.4835, zoom: 17, heading: -22 },
    '3': { lat: -23.4245, lng: -46.4802, zoom: 17, heading: -22 },
    '4': { lat: -23.4234, lng: -46.4773, zoom: 17, heading: -22 },
    '5': { lat: -23.4222, lng: -46.4746, zoom: 17, heading: -22 },
    '6': { lat: -23.4208, lng: -46.4715, zoom: 17, heading: -22 },
    '7': { lat: -23.4195, lng: -46.4682, zoom: 17, heading: -22 },
    VIP: { lat: -23.4184, lng: -46.4650, zoom: 17, heading: -22 },
};

// ============================================================================
// 1. PISTAS DE POUSO E DECOLAGEM (RUNWAYS 10L/28R E 10R/28L - AIP BRASIL DECEA)
// ============================================================================

export interface RunwayGeometry {
    id: string;
    designatorWest: string;
    designatorEast: string;
    legacyDesignator: string;
    dimensions: string;
    surface: string;
    usage: string;
    thrWest: { lat: number; lng: number; elevationFt: number; courseMag: string };
    thrEast: { lat: number; lng: number; elevationFt: number; courseMag: string };
    polygon: Array<{ lat: number; lng: number }>;
    blastPadWest: Array<{ lat: number; lng: number }>;
    blastPadEast: Array<{ lat: number; lng: number }>;
}

export const SBGR_RUNWAYS: RunwayGeometry[] = [
    {
        id: 'RWY_10L_28R',
        designatorWest: '10L',
        designatorEast: '28R',
        legacyDesignator: '09L / 27R',
        dimensions: '3.700m x 60m',
        surface: 'ASPH / CONC GROOVED (PCN 83/F/A/W/T)',
        usage: 'POUSOS E DECOLAGENS (HEAVY / CAT IIIA)',
        thrWest: { lat: -23.43194, lng: -46.48611, elevationFt: 2458, courseMag: '096°' },
        thrEast: { lat: -23.41917, lng: -46.45250, elevationFt: 2461, courseMag: '276°' },
        polygon: [
            { lat: -23.43166, lng: -46.48622 },
            { lat: -23.41889, lng: -46.45261 },
            { lat: -23.41945, lng: -46.45239 },
            { lat: -23.43222, lng: -46.48600 },
        ],
        blastPadWest: [
            { lat: -23.43200, lng: -46.48715 },
            { lat: -23.43166, lng: -46.48622 },
            { lat: -23.43222, lng: -46.48600 },
            { lat: -23.43256, lng: -46.48693 },
        ],
        blastPadEast: [
            { lat: -23.41889, lng: -46.45261 },
            { lat: -23.41855, lng: -46.45168 },
            { lat: -23.41911, lng: -46.45146 },
            { lat: -23.41945, lng: -46.45239 },
        ],
    },
    {
        id: 'RWY_10R_28L',
        designatorWest: '10R',
        designatorEast: '28L',
        legacyDesignator: '09R / 27L',
        dimensions: '3.000m x 45m',
        surface: 'ASPH GROOVED (PCN 77/F/A/W/T)',
        usage: 'POUSOS PREFERENCIAIS / DECOLAGENS',
        thrWest: { lat: -23.43889, lng: -46.48722, elevationFt: 2425, courseMag: '096°' },
        thrEast: { lat: -23.42861, lng: -46.46028, elevationFt: 2450, courseMag: '276°' },
        polygon: [
            { lat: -23.43866, lng: -46.48731 },
            { lat: -23.42838, lng: -46.46037 },
            { lat: -23.42884, lng: -46.46019 },
            { lat: -23.43912, lng: -46.48713 },
        ],
        blastPadWest: [
            { lat: -23.43898, lng: -46.48815 },
            { lat: -23.43866, lng: -46.48731 },
            { lat: -23.43912, lng: -46.48713 },
            { lat: -23.43944, lng: -46.48797 },
        ],
        blastPadEast: [
            { lat: -23.42838, lng: -46.46037 },
            { lat: -23.42806, lng: -46.45953 },
            { lat: -23.42852, lng: -46.45935 },
            { lat: -23.42884, lng: -46.46019 },
        ],
    },
];

// ============================================================================
// 2. MALHA COMPLETA DE TAXIWAYS (PISTAS DE TÁXI E TAXILANES - CARTA ADC SBGR)
// ============================================================================

export interface TaxiwayGeometry {
    id: string;
    code: string;
    name: string;
    category: 'MAIN_PARALLEL' | 'RAPID_EXIT' | 'CONNECTOR' | 'APRON_TAXILANE';
    widthMeters: number;
    path: Array<{ lat: number; lng: number }>;
    labelPos: { lat: number; lng: number };
}

export const SBGR_TAXIWAYS: TaxiwayGeometry[] = [
    // --- TAXIWAYS PARALELAS PRINCIPAIS ---
    {
        id: 'TWY_E',
        code: 'E',
        name: 'TWY ECHO (Paralela Principal de Pátio)',
        category: 'MAIN_PARALLEL',
        widthMeters: 25,
        path: [
            { lat: -23.42945, lng: -46.48815 },
            { lat: -23.42725, lng: -46.48235 },
            { lat: -23.42435, lng: -46.47475 },
            { lat: -23.42165, lng: -46.46765 },
            { lat: -23.41840, lng: -46.45910 },
        ],
        labelPos: { lat: -23.42580, lng: -46.47855 },
    },
    {
        id: 'TWY_D',
        code: 'D',
        name: 'TWY DELTA (Paralela Norte Pista 10L/28R)',
        category: 'MAIN_PARALLEL',
        widthMeters: 25,
        path: [
            { lat: -23.43045, lng: -46.48720 },
            { lat: -23.42600, lng: -46.47550 },
            { lat: -23.42150, lng: -46.46368 },
            { lat: -23.41775, lng: -46.45380 },
        ],
        labelPos: { lat: -23.42375, lng: -46.46958 },
    },
    {
        id: 'TWY_M',
        code: 'M',
        name: 'TWY MIKE (Eixo Central Entre Pistas)',
        category: 'MAIN_PARALLEL',
        widthMeters: 25,
        path: [
            { lat: -23.43420, lng: -46.48685 },
            { lat: -23.42990, lng: -46.47555 },
            { lat: -23.42555, lng: -46.46412 },
            { lat: -23.42145, lng: -46.45335 },
        ],
        labelPos: { lat: -23.42772, lng: -46.46983 },
    },
    {
        id: 'TWY_B',
        code: 'B',
        name: 'TWY BRAVO (Paralela Norte Pista 10R/28L)',
        category: 'MAIN_PARALLEL',
        widthMeters: 23,
        path: [
            { lat: -23.43695, lng: -46.48765 },
            { lat: -23.43285, lng: -46.47685 },
            { lat: -23.42865, lng: -46.46582 },
            { lat: -23.42675, lng: -46.46082 },
        ],
        labelPos: { lat: -23.43075, lng: -46.47133 },
    },
    {
        id: 'TWY_A',
        code: 'A',
        name: 'TWY ALPHA (Ligação Sul / Cabeceira 10R)',
        category: 'MAIN_PARALLEL',
        widthMeters: 23,
        path: [
            { lat: -23.43889, lng: -46.48722 },
            { lat: -23.43695, lng: -46.48765 },
            { lat: -23.43420, lng: -46.48685 },
            { lat: -23.43194, lng: -46.48611 },
        ],
        labelPos: { lat: -23.43560, lng: -46.48725 },
    },
    // --- TAXILANES INTERNAS DE PÁTIO (FOXTROT / CHARLIE) ---
    {
        id: 'TWY_C',
        code: 'C',
        name: 'TWY CHARLIE (Taxilane Pátio 1 / TECA)',
        category: 'APRON_TAXILANE',
        widthMeters: 20,
        path: [
            { lat: -23.42945, lng: -46.48815 },
            { lat: -23.42755, lng: -46.48885 },
            { lat: -23.42580, lng: -46.48725 },
        ],
        labelPos: { lat: -23.42755, lng: -46.48885 },
    },
    {
        id: 'TWY_FN',
        code: 'FN',
        name: 'TAXILANE FOXTROT NORTE (Corredor de Pátios P2-P7)',
        category: 'APRON_TAXILANE',
        widthMeters: 20,
        path: [
            { lat: -23.42820, lng: -46.48680 },
            { lat: -23.42610, lng: -46.48130 },
            { lat: -23.42350, lng: -46.47445 },
            { lat: -23.42045, lng: -46.46645 },
        ],
        labelPos: { lat: -23.42480, lng: -46.47785 },
    },
    // --- SAÍDAS RÁPIDAS E INTERSEÇÕES PISTA 10L/28R ---
    {
        id: 'TWY_G',
        code: 'G',
        name: 'TWY GOLF (Cabeceira 10L)',
        category: 'CONNECTOR',
        widthMeters: 23,
        path: [
            { lat: -23.42945, lng: -46.48815 },
            { lat: -23.43045, lng: -46.48720 },
            { lat: -23.43194, lng: -46.48611 },
        ],
        labelPos: { lat: -23.43095, lng: -46.48680 },
    },
    {
        id: 'TWY_H',
        code: 'H',
        name: 'TWY HOTEL (Ligação Pátio 2 / 10L)',
        category: 'CONNECTOR',
        widthMeters: 23,
        path: [
            { lat: -23.42775, lng: -46.48365 },
            { lat: -23.42875, lng: -46.48270 },
            { lat: -23.43025, lng: -46.48165 },
        ],
        labelPos: { lat: -23.42935, lng: -46.48225 },
    },
    {
        id: 'TWY_J',
        code: 'J',
        name: 'TWY JULIET (Saída Rápida 10L/28R)',
        category: 'RAPID_EXIT',
        widthMeters: 23,
        path: [
            { lat: -23.42615, lng: -46.47945 },
            { lat: -23.42725, lng: -46.47875 },
            { lat: -23.42855, lng: -46.47715 },
        ],
        labelPos: { lat: -23.42785, lng: -46.47805 },
    },
    {
        id: 'TWY_K',
        code: 'K',
        name: 'TWY KILO (Ligação Pátio 4/5)',
        category: 'CONNECTOR',
        widthMeters: 23,
        path: [
            { lat: -23.42435, lng: -46.47475 },
            { lat: -23.42545, lng: -46.47405 },
            { lat: -23.42695, lng: -46.47300 },
        ],
        labelPos: { lat: -23.42610, lng: -46.47360 },
    },
    {
        id: 'TWY_L',
        code: 'L',
        name: 'TWY LIMA (Saída Rápida 10L / TPS 3)',
        category: 'RAPID_EXIT',
        widthMeters: 25,
        path: [
            { lat: -23.42265, lng: -46.47025 },
            { lat: -23.42375, lng: -46.46958 },
            { lat: -23.42535, lng: -46.46880 },
        ],
        labelPos: { lat: -23.42450, lng: -46.46920 },
    },
    {
        id: 'TWY_N',
        code: 'N',
        name: 'TWY NOVEMBER (Saída Rápida Leste 10L)',
        category: 'RAPID_EXIT',
        widthMeters: 25,
        path: [
            { lat: -23.42150, lng: -46.46368 },
            { lat: -23.42295, lng: -46.46245 },
        ],
        labelPos: { lat: -23.42220, lng: -46.46305 },
    },
    {
        id: 'TWY_P',
        code: 'P',
        name: 'TWY PAPA (Cabeceira 28R)',
        category: 'CONNECTOR',
        widthMeters: 25,
        path: [
            { lat: -23.41775, lng: -46.45380 },
            { lat: -23.41917, lng: -46.45250 },
            { lat: -23.42145, lng: -46.45335 },
        ],
        labelPos: { lat: -23.41845, lng: -46.45315 },
    },
    // --- TRANSPOSIÇÕES ENTRE PISTAS (10L/28R <-> TWY M <-> 10R/28L) ---
    {
        id: 'TWY_Q',
        code: 'Q',
        name: 'TWY QUEBEC (Transposição Oeste)',
        category: 'CONNECTOR',
        widthMeters: 23,
        path: [
            { lat: -23.43025, lng: -46.48165 },
            { lat: -23.43225, lng: -46.48175 },
            { lat: -23.43515, lng: -46.48290 },
            { lat: -23.43705, lng: -46.48238 },
        ],
        labelPos: { lat: -23.43365, lng: -46.48230 },
    },
    {
        id: 'TWY_R',
        code: 'R',
        name: 'TWY ROMEO (Saída Rápida 28L)',
        category: 'RAPID_EXIT',
        widthMeters: 23,
        path: [
            { lat: -23.42990, lng: -46.47555 },
            { lat: -23.43285, lng: -46.47685 },
            { lat: -23.43485, lng: -46.47660 },
        ],
        labelPos: { lat: -23.43385, lng: -46.47672 },
    },
    {
        id: 'TWY_S',
        code: 'S',
        name: 'TWY SIERRA (Transposição Central)',
        category: 'CONNECTOR',
        widthMeters: 23,
        path: [
            { lat: -23.42695, lng: -46.47300 },
            { lat: -23.42885, lng: -46.47280 },
            { lat: -23.43165, lng: -46.47370 },
            { lat: -23.43355, lng: -46.47318 },
        ],
        labelPos: { lat: -23.43025, lng: -46.47325 },
    },
    {
        id: 'TWY_T',
        code: 'T',
        name: 'TWY TANGO (Saída Rápida 10R)',
        category: 'RAPID_EXIT',
        widthMeters: 23,
        path: [
            { lat: -23.42535, lng: -46.46880 },
            { lat: -23.42715, lng: -46.46835 },
            { lat: -23.42995, lng: -46.46925 },
            { lat: -23.43175, lng: -46.46845 },
        ],
        labelPos: { lat: -23.42855, lng: -46.46880 },
    },
    {
        id: 'TWY_U',
        code: 'U',
        name: 'TWY UNIFORM (Saída Rápida Leste 10R)',
        category: 'RAPID_EXIT',
        widthMeters: 23,
        path: [
            { lat: -23.42865, lng: -46.46582 },
            { lat: -23.43035, lng: -46.46485 },
        ],
        labelPos: { lat: -23.42950, lng: -46.46533 },
    },
    {
        id: 'TWY_Z',
        code: 'Z',
        name: 'TWY ZULU (Cabeceira 28L)',
        category: 'CONNECTOR',
        widthMeters: 23,
        path: [
            { lat: -23.42415, lng: -46.46045 },
            { lat: -23.42675, lng: -46.46082 },
            { lat: -23.42861, lng: -46.46028 },
        ],
        labelPos: { lat: -23.42768, lng: -46.46055 },
    },
];

// ============================================================================
// 3. PLANTA BAIXA DOS TERMINAIS, PÍERES E INFRAESTRUTURA (TPS 1, 2, 3, TECA, PAA)
// ============================================================================

export interface AirportBuildingFootprint {
    id: string;
    name: string;
    shortLabel: string;
    type: 'TERMINAL' | 'CARGO' | 'MRO' | 'FUEL_FARM';
    polygon: Array<{ lat: number; lng: number }>;
    labelPos: { lat: number; lng: number };
}

export const SBGR_TERMINAL_BUILDINGS: AirportBuildingFootprint[] = [
    {
        id: 'BLD_TECA',
        name: 'TECA - Terminal de Cargas SBGR',
        shortLabel: 'TECA CARGAS',
        type: 'CARGO',
        polygon: [
            { lat: -23.4268, lng: -46.4922 },
            { lat: -23.4254, lng: -46.4886 },
            { lat: -23.4266, lng: -46.4880 },
            { lat: -23.4280, lng: -46.4916 },
        ],
        labelPos: { lat: -23.4267, lng: -46.4901 },
    },
    {
        id: 'BLD_TPS1',
        name: 'Terminal 1 (Pátio 1)',
        shortLabel: 'TPS 1',
        type: 'TERMINAL',
        polygon: [
            { lat: -23.4251, lng: -46.4879 },
            { lat: -23.4243, lng: -46.4858 },
            { lat: -23.4254, lng: -46.4853 },
            { lat: -23.4262, lng: -46.4874 },
        ],
        labelPos: { lat: -23.4252, lng: -46.4866 },
    },
    {
        id: 'BLD_TPS2_WEST_PIER',
        name: 'Terminal 2 - Píer Oeste (Pátios 2 e 3)',
        shortLabel: 'TPS 2 • PÍER OESTE',
        type: 'TERMINAL',
        polygon: [
            { lat: -23.4238, lng: -46.4838 },
            { lat: -23.4235, lng: -46.4829 },
            { lat: -23.4263, lng: -46.4817 },
            { lat: -23.4266, lng: -46.4826 },
        ],
        labelPos: { lat: -23.4251, lng: -46.4827 },
    },
    {
        id: 'BLD_TPS2_CORE',
        name: 'Terminal 2 - Corpo Central (Check-in A/B/C/D)',
        shortLabel: 'TERMINAL 2 (CENTRAL)',
        type: 'TERMINAL',
        polygon: [
            { lat: -23.4238, lng: -46.4844 },
            { lat: -23.4216, lng: -46.4785 },
            { lat: -23.4227, lng: -46.4780 },
            { lat: -23.4249, lng: -46.4839 },
        ],
        labelPos: { lat: -23.4232, lng: -46.4812 },
    },
    {
        id: 'BLD_TPS2_EAST_PIER',
        name: 'Terminal 2 - Píer Leste (Pátios 3 e 4)',
        shortLabel: 'TPS 2 • PÍER LESTE',
        type: 'TERMINAL',
        polygon: [
            { lat: -23.4225, lng: -46.4803 },
            { lat: -23.4222, lng: -46.4794 },
            { lat: -23.4250, lng: -46.4782 },
            { lat: -23.4253, lng: -46.4791 },
        ],
        labelPos: { lat: -23.4238, lng: -46.4792 },
    },
    {
        id: 'BLD_TPS3_PIER',
        name: 'Terminal 3 Internacional (Pátio 6 Widebody)',
        shortLabel: 'TERMINAL 3 (INTERNACIONAL)',
        type: 'TERMINAL',
        polygon: [
            { lat: -23.4188, lng: -46.4736 },
            { lat: -23.4182, lng: -46.4721 },
            { lat: -23.4221, lng: -46.4704 },
            { lat: -23.4227, lng: -46.4719 },
        ],
        labelPos: { lat: -23.4204, lng: -46.4720 },
    },
    {
        id: 'BLD_MRO',
        name: 'Hangares MRO / Manutenção (Pátio 7)',
        shortLabel: 'HANGARES MRO',
        type: 'MRO',
        polygon: [
            { lat: -23.4175, lng: -46.4702 },
            { lat: -23.4165, lng: -46.4674 },
            { lat: -23.4180, lng: -46.4667 },
            { lat: -23.4190, lng: -46.4695 },
        ],
        labelPos: { lat: -23.4177, lng: -46.4684 },
    },
    {
        id: 'BLD_PAA_VIBRA',
        name: 'PAA Vibra / BR Aviation - Parque de Abastecimento de Hidrantes',
        shortLabel: 'PAA VIBRA (TANQUES)',
        type: 'FUEL_FARM',
        polygon: [
            { lat: -23.4412, lng: -46.4926 },
            { lat: -23.4404, lng: -46.4905 },
            { lat: -23.4422, lng: -46.4898 },
            { lat: -23.4430, lng: -46.4919 },
        ],
        labelPos: { lat: -23.4417, lng: -46.4912 },
    },
];

// ============================================================================
// 4. POLÍGONOS DE LAGES DE CONCRETO DOS PÁTIOS (APRON SURFACES P1 A P7 + PVIP)
// ============================================================================

export interface PatioZone {
    patioId: string;
    label: string;
    color: string;
    polygon: Array<{ lat: number; lng: number }>;
}

export const PATIO_ZONES: PatioZone[] = [
    {
        patioId: '1',
        label: 'PÁTIO 1 (TPS 1)',
        color: '#3b82f6',
        polygon: [
            { lat: -23.4256, lng: -46.4888 },
            { lat: -23.4247, lng: -46.4855 },
            { lat: -23.4282, lng: -46.4842 },
            { lat: -23.4292, lng: -46.4875 },
        ],
    },
    {
        patioId: '2',
        label: 'PÁTIO 2 (PÍER OESTE)',
        color: '#10b981',
        polygon: [
            { lat: -23.4247, lng: -46.4854 },
            { lat: -23.4237, lng: -46.4827 },
            { lat: -23.4272, lng: -46.4814 },
            { lat: -23.4281, lng: -46.4841 },
        ],
    },
    {
        patioId: '3',
        label: 'PÁTIO 3 (CENTRAL)',
        color: '#06b6d4',
        polygon: [
            { lat: -23.4236, lng: -46.4826 },
            { lat: -23.4225, lng: -46.4796 },
            { lat: -23.4260, lng: -46.4783 },
            { lat: -23.4271, lng: -46.4813 },
        ],
    },
    {
        patioId: '4',
        label: 'PÁTIO 4 (PÍER LESTE)',
        color: '#8b5cf6',
        polygon: [
            { lat: -23.4224, lng: -46.4795 },
            { lat: -23.4214, lng: -46.4767 },
            { lat: -23.4249, lng: -46.4754 },
            { lat: -23.4259, lng: -46.4782 },
        ],
    },
    {
        patioId: '5',
        label: 'PÁTIO 5 (CONECTOR / REMOTAS)',
        color: '#f59e0b',
        polygon: [
            { lat: -23.4213, lng: -46.4766 },
            { lat: -23.4202, lng: -46.4737 },
            { lat: -23.4238, lng: -46.4724 },
            { lat: -23.4248, lng: -46.4753 },
        ],
    },
    {
        patioId: '6',
        label: 'PÁTIO 6 (TPS 3 WIDEBODY)',
        color: '#ec4899',
        polygon: [
            { lat: -23.4192, lng: -46.4742 },
            { lat: -23.4178, lng: -46.4702 },
            { lat: -23.4227, lng: -46.4683 },
            { lat: -23.4240, lng: -46.4722 },
        ],
    },
    {
        patioId: '7',
        label: 'PÁTIO 7 (REMOTO LESTE)',
        color: '#14b8a6',
        polygon: [
            { lat: -23.4182, lng: -46.4700 },
            { lat: -23.4170, lng: -46.4666 },
            { lat: -23.4215, lng: -46.4649 },
            { lat: -23.4226, lng: -46.4682 },
        ],
    },
    {
        patioId: 'VIP',
        label: 'PÁTIO VIP / BAGRU',
        color: '#eab308',
        polygon: [
            { lat: -23.4172, lng: -46.4664 },
            { lat: -23.4164, lng: -46.4640 },
            { lat: -23.4198, lng: -46.4628 },
            { lat: -23.4206, lng: -46.4651 },
        ],
    },
];

// ============================================================================
// 5. CATÁLOGO DE SUB-PITS DE HIDRANTE POR POSIÇÃO BASE (PLANTA DE HIDRANTES)
// ============================================================================

export const HYDRANT_PITS_BY_BASE_POS: Record<string, string[]> = {
    // Pátio 1
    '101': ['101-1', '101-2'],
    '102': ['102-1', '102-2'],
    '103': ['103-1', '103-2'],
    '104': ['104-1', '104-2'],
    '105': ['105-1', '105-2'],
    '106': ['106-1', '106-2'],
    '107': ['107-1', '107-2'],
    '108': ['108-1', '108-2'],
    '109': ['109-1', '109-2'],
    '110': ['110-1', '110-2'],
    '111': ['111-1', '111-2'],
    '112': ['112-1', '112-2'],
    '113': ['113-1', '113-2'],
    // Pátio 2
    '201': ['201-1', '201-2'],
    '202': ['202-1', '202-2'],
    '203': ['203-1', '203-2'],
    '204': ['204-1', '204-2'],
    '205': ['205-1', '205-2'],
    '206': ['206-1', '206-2'],
    '207': ['207-1', '207-2'],
    '208': ['208-1', '208-2'],
    '209': ['209-1', '209-2'],
    '210': ['210-1', '210-2'],
    '211': ['211-1', '211-2', '211-3', '211-4', '211-5'],
    '212': ['212-1', '212-2', '212-3', '212-4'],
    // Pátio 3
    '301': ['301-1', '301-2'],
    '302': ['302-1', '302-2', '302-3', '302-4'],
    '303': ['303-1', '303-2', '303-3', '303-L'],
    '304': ['304-1', '304-2'],
    '305': ['305-1', '305-2'],
    '306': ['306-1', '306-2'],
    '307': ['307-1', '307-2'],
    '308': ['308-1', '308-2'],
    '309': ['309-1', '309-2'],
    '310': ['310-1'],
    '311': ['311-1', '311-2'],
    '312': ['312-1', '312-2'],
    // Pátio 4
    '401': ['401-1', '401-2'],
    '402': ['402-1', '402-2', '402-3', '402-4', '402-5', '402-6'],
    '403': ['403-1', '403-2'],
    '404': ['404-1', '404-2'],
    '405': ['405-1', '405-2'],
    '406': ['406-1', '406-2'],
    '407': ['407-1', '407-2'],
    '408': ['408-1', '408-2'],
    '409': ['409-1', '409-2'],
    '410': ['410-1', '410-2', '410-3'],
    '411': ['411-1', '411-2'],
    '412': ['412-1', '412-2'],
    // Pátio 5
    '501': ['501-1', '501-2'],
    '502': ['502-1', '502-2'],
    '503': ['503-1', '503-2'],
    '504': ['504-1', '504-2'],
    '505': ['505-1', '505-2'],
    '506': ['506-1', '506-2'],
    '507': ['507-1', '507-2', '507-3', '507-4'],
    '508': ['508-1', '508-2', '508-3', '508-4'],
    '509': ['509-1', '509-2', '509-3', '509-4'],
    '510': ['510-1', '510-2', '510-3', '510-4'],
    '511': ['511-1', '511-2', '511-3', '511-4'],
    '512': ['512-1', '512-2'],
    '513': ['513-1', '513-2'],
    // Pátio 6 (Terminal 3 Widebody)
    '601': ['601-1', '601-2', '601-3', '601-4'],
    '602': ['602-1', '602-2', '602-3', '602-4'],
    '603': ['603-1', '603-2', '603-3', '603-4'],
    '604': ['604-1', '604-2', '604-3', '604-4'],
    '605': ['605-1', '605-2', '605-3', '605-4'],
    '606': ['606-1', '606-2', '606-3', '606-4'],
    '607': ['607-1', '607-2', '607-3', '607-4'],
    '608': ['608-1', '608-2', '608-3', '608-4'],
    '609': ['609-1', '609-2', '609-3', '609-4'],
    '610': ['610-1', '610-2', '610-3', '610-4'],
    '611': ['611-1', '611-2', '611-3', '611-4'],
    '612': ['612-1', '612-2', '612-3', '612-4'],
    // Pátio 7
    '701': ['701-1', '701-2', '701-3', '701-4'],
    '702': ['702-1', '702-2', '702-3', '702-4'],
    '703': ['703-1', '703-2', '703-3', '703-4'],
    '712': ['712-3', '712-4'],
    '713': ['713-1', '713-2', '713-3', '713-4'],
    '714': ['714-1', '714-2', '714-3', '714-4', '714-5'],
    '715': ['715-1', '715-2', '715-3', '715-4'],
};

// ============================================================================
// 6. GEOMETRIA DE ESTACIONAMENTO (STANDS, HEADING E LINHAS GUIA DE TAXILANE)
// ============================================================================

export interface PositionCoordinate {
    posId: string;
    patioId: string;
    lat: number;
    lng: number;
    heading: number; // Azimute da proa da aeronave estacionada
    leadInStart: { lat: number; lng: number }; // Ponto de derivação na Taxilane
    isSubStand: boolean; // True se for L/R secundária para evitar poluição visual em zoom baixo
}

/**
 * Constrói as coordenadas georreferenciadas de cada posição alinhadas ao eixo real 68° ENE de SBGR,
 * distribuindo as posições ao redor dos Píeres e Pátios Remotos sem sobreposição.
 */
const buildPositionCoordinates = (): Record<string, PositionCoordinate> => {
    const coords: Record<string, PositionCoordinate> = {};

    const registerStand = (
        posId: string,
        patioId: string,
        lat: number,
        lng: number,
        heading: number,
        leadOffsetLat: number,
        leadOffsetLng: number
    ) => {
        const isSubStand = /[LR]$/.test(posId) && POSITIONS_METADATA[posId.replace(/[LR]$/, '')] !== undefined;
        coords[posId] = {
            posId,
            patioId,
            lat,
            lng,
            heading,
            leadInStart: {
                lat: lat + leadOffsetLat,
                lng: lng + leadOffsetLng,
            },
            isSubStand,
        };
    };

    // PÁTIO 1: Distribuído em 3 fileiras organizadas ao sul do TPS 1 (eixo 68°)
    const p1List = POSITIONS_BY_PATIO['1'] || [];
    p1List.forEach((posId, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        // Avança ao longo do eixo 68° (dLng +, dLat +)
        const baseLat = -23.4263 - row * 0.00085 + col * 0.00014;
        const baseLng = -46.4882 + col * 0.00038 + row * 0.00028;
        registerStand(posId, '1', baseLat, baseLng, 338, -0.00032, 0.00012);
    });

    // PÁTIO 2: Face Oeste do Píer Oeste (201-206), Face Leste (207-210), Remotas Sul (211-212)
    const p2List = POSITIONS_BY_PATIO['2'] || [];
    p2List.forEach((posId, idx) => {
        if (idx < 9) {
            // Face Oeste do Píer Oeste (201 a 205)
            const lat = -23.4243 - idx * 0.00031;
            const lng = -46.4846 + idx * 0.00012;
            registerStand(posId, '2', lat, lng, 68, 0.00012, -0.00038);
        } else if (idx < 14) {
            // Face Leste do Píer Oeste (206 a 210)
            const k = idx - 9;
            const lat = -23.4262 + k * 0.00045;
            const lng = -46.4819 - k * 0.00016;
            registerStand(posId, '2', lat, lng, 248, -0.00012, 0.00038);
        } else {
            // Remotas 211 / 212 junto à TWY Echo
            const k = idx - 14;
            const lat = -23.4274 + k * 0.00016;
            const lng = -46.4841 + k * 0.00044;
            registerStand(posId, '2', lat, lng, 338, -0.00035, 0.00014);
        }
    });

    // PÁTIO 3: Conector Central e Face Oeste do Píer Leste (301 a 312)
    const p3List = POSITIONS_BY_PATIO['3'] || [];
    p3List.forEach((posId, idx) => {
        if (idx < 7) {
            // 301 a 305 (Oeste do Pátio 3)
            const lat = -23.4235 - idx * 0.00038;
            const lng = -46.4816 + idx * 0.00014;
            registerStand(posId, '3', lat, lng, 338, -0.00032, 0.00012);
        } else {
            // 306 a 312 (Face Oeste do Píer Leste)
            const k = idx - 7;
            const lat = -23.4256 + k * 0.00038;
            const lng = -46.4795 - k * 0.00014;
            registerStand(posId, '3', lat, lng, 68, 0.00012, -0.00038);
        }
    });

    // PÁTIO 4: Face Leste do Píer Leste (401 a 412)
    const p4List = POSITIONS_BY_PATIO['4'] || [];
    p4List.forEach((posId, idx) => {
        const half = Math.ceil(p4List.length / 2);
        if (idx < half) {
            const lat = -23.4224 - idx * 0.00033;
            const lng = -46.4785 + idx * 0.00013;
            registerStand(posId, '4', lat, lng, 248, -0.00012, 0.00036);
        } else {
            const k = idx - half;
            const lat = -23.4252 + k * 0.00035;
            const lng = -46.4762 - k * 0.00013;
            registerStand(posId, '4', lat, lng, 338, -0.00032, 0.00012);
        }
    });

    // PÁTIO 5: Conector T2-T3 (501-506) e Remotas Sul (507-513)
    const p5List = POSITIONS_BY_PATIO['5'] || [];
    p5List.forEach((posId, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const lat = -23.4214 - row * 0.00082 + col * 0.00013;
        const lng = -46.4761 + col * 0.00034 + row * 0.00025;
        registerStand(posId, '5', lat, lng, 338, -0.00030, 0.00012);
    });

    // PÁTIO 6: Terminal 3 Internacional Widebody (601-606 Face Oeste, 607-612 Face Leste)
    const p6List = POSITIONS_BY_PATIO['6'] || [];
    p6List.forEach((posId, idx) => {
        const half = Math.ceil(p6List.length / 2);
        if (idx < half) {
            // Face Oeste TPS 3 (601 a 606)
            const lat = -23.4193 - idx * 0.00032;
            const lng = -46.4735 + idx * 0.00013;
            registerStand(posId, '6', lat, lng, 68, 0.00012, -0.00040);
        } else {
            // Face Leste TPS 3 (607 a 612)
            const k = idx - half;
            const lat = -23.4228 + k * 0.00032;
            const lng = -46.4699 - k * 0.00013;
            registerStand(posId, '6', lat, lng, 248, -0.00012, 0.00040);
        }
    });

    // PÁTIO 7: Remotas Widebody Leste (701-703 e 713-715)
    const p7List = POSITIONS_BY_PATIO['7'] || [];
    p7List.forEach((posId, idx) => {
        const half = Math.ceil(p7List.length / 2);
        if (idx < half) {
            const lat = -23.4186 - idx * 0.00052;
            const lng = -46.4692 + idx * 0.00020;
            registerStand(posId, '7', lat, lng, 338, -0.00035, 0.00014);
        } else {
            const k = idx - half;
            const lat = -23.4212 + k * 0.00052;
            const lng = -46.4664 - k * 0.00020;
            registerStand(posId, '7', lat, lng, 338, -0.00035, 0.00014);
        }
    });

    // PÁTIO VIP / BAGRU
    const vipList = POSITIONS_BY_PATIO['VIP'] || [];
    vipList.forEach((posId, idx) => {
        const lat = -23.4178 - idx * 0.00065;
        const lng = -46.4652 + idx * 0.00025;
        registerStand(posId, 'VIP', lat, lng, 338, -0.00035, 0.00014);
    });

    return coords;
};

export const POSITION_COORDINATES = buildPositionCoordinates();

export interface HydrantPitPoint {
    id: string;
    pitId: string;
    basePosition: string;
    basePosId: string;
    wingHint: string;
    lat: number;
    lng: number;
}

export const getHydrantPitsForPosition = (posId: string): HydrantPitPoint[] => {
    const baseNum = posId.replace(/[LR]$/i, '');
    const pitIds = HYDRANT_PITS_BY_BASE_POS[baseNum] || [];
    const baseCoord = POSITION_COORDINATES[posId] || POSITION_COORDINATES[baseNum];
    if (!baseCoord || pitIds.length === 0) return [];

    return pitIds.map((pitId, index) => {
        const offsetAngle = (index / Math.max(1, pitIds.length)) * Math.PI - Math.PI / 2;
        const radiusLat = 0.00009;
        const radiusLng = 0.00012;
        const wingHint =
            pitIds.length === 2
                ? index === 0
                    ? 'Asa Esquerda / Narrowbody'
                    : 'Asa Direita / Widebody'
                : index < Math.ceil(pitIds.length / 2)
                ? `Asa Esquerda (Pit #${index + 1})`
                : `Asa Direita (Pit #${index + 1})`;
        return {
            id: `${posId}_${pitId}`,
            pitId,
            basePosition: posId,
            basePosId: baseNum,
            wingHint,
            lat: baseCoord.lat + Math.sin(offsetAngle) * radiusLat,
            lng: baseCoord.lng + Math.cos(offsetAngle) * radiusLng,
        };
    });
};

export const isPointInsideSbgrPerimeter = (lat: number, lng: number): boolean => {
    let inside = false;
    const poly = SBGR_PERIMETER_POLYGON;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].lat, yi = poly[i].lng;
        const xj = poly[j].lat, yj = poly[j].lng;
        const intersect = ((yi > lng) !== (yj > lng)) &&
            (lat < (xj - xi) * (lng - yi) / ((yj - yi) || 1e-9) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};
