import type { ReactElement } from 'react'

import type { Destination } from '@/domain/model/Destination'
import type { TravelStyle } from '@/domain/model/QuizAnswers'

/**
 * Ilustracao vetorial do destino, gerada em codigo.
 *
 * Por que SVG em vez de foto: o repositorio nao tem banco de imagens licenciado.
 * A cena vetorial entrega identidade visual por destino, pesa alguns kilobytes
 * no bundle em vez de centenas por arquivo, nao faz requisicao de rede e nunca
 * aparece quebrada.
 *
 * A variacao nao e aleatoria: paleta, silhueta e posicao dos elementos saem de um
 * hash do `id`. O mesmo destino desenha sempre igual, e destinos diferentes nunca
 * saem iguais.
 *
 * Quando a Travion tiver as fotos, `DestinationCard` volta a preferir a imagem e
 * esta arte fica como fundo de carregamento e de falha.
 */

interface DestinationArtworkProps {
  destination: Destination
  className?: string
  /**
   * Some para leitor de tela. Ligado quando a foto do destino esta na frente e
   * ja carrega o texto alternativo: sem isso, o mesmo destino seria anunciado
   * duas vezes.
   */
  decorative?: boolean
}

/** Hash estavel de string. Determinismo importa: layout nao pode piscar entre renders. */
function hashId(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

interface Palette {
  skyTop: string
  skyBottom: string
  sun: string
  far: string
  mid: string
  near: string
  ground: string
  accent: string
}

/** Props comuns a toda cena. `skyFill` chega pronto porque o id do gradiente e por card. */
interface SceneProps {
  palette: Palette
  seed: number
  skyFill: string
}

/**
 * Tres familias de paleta, uma por estilo de viagem.
 *
 * Cada familia tem variantes para que dois destinos do mesmo estilo lado a lado
 * no resultado nao saiam com a mesma cor.
 */
const PALETTES: Record<TravelStyle, Palette[]> = {
  beach: [
    {
      skyTop: '#7ec8e3',
      skyBottom: '#ffd9a0',
      sun: '#ffb765',
      far: '#2e8b9e',
      mid: '#1f6f85',
      near: '#0f5468',
      ground: '#f0dcb4',
      accent: '#2f6d4f',
    },
    {
      skyTop: '#5bb3d4',
      skyBottom: '#ffe6c4',
      sun: '#ffcf7a',
      far: '#3aa0a8',
      mid: '#22808f',
      near: '#125f70',
      ground: '#f5e3c0',
      accent: '#357a52',
    },
    {
      skyTop: '#8fd4e8',
      skyBottom: '#ffc9a8',
      sun: '#ff9f6b',
      far: '#2694a6',
      mid: '#177585',
      near: '#0b5163',
      ground: '#efd9ac',
      accent: '#2b6446',
    },
  ],
  city: [
    {
      skyTop: '#2b3a63',
      skyBottom: '#e08a6a',
      sun: '#ffd27a',
      far: '#4a5680',
      mid: '#333d5e',
      near: '#1d2540',
      ground: '#141a2c',
      accent: '#ffd98a',
    },
    {
      skyTop: '#243352',
      skyBottom: '#d97f7f',
      sun: '#ffc98f',
      far: '#455073',
      mid: '#2e3853',
      near: '#1a2038',
      ground: '#121726',
      accent: '#ffe0a3',
    },
    {
      skyTop: '#35406b',
      skyBottom: '#f0a074',
      sun: '#ffdd94',
      far: '#525d88',
      mid: '#3a4468',
      near: '#212a48',
      ground: '#161c30',
      accent: '#ffd27a',
    },
  ],
  snow: [
    {
      skyTop: '#9fc2dd',
      skyBottom: '#f2e6e0',
      sun: '#fff3dc',
      far: '#c3d4e2',
      mid: '#8fa8bd',
      near: '#5f7488',
      ground: '#f4f7fa',
      accent: '#2f4a3d',
    },
    {
      skyTop: '#87b0d1',
      skyBottom: '#efe2da',
      sun: '#fff6e4',
      far: '#b8cbdc',
      mid: '#829cb3',
      near: '#556b80',
      ground: '#f7f9fb',
      accent: '#2a4438',
    },
    {
      skyTop: '#adcbe2',
      skyBottom: '#f6ece4',
      sun: '#fffaea',
      far: '#ccdae6',
      mid: '#9ab0c4',
      near: '#687d90',
      ground: '#f2f6f9',
      accent: '#33513f',
    },
  ],
}

/**
 * Estilo dominante do destino.
 *
 * Um destino pode servir a mais de um estilo (Miami e praia e cidade). A ordem de
 * precedencia escolhe o que rende cena mais reconhecivel: neve primeiro, porque
 * montanha e inconfundivel; praia depois; cidade como padrao.
 */
function dominantStyle(styles: TravelStyle[]): TravelStyle {
  if (styles.includes('snow')) return 'snow'
  if (styles.includes('beach')) return 'beach'
  return 'city'
}

// ---------------------------------------------------------------------------
// Cenas base
// ---------------------------------------------------------------------------

function BeachScene({ palette, seed, skyFill }: SceneProps) {
  const horizon = 168 + (seed % 3) * 6
  const sunX = 96 + (seed % 5) * 42
  const palmOnLeft = seed % 2 === 0

  return (
    <>
      <rect width="400" height="300" fill={skyFill} />
      <circle cx={sunX} cy={horizon - 54} r="26" fill={palette.sun} opacity="0.9" />

      {/* Mar em tres faixas: a profundidade vem da mudanca de tom, nao de gradiente. */}
      <rect y={horizon} width="400" height="34" fill={palette.far} />
      <rect y={horizon + 34} width="400" height="30" fill={palette.mid} />
      <rect y={horizon + 64} width="400" height="26" fill={palette.near} />

      <ellipse cx={sunX} cy={horizon + 16} rx="30" ry="5" fill={palette.sun} opacity="0.35" />

      {/* Espuma da arrebentacao. */}
      <path
        d={`M0 ${horizon + 88} Q 60 ${horizon + 80} 120 ${horizon + 88} T 240 ${horizon + 88} T 400 ${horizon + 86} L400 ${horizon + 96} L0 ${horizon + 96} Z`}
        fill="#ffffff"
        opacity="0.7"
      />

      <path
        d={`M0 ${horizon + 92} Q 200 ${horizon + 78} 400 ${horizon + 92} L400 300 L0 300 Z`}
        fill={palette.ground}
      />

      {/* Coqueiro: tronco curvo e cinco folhas, o suficiente para leitura em miniatura. */}
      <g transform={palmOnLeft ? 'translate(58 0)' : 'translate(330 0) scale(-1 1)'}>
        <path
          d={`M0 300 Q -10 ${horizon + 40} 14 ${horizon - 6}`}
          stroke={palette.accent}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        {[-58, -30, 0, 30, 58].map((angle) => (
          <path
            key={angle}
            d={`M14 ${horizon - 6} q 26 -14 52 -4`}
            stroke={palette.accent}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(${angle} 14 ${horizon - 6})`}
          />
        ))}
      </g>
    </>
  )
}

function CityScene({ palette, seed, skyFill }: SceneProps) {
  const horizon = 214

  // Silhueta deterministica: cada torre tira largura e altura do seed.
  const towers = Array.from({ length: 9 }, (_, index) => {
    const slot = (seed >> (index * 2)) & 0xff
    return {
      x: index * 46 - 4,
      width: 30 + (slot % 14),
      height: 52 + ((slot * 7) % 96),
    }
  })

  return (
    <>
      <rect width="400" height="300" fill={skyFill} />
      <circle cx={300 - (seed % 4) * 40} cy="86" r="22" fill={palette.sun} opacity="0.85" />

      {/* Fundo: torres mais claras e mais baixas dao profundidade. */}
      {towers.map((tower) => (
        <rect
          key={`far-${tower.x}`}
          x={tower.x + 16}
          y={horizon - tower.height * 0.62}
          width={tower.width}
          height={tower.height * 0.62}
          fill={palette.far}
          opacity="0.7"
        />
      ))}

      {/* Frente: torres cheias, com janelas acesas. */}
      {towers.map((tower, index) => (
        <g key={`near-${tower.x}`}>
          <rect
            x={tower.x}
            y={horizon - tower.height}
            width={tower.width}
            height={tower.height}
            fill={index % 2 === 0 ? palette.mid : palette.near}
          />
          {Array.from({ length: Math.floor(tower.height / 22) }, (_, row) => (
            <rect
              key={row}
              x={tower.x + 6}
              y={horizon - tower.height + 10 + row * 22}
              width={tower.width - 12}
              height="7"
              fill={palette.accent}
              opacity={((seed >> (row + index)) & 3) === 0 ? 0.18 : 0.62}
            />
          ))}
        </g>
      ))}

      <rect y={horizon} width="400" height={300 - horizon} fill={palette.ground} />
    </>
  )
}

function SnowScene({ palette, seed, skyFill }: SceneProps) {
  const horizon = 208
  const peakX = 150 + (seed % 4) * 34

  return (
    <>
      <rect width="400" height="300" fill={skyFill} />
      <circle cx={72 + (seed % 3) * 30} cy="70" r="24" fill={palette.sun} opacity="0.9" />

      <path d="M-20 208 L70 118 L150 208 Z" fill={palette.far} />
      <path d="M250 208 L330 132 L420 208 Z" fill={palette.far} />

      {/* Pico principal, com capa de neve mais larga que o corte do cume. */}
      <path d={`M${peakX - 130} 208 L${peakX} 66 L${peakX + 130} 208 Z`} fill={palette.mid} />
      <path
        d={`M${peakX - 40} 110 L${peakX} 66 L${peakX + 40} 110 Q ${peakX + 16} 122 ${peakX} 108 Q ${peakX - 18} 124 ${peakX - 40} 110 Z`}
        fill="#ffffff"
      />
      {/* Face sombreada: sem ela o triangulo fica chapado. */}
      <path
        d={`M${peakX} 66 L${peakX + 130} 208 L${peakX + 20} 208 Z`}
        fill={palette.near}
        opacity="0.55"
      />

      <path
        d={`M0 ${horizon} Q 200 ${horizon - 16} 400 ${horizon} L400 300 L0 300 Z`}
        fill={palette.ground}
      />

      {/* Pinheiros em tamanho decrescente para sugerir distancia. */}
      {[
        { x: 40, scale: 1 },
        { x: 92, scale: 0.76 },
        { x: 316, scale: 0.9 },
        { x: 364, scale: 0.68 },
      ].map((tree) => (
        <g key={tree.x} transform={`translate(${tree.x} ${horizon + 46}) scale(${tree.scale})`}>
          <rect x="-3" y="-14" width="6" height="18" fill="#4a3a2c" />
          <path d="M0 -74 L22 -34 L-22 -34 Z" fill={palette.accent} />
          <path d="M0 -56 L26 -12 L-26 -12 Z" fill={palette.accent} />
        </g>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Marcos, sobrepostos a cena base
// ---------------------------------------------------------------------------

/**
 * Silhuetas para os destinos que tem forma reconhecivel.
 *
 * So entra aqui o que fica legivel em 4:3 pequeno com poucos vetores. Destino sem
 * marco fica com a cena base, que a paleta ja diferencia.
 */
const LANDMARKS: Record<string, (palette: Palette) => ReactElement> = {
  'rio-de-janeiro': (palette) => (
    <g>
      {/* Pao de Acucar e Urca. */}
      <path d="M236 214 Q 286 118 336 214 Z" fill={palette.near} />
      <path d="M188 214 Q 218 160 248 214 Z" fill={palette.mid} />
      <path d="M40 214 Q 96 138 152 214 Z" fill={palette.near} opacity="0.9" />
      {/* Cristo no alto do morro da esquerda. */}
      <g transform="translate(96 0)" fill={palette.ground}>
        <rect x="-2" y="122" width="5" height="26" />
        <rect x="-15" y="127" width="31" height="4" />
        <circle cy="118" r="4" />
      </g>
    </g>
  ),

  'fernando-de-noronha': (palette) => (
    <g>
      {/* Morro Dois Irmaos: as duas rochas desiguais sao a assinatura da ilha. */}
      <path d="M232 200 Q 262 96 292 200 Z" fill={palette.near} />
      <path d="M286 200 Q 310 132 334 200 Z" fill={palette.mid} />
    </g>
  ),

  'foz-do-iguacu': (palette) => (
    <g>
      <rect x="96" y="156" width="208" height="20" fill={palette.accent} opacity="0.35" />
      {/* Cortinas de agua em larguras alternadas. */}
      {[110, 142, 174, 206, 238, 270].map((x, index) => (
        <rect
          key={x}
          x={x}
          y="164"
          width={index % 2 === 0 ? 20 : 14}
          height="62"
          fill="#ffffff"
          opacity="0.82"
        />
      ))}
      <ellipse cx="200" cy="230" rx="118" ry="14" fill="#ffffff" opacity="0.55" />
    </g>
  ),

  paris: (palette) => (
    <g stroke={palette.accent} strokeWidth="4" fill="none" strokeLinecap="round">
      {/* Torre Eiffel: pernas curvas, dois andares e a antena. */}
      <path d="M182 214 Q 200 150 200 92" />
      <path d="M218 214 Q 200 150 200 92" />
      <path d="M188 178 L212 178" />
      <path d="M192 148 L208 148" />
      <path d="M200 92 L200 74" />
      <path d="M176 214 L224 214" strokeWidth="5" />
    </g>
  ),

  roma: (palette) => (
    <g>
      {/* Coliseu: dois niveis de arcos e a parede mais alta a direita. */}
      <path d="M140 214 L140 140 Q 200 118 260 140 L260 214 Z" fill={palette.mid} />
      {[150, 176, 202, 228].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 214 L${x} 176 Q ${x + 10} 168 ${x + 20} 176 L${x + 20} 214 Z`}
            fill={palette.near}
          />
          <path
            d={`M${x} 166 L${x} 146 Q ${x + 10} 140 ${x + 20} 146 L${x + 20} 166 Z`}
            fill={palette.near}
          />
        </g>
      ))}
      <path d="M252 214 L252 132 Q 264 126 272 134 L272 214 Z" fill={palette.mid} />
    </g>
  ),

  'nova-york': (palette) => (
    <g>
      {/* Torre central com pinaculo, cercada por blocos mais baixos. */}
      <rect x="138" y="126" width="36" height="88" fill={palette.mid} />
      <rect x="224" y="112" width="40" height="102" fill={palette.mid} />
      <rect x="176" y="86" width="46" height="128" fill={palette.near} />
      <rect x="188" y="62" width="22" height="26" fill={palette.near} />
      <rect x="197" y="40" width="5" height="24" fill={palette.accent} />
      {[144, 182, 230].map((x) =>
        [136, 158, 180].map((y) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="20"
            height="6"
            fill={palette.accent}
            opacity="0.6"
          />
        )),
      )}
    </g>
  ),

  zermatt: (palette) => (
    <g>
      {/* Matterhorn: o cume torto e o que identifica a montanha. */}
      <path d="M118 208 L206 52 L226 84 L296 208 Z" fill={palette.mid} />
      <path d="M206 52 L226 84 L296 208 L212 208 Z" fill={palette.near} opacity="0.6" />
      <path d="M186 92 L206 52 L226 84 Q 210 98 196 88 Z" fill="#ffffff" />
    </g>
  ),

  orlando: (palette) => (
    <g>
      {/* Castelo: torres de alturas diferentes com cones e bandeira. */}
      <rect x="168" y="150" width="64" height="64" fill={palette.mid} />
      <rect x="152" y="132" width="24" height="82" fill={palette.near} />
      <rect x="224" y="132" width="24" height="82" fill={palette.near} />
      <path d="M148 132 L164 104 L180 132 Z" fill={palette.accent} />
      <path d="M220 132 L236 104 L252 132 Z" fill={palette.accent} />
      <path d="M186 150 L200 112 L214 150 Z" fill={palette.accent} />
      <rect x="199" y="94" width="2" height="20" fill={palette.ground} />
      <path d="M201 96 L214 101 L201 106 Z" fill={palette.sun} />
    </g>
  ),

  amsterda: (palette) => (
    <g>
      {/* Casas de canal: as empenas em degrau entregam a cidade. */}
      {[
        { x: 132, h: 92 },
        { x: 166, h: 108 },
        { x: 200, h: 84 },
        { x: 234, h: 100 },
      ].map((house) => (
        <g key={house.x}>
          <rect x={house.x} y={214 - house.h} width="30" height={house.h} fill={palette.mid} />
          <path
            d={`M${house.x} ${214 - house.h} L${house.x + 8} ${214 - house.h - 12} L${house.x + 22} ${214 - house.h - 12} L${house.x + 30} ${214 - house.h} Z`}
            fill={palette.near}
          />
          <rect
            x={house.x + 10}
            y={214 - house.h + 18}
            width="10"
            height="12"
            fill={palette.accent}
            opacity="0.7"
          />
        </g>
      ))}
      {/* Reflexo no canal. */}
      <rect y="214" width="400" height="20" fill={palette.far} opacity="0.5" />
    </g>
  ),

  cusco: (palette) => (
    <g>
      {/* Cume andino com terracos incas em degraus. */}
      <path d="M120 208 L196 88 L272 208 Z" fill={palette.mid} />
      <path d="M196 88 L272 208 L204 208 Z" fill={palette.near} opacity="0.5" />
      {[
        { y: 178, w: 108 },
        { y: 190, w: 84 },
        { y: 202, w: 60 },
      ].map((terrace) => (
        <rect
          key={terrace.y}
          x={196 - terrace.w / 2}
          y={terrace.y}
          width={terrace.w}
          height="7"
          fill={palette.accent}
          opacity="0.55"
        />
      ))}
    </g>
  ),

  gramado: (palette) => (
    <g>
      {/* Casas de enxaimel: telhado de duas aguas bem inclinado. */}
      {[
        { x: 128, scale: 1 },
        { x: 216, scale: 0.84 },
      ].map((house) => (
        <g key={house.x} transform={`translate(${house.x} 0) scale(${house.scale})`}>
          <rect x="0" y="182" width="62" height="42" fill="#f6f1e8" />
          <path d="M-8 182 L31 138 L70 182 Z" fill={palette.accent} />
          <rect x="26" y="198" width="12" height="26" fill={palette.near} />
          <rect x="8" y="192" width="10" height="10" fill={palette.mid} opacity="0.8" />
          <rect x="46" y="192" width="10" height="10" fill={palette.mid} opacity="0.8" />
        </g>
      ))}
    </g>
  ),

  miami: (palette) => (
    <g>
      {/* Art deco: blocos baixos e claros com friso horizontal. */}
      {[
        { x: 140, h: 66 },
        { x: 196, h: 84 },
        { x: 252, h: 72 },
      ].map((block) => (
        <g key={block.x}>
          <rect x={block.x} y={214 - block.h} width="48" height={block.h} fill="#f7ede2" />
          <rect x={block.x} y={214 - block.h + 12} width="48" height="4" fill={palette.sun} />
          <rect x={block.x} y={214 - block.h + 26} width="48" height="4" fill={palette.far} />
          <rect x={block.x + 18} y={214 - block.h - 10} width="12" height="10" fill="#f7ede2" />
        </g>
      ))}
    </g>
  ),
}

// ---------------------------------------------------------------------------

export function DestinationArtwork({
  destination,
  className,
  decorative = false,
}: DestinationArtworkProps) {
  const seed = hashId(destination.id)
  const style = dominantStyle(destination.styles)
  const variants = PALETTES[style]
  const palette = variants[seed % variants.length]!

  const landmark = LANDMARKS[destination.id]

  // O id do gradiente carrega o id do destino: `defs` e global no documento, e
  // com id fixo o segundo card em diante reusaria o gradiente do primeiro.
  const skyId = `sky-${destination.id}`
  const skyFill = `url(#${skyId})`

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      role={decorative ? 'presentation' : 'img'}
      aria-label={
        decorative ? undefined : `Ilustração de ${destination.name}, ${destination.country}`
      }
      aria-hidden={decorative || undefined}
      className={className}
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
      </defs>

      {style === 'beach' ? (
        <BeachScene palette={palette} seed={seed} skyFill={skyFill} />
      ) : null}
      {style === 'city' ? <CityScene palette={palette} seed={seed} skyFill={skyFill} /> : null}
      {style === 'snow' ? <SnowScene palette={palette} seed={seed} skyFill={skyFill} /> : null}

      {landmark ? landmark(palette) : null}
    </svg>
  )
}
