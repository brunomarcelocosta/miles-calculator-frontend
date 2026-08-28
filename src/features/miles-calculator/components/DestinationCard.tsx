import { useState } from 'react'

import type { DestinationRecommendation } from '@/domain/model/Destination'
import { DestinationArtwork } from '@/features/miles-calculator/components/DestinationArtwork'
import { hasDestinationPhoto } from '@/features/miles-calculator/lib/destinationPhotos'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/shared/lib/formatNumber'

const CABIN_LABEL = {
  economy: 'Econômica',
  business: 'Executiva',
} as const

interface DestinationCardProps {
  recommendation: DestinationRecommendation
  /** Posicao na escada, usada para escalonar a revelacao em cascata. */
  index: number
}

export function DestinationCard({ recommendation, index }: DestinationCardProps) {
  const { destination, cabin, requiredMiles, withinMinimum, withinMaximum } = recommendation

  // Arquivo removido, renomeado ou rede caindo no meio do carregamento: em
  // qualquer um desses, o card volta para a arte em vez de mostrar imagem
  // quebrada.
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = hasDestinationPhoto(destination.id) && !photoFailed

  const status = withinMinimum
    ? { label: 'Já dá', tone: 'accent' as const }
    : withinMaximum
      ? { label: 'No cenário máximo', tone: 'muted' as const }
      : { label: 'Próxima meta', tone: 'outline' as const }

  return (
    <li
      className="group animate-in fade-in slide-in-from-bottom-3 fill-mode-both overflow-hidden rounded-2xl border border-border bg-card shadow-travion transition-[box-shadow,transform] duration-500 ease-travion hover:-translate-y-0.5 hover:shadow-travion-hover"
      style={{ animationDelay: `${index * 90}ms`, animationDuration: '500ms' }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-travion-surface">
        {/*
          A arte fica sempre no fundo: ela cobre o destino sem foto, preenche o
          quadro enquanto a foto carrega e reaparece se a foto falhar. Sem ela, o
          card piscaria cinza no meio da cascata de revelacao.
        */}
        <DestinationArtwork
          destination={destination}
          decorative={showPhoto}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-travion group-hover:scale-105"
        />

        {showPhoto ? (
          <img
            src={destination.image}
            alt={`${destination.name}, ${destination.country}`}
            loading="lazy"
            decoding="async"
            className="relative size-full object-cover transition-transform duration-700 ease-travion group-hover:scale-105"
            onError={() => setPhotoFailed(true)}
          />
        ) : null}

        <span
          className={cn(
            'absolute top-3 left-3 rounded-full px-3 py-1 font-sans text-xs font-medium backdrop-blur-sm',
            status.tone === 'accent' && 'bg-travion-accent text-travion-white',
            status.tone === 'muted' && 'bg-travion-white/90 text-foreground',
            status.tone === 'outline' &&
              'border border-travion-line bg-travion-white/80 text-travion-muted',
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-xl leading-tight">{destination.name}</h3>
        <p className="mt-0.5 font-sans text-sm text-travion-muted">{destination.country}</p>

        <p className="mt-3 text-sm text-travion-muted">{destination.blurb}</p>

        <p className="mt-4 flex items-baseline gap-2 border-t border-border pt-4 font-sans">
          <span className="text-base font-medium tabular-nums">
            {formatPoints(requiredMiles)}
          </span>
          <span className="text-sm text-travion-muted">
            milhas · {CABIN_LABEL[cabin]}
          </span>
        </p>
      </div>
    </li>
  )
}
