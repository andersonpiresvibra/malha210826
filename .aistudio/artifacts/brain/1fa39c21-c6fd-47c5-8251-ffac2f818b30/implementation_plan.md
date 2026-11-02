# Plano de Implementação: Rotação Manual do Mapa & Reforma Completa do Tema Claro

## 1. Diagnóstico Técnico

Com base na análise do código e na captura de tela enviada, identificamos as causas exatas dos problemas relatados:

1. **Falta de Controles de Giro Manual e Corte Diagonal no Mapa (`InteractiveGoogleRouteMap.tsx`)**:
   - Atualmente a rotação do mapa responde apenas ao azimute automático (*Course-Up*). Não há botões para girar manualmente para a esquerda/direita nem suporte a giro via arraste com o botão direito do mouse (ou `Shift + Arraste`).
   - O palco rotacionado usa dimensões percentuais fixas (`w-[164%] h-[164%]`). Em monitores widescreen (16:9), `164%` da altura do container é menor do que a diagonal da tela, fazendo surgir triângulos vazios nos cantos superior esquerdo e inferior direito ao girar o mapa.
2. **Quebra de Contraste no Tema Claro (`src/index.css`, `DashboardHeader.tsx`, `App.tsx`)**:
   - No `src/index.css`, a regra `:root:not(.dark) [class*="h-16"][class*="border-b"]` captura acidentalmente o `<header>` principal (`DashboardHeader.tsx`) e força fundo cinza claro (`#e9eef5`), enquanto os textos do cabeçalho (`ANDERSON`, `21H43`, `DENS. 0.803`, `TEMP. 24.5°C`) e o botão `Google Drive` permanecem com texto branco (`text-white`), tornando-os ilegíveis.
   - Faltava a diretiva `@custom-variant dark (&:where(.dark, .dark *));` no `src/index.css` (obrigatória no Tailwind v4 para que utilitários `dark:*` respeitem a classe `.dark` no `<html>`).
   - No `src/App.tsx`, a seção `MAPA` (`<AerodromoMapView />`) não recebia a prop `isDarkMode={isDarkMode}`, mantendo o mapa e o subcabeçalho travados em `isDarkMode = true` mesmo quando o sistema estava no Tema Claro.

---

## 2. Escopo das Alterações

### A. Rotação Manual do Mapa (Esquerda / Direita) & Correção Geométrica 360°
- **Arquivo**: `src/components/live-tracking/InteractiveGoogleRouteMap.tsx`
  - **Controles Visuais de Giro no Mapa**:
    - Adicionar barra de controle flutuante compacta no canto superior direito do mapa contendo:
      - **Girar à Esquerda (`-15°`)**: botão com ícone de rotação anti-horária (clique simples gira `-15°`, segurar ou clicar repetidamente gira continuamente).
      - **Indicador de Proa / Bússola (`0° Norte` / `Course-Up`)**: exibe o ângulo atual em graus e permite alternar entre **Norte para Cima (`0°`)** e **Rota Automática (*Course-Up*)**.
      - **Girar à Direita (`+15°`)**: botão com ícone de rotação horária (`+15°`).
  - **Giro Livre com o Mouse**:
    - Suportar arraste com o **botão direito do mouse** (ou `Shift + botão esquerdo`) diretamente sobre o mapa para girar suavemente para a esquerda ou direita em tempo real, bloqueando o menu de contexto nativo no palco do mapa.
  - **Geometria sem Bordas Cortadas (Fim dos Triângulos Brancos)**:
    - Substituir o `w-[164%] h-[164%]` por cálculo dinâmico da diagonal real do viewport (`Math.ceil(Math.hypot(width, height)) + 80px`) centralizado com `translate(-50%, -50%) rotate(...)` e atualização automática via `ResizeObserver` + `leafletMap.invalidateSize()`, garantindo cobertura total de ponta a ponta em qualquer ângulo de 0° a 360°.

### B. Reforma Completa do Tema Claro Corporativo (Vibra / BR Aviation)
- **Arquivo**: `src/index.css`
  - Declarar `@custom-variant dark (&:where(.dark, .dark *));` logo após `@import "tailwindcss";`.
  - Refatorar as regras de `:root:not(.dark)` para o padrão **Tema Claro Corporativo de Alto Contraste**:
    - Superfícies limpas em branco (`#FFFFFF`) e cinza gelo (`#F4F7FA`) com bordas estruturais nítidas (`#CBD5E1`).
    - Tipografia primária em ardósia escuro (`#0F172A`) e secundária em `#475569` para máxima legibilidade diurna.
    - Destaques semânticos em **Verde Vibra (`#007A4D` / `#10B981`)** com texto branco puro em botões ativos.
    - Remover seletores genéricos destrutivos (como `[class*="h-16"][class*="border-b"]` que quebrava o cabeçalho principal e `button[class*="bg-white"]` que deixava botões invisíveis).
    - Estilizar controles do Leaflet (`.leaflet-bar`) tanto para o Tema Claro quanto para o Tema Escuro.
- **Arquivo**: `src/components/DashboardHeader.tsx`
  - Aplicar estilização explícita e de alto contraste para o Tema Claro Corporativo:
    - Cabeçalho claro estruturado (`bg-white border-slate-200 text-slate-900`) com insígnia verde institucional Vibra (`bg-[#007a4d] text-white`), nome do Líder de Turno em `text-slate-900`, cargo em `text-[#007a4d]`, relógio e telemetria (`DENS.` / `TEMP.`) em `text-slate-900` de alto contraste, e botão `Google Drive` com borda e tipografia legíveis nos dois temas.
- **Arquivos**: `src/App.tsx`, `src/components/AerodromoMapView.tsx`, `src/components/live-tracking/LiveTrackingModal.tsx`
  - Passar `isDarkMode={isDarkMode}` para `<AerodromoMapView />`, `<Aerodromo />`, `<GridOps />`, `<FlightRadarView />` e demais views no `src/App.tsx`.
  - Ajustar `AerodromoMapView.tsx` e `LiveTrackingModal.tsx` para que o subcabeçalho em linha única, o campo de busca, os botões de ação e o rodapé de telemetria tenham cores de alto contraste no Tema Claro e no Tema Escuro.
  - Exibir o mapa no **estilo claro diurno original** quando no Tema Claro (sem o filtro `.vagou-map-dark`) e no **estilo escuro tático** quando no Tema Escuro.

---

## 3. Verificação
- Testar a rotação manual do mapa pelos botões (`Girar Esquerda`, `Bússola/Norte`, `Girar Direita`) e pelo arraste com botão direito do mouse, garantindo que o arraste com botão esquerdo continue movendo o mapa perfeitamente na direção do cursor e sem cantos brancos cortados.
- Alternar entre Tema Claro e Tema Escuro validando a legibilidade completa do cabeçalho principal, menu lateral, subcabeçalho do mapa, tabelas operacionais e estilo diurno/noturno do mapa.
- Executar `lint_applet` e `compile_applet` garantindo zero erros de compilação.
