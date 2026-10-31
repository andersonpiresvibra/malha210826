# Mapa Tático do Aeródromo SBGR & Telemetria GPS de Viaturas

Implementação da aba **Mapa** na seção **Aeródromo** utilizando o **Google Maps Platform** com isolamento visual e geográfico restrito ao perímetro interno de Guarulhos (SBGR), substituindo a planta técnica confidencial poluída por um mapa de satélite limpo, interativo e georreferenciado para rastreamento de frotas (CTA/SRV) em tempo real via dispositivos móveis.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Como resolvemos o problema do "Mapa Limpo" e Sigilo Industrial:**
> Em vez de exibir o arquivo PDF/CAD original (que contém linhas de tubulação confidenciais, válvulas `CV/PB` e círculos amarelos fixos sobrepostos), utilizaremos a imagem de satélite oficial e limpa do **Google Maps Platform** combinada com uma **Máscara Poligonal de Perímetro (Geofence Mask)**. Tudo o que estiver fora do muro patrimonial de SBGR receberá um recorte escuro/neutro (exatamente como o recorte da sua planta), mantendo o interior do aeroporto 100% limpo e livre de tubulações.
> Os **Pits de Abastecimento** (ex.: `207-1`, `207-2`) mapeados a partir da sua referência serão convertidos em dados digitais opcionais: o mapa inicia totalmente limpo e você pode ativar/desativar camadas (Posições, Sub-Pits ou Viaturas) com um clique.

- **Decisão Confirmada 1 — Estrutura em Abas (`Posições` | `Mapa`)**: A barra superior da seção **Aeródromo** ganhará o seletor principal alternando entre a visão atual de **Posições** (Grade/Tabela) e a nova visão **Mapa** em tela cheia.
- **Decisão Confirmada 2 — Limitação Estrita ao Sítio Aeroportuário (SBGR)**: Aplicação simultânea de bloqueio de câmera (`strictBounds: true` nas coordenadas exatas de SBGR), trava de zoom mínimo/máximo (`minZoom: 14.5`, `maxZoom: 20`) e polígono de máscara externa para impedir visualização ou navegação fora dos limites internos do aeroporto.
- **Decisão Confirmada 3 — Rastreamento Mobile em Tempo Real + Modo Simulação**: Suporte nativo ao GPS de smartphones/tablets dos operadores (`navigator.geolocation.watchPosition`) sincronizado via **Supabase Realtime**, acompanhado de um simulador de deslocamento de frotas no pátio para testes imediatos em desktop.

---

### 1. Overview & Core Concept

- **O que entrega**: Um Centro de Controle Operacional (NOC) georreferenciado dentro da seção **Aeródromo**, permitindo visualizar os Pátios 1 a 7 de SBGR sem poluição visual, acompanhar a ocupação das posições em tempo real, consultar qual sub-pit (`-1`, `-2`, `-3`, `-4`) atende cada posição e rastrear a localização exata de cada viatura (Servidor SRV ou Caminhão Tanque CTA) pelo celular/tablet do operador.
- **Público-Alvo / Persona**: Líderes de Turno (LTs), Controladores de Malha no NOC (visão gerencial de pátio) e Operadores de Abastecimento em pista (transmissão automática de GPS pelo navegador do dispositivo móvel).
- **Valor Principal**: Elimina o uso de plantas estáticas confidenciais poluídas, garante conformidade de segurança operacional e reduz o tempo de resposta no acionamento da viatura mais próxima de cada aeronave.

---

### 2. User Experience & Visual Design

- **Fluxos Principais do Usuário**:
  1. **Alternância Rápida Posições ↔ Mapa**: No cabeçalho do Aeródromo, o usuário alterna entre `POSIÇÕES` (visão de cards/tabela) e `MAPA` (visão geográfica interativa de SBGR). Os filtros de Pátio (`TODOS`, `P1` a `P7`, `PVIP`) e a barra de busca continuam funcionando em ambas as abas — clicar em `P2` no modo Mapa move suavemente a câmera para o Pátio 2.
  2. **Controle de Camadas (Mapa Limpo por Padrão)**: Uma barra de ferramentas tática flutuante permite ligar/desligar individualmente:
     - **Viaturas (GPS Live)**: Exibe os veículos SRV e CTA em movimento no pátio.
     - **Posições de Aeronaves**: Exibe os marcadores das posições (`101` a `715`) com código de cores semântico do status atual do voo.
     - **Sub-Pits de Hidrante (`-1 / -2`)**: Oculto por padrão para manter o mapa limpo; quando ativado (ou ao clicar em uma posição como a `207`), exibe os pontos de conexão (`207-1`, `207-2`, etc.) para auxiliar na escolha do pit ideal conforme a envergadura da aeronave.
     - **Recorte de Perímetro (Máscara SBGR)**: Destaca apenas a área interna do aeroporto, ocultando os bairros vizinhos ao redor de Guarulhos.
  3. **Transmissão GPS Mobile (Rastreador de Viatura)**: O operador acessando pelo celular/tablet seleciona o número da sua frota (ex.: `SRV-2104` ou `CTA-1408`) e ativa o botão **"Transmitir GPS da Viatura"**. O sistema valida se o dispositivo está dentro da cerca virtual (Geofence) de SBGR e transmite posição, velocidade e rumo em tempo real para todos os terminais conectados.
  4. **Inspeção de Posição e Viatura**: Clicar em uma viatura ou posição no mapa abre um painel lateral/card tático exibindo operador, voo designado, prefixo da aeronave, sub-pits disponíveis na posição (ex.: `207-1`, `207-2`) e telemetria de deslocamento.

