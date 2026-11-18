# APEX F1 2026 — Guia do Motor Gráfico 3D (.GLB & PBR)

Este diretório contém os modelos 3D dos carros de Fórmula 1 da temporada 2026.

## 🚀 Como Funciona o Pipeline 3D

O motor do jogo (`src/components/three/f1ModelLoader.ts`) opera com um pipeline híbrido inteligente:

1. **Tentativa de Carregamento (.GLB Realista):**
   - O motor busca um modelo 3D específico da equipe em `/models/cars/{teamId}.glb` (ex: `ferrari.glb`, `redbull.glb`, `mclaren.glb`).
   - Se não encontrar o específico da equipe, ele busca um chassi genérico em `/models/cars/f1-2026-base.glb`.
   - Suporta compressão **Google Draco** nativamente com decodificadores WASM localizados em `/public/draco/`.
2. **Fallback Procedural Automático (Zero Falhas):**
   - Se nenhum arquivo `.glb` for encontrado, o jogo **automaticamente** ativa o gerador paramétrico em Three.js (`buildF1Car2026`), que gera o carro matematicamente com materiais PBR (clearcoat automotivo, fibra de carbono, pneus Pirelli com compostos selecionáveis e halo).

## 📁 Nomes de Arquivos Suportados

Para adicionar modelos de alta definição com as liveries oficiais (estilo FormulaDream):

| Equipe | Modelo Oficial | Nome do Arquivo Esperado |
| :--- | :--- | :--- |
| Scuderia Ferrari HP | SF-26 | `ferrari.glb` |
| McLaren F1 Team | MCL40 | `mclaren.glb` |
| Mercedes-AMG Petronas | W17 | `mercedes.glb` |
| Oracle Red Bull Racing | RB22 | `redbull.glb` |
| Williams Racing | FW48 | `williams.glb` |
| Aston Martin Aramco | AMR26 | `aston_martin.glb` |
| BWT Alpine F1 Team | A526 | `alpine.glb` |
| MoneyGram Haas F1 Team | VF-26 | `haas.glb` |
| Visa Cash App RB | VCARB 03 | `vcarb.glb` |
| Audi F1 Team | R26 | `audi.glb` |
| Cadillac F1 Team | C26 | `cadillac.glb` |
| Chassi Base Universal | FIA 2026 Spec | `f1-2026-base.glb` |

## 🎨 Convenção de Nomes de Nós/Meshes (Para Materiais PBR Automáticos)

Se você exportar um modelo do Blender, 3ds Max ou Maya, nomeie as partes da seguinte forma para que o motor aplique automaticamente os materiais automotivos:

- `body`, `chassis`, `nose`, `sidepod`: Recebe pintura de lataria com **Clearcoat PBR** e a cor da equipe.
- `wing`, `floor`, `diffuser`, `suspension`: Recebe acabamento acetinado de **Fibra de Carbono**.
- `wheel`, `tire`: Recebe textura de pneu de borracha fosca.
- `wing_low_drag`, `wing_high_downforce`: Peças modulares que se ativam conforme a aerodinâmica escolhida pelo jogador!
