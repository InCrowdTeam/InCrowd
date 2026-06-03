import type { IProposta } from '@/types/Proposta'
import { useAuthor } from '@/hooks/useAuthor'
import { UserService } from '@/services/UserService'
import { processImageUrl } from '@/utils/image'
import { Avatar, CatTag, Hype, ImgPlaceholder, Icon } from '@/components/ui'
import { CATEGORIES } from '@/config/categorie'

export interface ProposalCardProps {
  proposta: IProposta
  count: number
  hyped: boolean
  onHype: () => void
  onOpen: () => void
  hypeDisabled?: boolean
  /** Posizione in classifica (1-based) — mostra #rank sopra la card. */
  rank?: number
}

/**
 * Card proposta — variante "Editoriale" (variant A del prototipo):
 * surface + bordo, immagine 16/10 a spigoli vivi, CatTag soft + Hype sovrapposti,
 * titolo, descrizione clamp 2 righe, divisore, Avatar+autore e luogo.
 */
export function ProposalCard({ proposta, count, hyped, onHype, onOpen, hypeDisabled, rank }: ProposalCardProps) {
  const author = useAuthor(proposta.proponenteID)
  const cat = proposta.categoria ? CATEGORIES[proposta.categoria] : undefined
  const img = processImageUrl(proposta.foto)
  const place = proposta.luogo?.citta

  return (
    <div className="fade-in">
      {rank != null && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--ink-3)',
            marginBottom: 6,
            paddingLeft: 4,
          }}
        >
          #{rank}
        </div>
      )}
      <article
        className="ic-card-hover"
        onClick={onOpen}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all .22s var(--ease)',
        }}
      >
        <div style={{ position: 'relative' }}>
          {img ? (
            <img
              src={img}
              alt={proposta.titolo}
              style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover' }}
            />
          ) : (
            <ImgPlaceholder cat={proposta.categoria} label={cat?.label.toLowerCase()} radius="0" ratio="16/10" />
          )}
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <CatTag cat={proposta.categoria} size="sm" />
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
            <Hype count={count} active={hyped} onToggle={onHype} size="sm" disabled={hypeDisabled} />
          </div>
        </div>

        <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 9 }}>
          <h3 style={{ fontSize: 17.5, fontWeight: 700, lineHeight: 1.12, color: 'var(--ink)', textWrap: 'balance' }}>
            {proposta.titolo}
          </h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--ink-2)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {proposta.descrizione}
          </p>
          <div style={{ flex: 1 }} />
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <Avatar user={author} fetchAvatar size={24} />
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-3)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {author ? UserService.getFullName(author) : '…'}
              </span>
            </div>
            {place && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  color: 'var(--ink-3)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                <Icon name="pin" size={13} />
                {place}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