- **Identidade Visual & Tema (Dark Mode Enterprise NOC)**:
  - *Direção Estética*: Interface tática de controle de solo aeroportuário (Ground Control NOC), superfície escura de alto contraste para turnos noturnos e zero poluição visual.
  - *Paleta de Cores & Semântica*:
    - Superfícies estruturais em `slate-950` (`#020617`) e `slate-900` (`#0f172a`) com bordas de `1px` em `slate-800`.
    - **Esmeralda (`#10b981`)**: Viaturas em abastecimento ativo / GPS online dentro do perímetro.
    - **Azul (`#3b82f6`)**: Viaturas designadas em deslocamento para a posição.
    - **Âmbar (`#f59e0b`)**: Posições em fila/aproximação ou visualização de sub-pits de hidrante.
    - **Vermelho (`#ef4444`)**: Alerta de violação de perímetro (Geofence) ou posição interditada (`OFF`).
  - *Tipografia & Hierarquia*: Números de frotas, coordenadas, velocidades (`km/h`), horários de calço e códigos de posições/pits renderizados estritamente em fonte monoespaçada com algarismos tabulares (`font-mono tabular-nums`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Google Maps Híbrido/Satélite + Máscara Poligonal Invertida vs. Imagem Estática do PDF**
  - *Abordagem Escolhida*: Renderizar o Google Maps (`@vis.gl/react-google-maps`) em modo satélite limpo (`satellite` sem rótulos comerciais externos) com um polígono invertido cobrindo a área externa ao perímetro patrimonial de SBGR e `restriction: { latLngBounds, strictBounds: true }`.
  - *Por quê*: Remove 100% das linhas de tubulação confidenciais e círculos amarelos fixos do PDF, mantém o aspecto visual isolado apenas ao formato interno do aeroporto e permite usar coordenadas GPS reais (`latitude`/`longitude`) dos celulares dos operadores sem distorções.
  - *Alternativas Consideradas*: Usar o PDF recortado como imagem de fundo foi descartado porque ele possui as tubulações sigilosas gravadas na imagem e não possui projeção geográfica real compatível com o GPS dos celulares.

- **Decisão 2: Catálogo Digital de Sub-Pits (`207-1`, `207-2`) Sob Demanda**
  - *Abordagem Escolhida*: Extrair a relação de pits de abastecimento por posição (`101-1`..`715-4`) e disponibilizá-la como metadado interativo de cada posição e camada opcional desligada por padrão.
  - *Por quê*: Preserva a inteligência operacional do documento (saber quais pits existem na posição `207`, `402`, `601`, etc. e permitir selecionar qual pit está em uso no abastecimento) sem poluir o mapa com centenas de círculos amarelos simultâneos.

- **Decisão 3: Telemetria em Tempo Real via Supabase Realtime Broadcast + Geolocation API**
  - *Abordagem Escolhida*: Utilizar o canal `sbgr-vehicle-telemetry` do Supabase Realtime combinado com a API `navigator.geolocation.watchPosition` do navegador mobile e um modo de simulação de pátio integrado.
  - *Por quê*: Permite atualização sub-segundo da posição das viaturas na tela sem bloquear a UI (Zero UI-Blocking) e sem exigir instalação de aplicativo nativo nas frotas (funciona direto no Chrome/Safari do celular ou tablet corporativo).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Diagrama de Arquitetura e Componentes**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SEÇÃO AERÓDROMO (SBGR NOC)                            │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Subheader Portal: [ABA: POSIÇÕES | ABA: MAPA] • [P1..P7] • [BUSCA]    │  │
│  └──────────────────┬───────────────────────────────────┬─────────────────┘  │
└─────────────────────┼───────────────────────────────────┼────────────────────┘
                      │                                   │
         ┌────────────▼────────────┐         ┌────────────▼────────────────────┐
         │   Visão de Posições     │         │   Visão Mapa Tático SBGR        │
         │   (Grade / Tabela)      │         │  (@vis.gl/react-google-maps)    │
         └─────────────────────────┘         └────────────┬────────────────────┘
                                                          │
                 ┌────────────────────────────────────────┼────────────────────┐
                 ▼                                        ▼                    ▼
┌─────────────────────────────────┐      ┌────────────────────────┐  ┌─────────────────────────┐
│ Camada de Contenção & Geofence  │      │ Camada de Posições &   │  │ Camada de Viaturas GPS  │
│ • strictBounds (Limites SBGR)   │      │ Sub-Pits (P1 a P7)     │  │ (CTA / SRV Realtime)    │
│ • Polígono de Máscara Externa   │      │ • Status do Voo Ativo  │  │ • Transmissor Mobile    │
│ • Validador Point-in-Polygon    │      │ • Seleção de Pit (-1/2)│  │ • Simulador de Frotas   │
└─────────────────────────────────┘      └───────────┬────────────┘  └────────────┬────────────┘
                                                     │                            │
                                                     └─────────────┬──────────────┘
                                                                   ▼
                                         ┌─────────────────────────────────────────────────────┐
                                         │        Supabase Realtime & Persistence Layer        │
                                         │ • Canal Broadcast: sbgr-vehicle-telemetry           │
                                         │ • Sincronização de Voos, Posições e Status de Frota │
                                         └─────────────────────────────────────────────────────┘
```

- **Modelo de Dados & Estado**:
  - **Perímetro e Geofence SBGR (`SBGR_BOUNDS` & `SBGR_PERIMETER_POLYGON`)**: Coordenadas geográficas de contenção estrita do sítio aeroportuário de Guarulhos (`north: -23.4120`, `south: -23.4520`, `west: -46.5020`, `east: -46.4420`) e vértices do polígono perimetral interno (Pátios 1 a 7, Pistas `10L/28R` e `10R/28L`, e vias de serviço).
  - **Mapeamento Geográfico de Pátios, Posições e Sub-Pits**: Coordenadas reais de cada pátio (`P1` a `P7` e `PVIP`), coordenadas das posições de estacionamento e lista de sub-pits de hidrante associados a cada posição (ex.: Posição `207` → `['207-1', '207-2']`, Posição `402` → `['402-1'..'402-6']`, conforme catálogo técnico de SBGR).
  - **Telemetria de Viaturas (`VehicleTelemetry`)**:
    - `vehicleId`: Identificador da frota (ex.: `SRV-2101`, `CTA-1405`).
    - `vehicleType`: `'SRV' | 'CTA'`.
    - `operatorName`: Nome de guerra do operador logado.
    - `assignedFlightId` / `assignedPositionId` / `selectedPitId`: Vínculo com a operação atual e qual sub-pit está conectado (ex.: `207-1`).
    - `lat`, `lng`, `heading`, `speedKmh`, `accuracy`: Dados brutos do GPS mobile.
    - `insidePerimeter`: Booleano calculado pelo motor de Geofence indicando se o veículo está dentro da área operacional de SBGR.
    - `source`: `'MOBILE_GPS' | 'SIMULATOR'`.

- **Mapeamento de Interações e Estados**:
  - **Troca de Aba (`Posições` ↔ `Mapa`)**: Mantém o filtro de Pátio (`P1`..`P7`) e o termo de busca sincronizados. Selecionar um pátio específico no cabeçalho reposiciona e ajusta o zoom da câmera do Google Maps diretamente sobre aquele pátio.
  - **Controles de Camada do Mapa**: Botões de alternância rápida (`Viaturas`, `Posições`, `Sub-Pits`, `Máscara de Perímetro`, ` Modo Satélite Limpo / Híbrido`) atualizam a visibilidade instantaneamente sem recarregar o mapa.
  - **Modo Rastreador Mobile (GPS Live)**: Ao ativar o compartilhamento de localização no celular, registra `navigator.geolocation.watchPosition({ enableHighAccuracy: true })`, verifica se a coordenada está dentro do polígono de SBGR, emite o pacote no canal Realtime do Supabase e exibe indicador de transmissão ativa; se o sinal GPS estiver fora de SBGR (ex.: operador testando fora do aeroporto), exibe aviso claro permitindo testar via modo Simulador no pátio.
