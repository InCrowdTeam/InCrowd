import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Icon, ImgPlaceholder } from '@/components/ui'
import { CATEGORIES, CAT_ORDER, getCategoryLabel } from '@/config/categorie'
import { DateService } from '@/services/DateService'
import { useUserStore } from '@/stores/userStore'
import { useIsMobile } from '@/hooks/useMediaQuery'

/* ============================================================
   InCrowd — Wizard creazione proposta (3 step)
   Design: prototipo CreateScreen + Stepper.
   Comportamento: AddPropostaView.vue (validazioni, payload FormData, navigazione).
   ============================================================ */

interface StepDef {
  id: number
  label: string
}

const STEPS: StepDef[] = [
  { id: 1, label: 'Info base' },
  { id: 2, label: 'Foto' },
  { id: 3, label: 'Luogo & Data' },
]

const MAX_FOTO_BYTES = 2 * 1024 * 1024 // 2MB (limite effettivo del backend)

interface FormState {
  titolo: string
  descrizione: string
  categoria: string
  citta: string
  cap: string
  via: string
  civico: string
  dataIpotetica: string
}

const EMPTY_FORM: FormState = {
  titolo: '',
  descrizione: '',
  categoria: '',
  citta: '',
  cap: '',
  via: '',
  civico: '',
  dataIpotetica: '',
}

/* ---- Stepper (porting verbatim dal prototipo) ---- */
function Stepper({ step }: { step: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        marginBottom: 30,
        flexWrap: 'wrap',
      }}
    >
      {STEPS.map((s, i) => {
        const n = i + 1
        const done = n < step
        const on = n === step
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  fontFamily: 'var(--font-display)',
                  transition: 'all .25s var(--ease-back)',
                  background: on || done ? 'var(--brand)' : 'var(--surface-3)',
                  color: on || done ? '#fff' : 'var(--ink-3)',
                  boxShadow: on ? '0 5px 16px rgba(255,77,94,.4)' : 'none',
                }}
              >
                {done ? <Icon name="check" size={20} stroke={2.5} /> : n}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: on ? 'var(--brand-700)' : done ? 'var(--ink-2)' : 'var(--ink-3)',
                }}
              >
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 'clamp(24px,8vw,90px)',
                  height: 3,
                  borderRadius: 2,
                  margin: '0 6px 22px',
                  background: done ? 'var(--brand)' : 'var(--border)',
                  transition: 'background .3s var(--ease)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AddProposta() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const token = useUserStore((s) => s.token)
  const mobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [foto, setFoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  /* ---- gating identico a AddPropostaView.vue::canProceed ---- */
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return !!(form.titolo && form.descrizione && form.categoria)
      case 2:
        return true // foto opzionale
      case 3:
        return !!(form.citta && form.cap && form.via && form.civico && form.dataIpotetica)
      default:
        return false
    }
  }, [step, form])

  const nextStep = () => {
    if (canProceed && step < STEPS.length) setStep((s) => s + 1)
  }
  const previousStep = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  /* ---- gestione foto (porting di processFile/handleFileUpload/handleDrop/removePhoto) ---- */
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Tipo di file non supportato. Carica un’immagine.')
      return
    }
    if (file.size > MAX_FOTO_BYTES) {
      setError('Immagine troppo grande. Dimensione massima 2MB.')
      return
    }
    setError('')
    setFoto(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl((e.target?.result as string) ?? null)
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const removePhoto = () => {
    setFoto(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ---- submit: replica fedele di AddPropostaView.vue::handleSubmit ----
     Il backend (POST /api/proposte) richiede multipart/form-data con multer
     (upload.single('foto')) + Authorization Bearer e ruolo privato|ente.
     Si usa fetch diretta con FormData come nel Vue e come updateProfile() in userApi. */
  const handleSubmit = async () => {
    setError('')
    if (!token) {
      setError('Devi essere loggato per creare una proposta!')
      return
    }
    if (!canProceed) return

    setIsSubmitting(true)
    try {
      const stato = { stato: 'in_approvazione', commento: '' }

      const formData = new FormData()
      formData.append('titolo', form.titolo)
      formData.append('descrizione', form.descrizione)
      if (foto) formData.append('foto', foto)
      formData.append('categoria', form.categoria)
      formData.append('indirizzo_citta', form.citta)
      formData.append('indirizzo_cap', form.cap)
      formData.append('indirizzo_via', form.via)
      formData.append('indirizzo_civico', form.civico)
      formData.append('dataIpotetica', form.dataIpotetica)
      formData.append('proponenteID', user?._id ?? '')
      formData.append('stato', JSON.stringify({ stato: stato.stato, commento: stato.commento ?? '' }))

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/proposte`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((body as { message?: string }).message || 'Failed to create proposta')
      }

      setSuccess(true)
    } catch (e) {
      setError((e as Error).message || 'Errore nella creazione della proposta')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---- schermata di successo ---- */
  if (success) {
    return (
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 'clamp(20px,3vw,40px) clamp(14px,4vw,24px) 80px',
        }}
      >
        <Card pad="clamp(28px,5vw,48px)" className="fade-in" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--cat-sport-soft)',
              color: 'var(--cat-sport)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Icon name="check" size={40} stroke={2.5} />
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, marginBottom: 10 }}>
            Proposta creata con successo!
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 16, marginBottom: 26, lineHeight: 1.5 }}>
            La tua proposta &egrave; stata inviata e sar&agrave; presto esaminata dal nostro team.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button icon="home" onClick={() => navigate('/')}>
              Torna alla Home
            </Button>
            <Button
              variant="ghost"
              icon="plus"
              onClick={() => {
                setForm(EMPTY_FORM)
                setFoto(null)
                setPreviewUrl(null)
                setStep(1)
                setSuccess(false)
              }}
            >
              Crea un&apos;altra proposta
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: 'clamp(20px,3vw,40px) clamp(14px,4vw,24px) 80px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 800 }}>Crea la tua Proposta</h1>
        <p style={{ color: 'var(--ink-3)', marginTop: 8, fontSize: 16 }}>
          Condividi la tua idea con la community
        </p>
      </div>

      <Stepper step={step} />

      <Card pad="clamp(20px,3vw,30px)" className="fade-in" style={{ minHeight: 320 }}>
        {/* ---- Step 1: Informazioni base ---- */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}>Informazioni base</h2>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
              <div>
                <label className="ic-label">
                  <Icon name="target" size={15} style={{ color: 'var(--brand)' }} />
                  Titolo della proposta *
                </label>
                <input
                  className="ic-input"
                  value={form.titolo}
                  onChange={(e) => set('titolo', e.target.value)}
                  placeholder="Es: Workshop di fotografia urbana"
                />
              </div>
              <div>
                <label className="ic-label">
                  <Icon name="edit" size={15} style={{ color: 'var(--brand)' }} />
                  Categoria *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CAT_ORDER.map((c) => {
                    const on = form.categoria === c
                    const cc = CATEGORIES[c]
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set('categoria', c)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 13px',
                          borderRadius: 'var(--r-pill)',
                          fontSize: 13,
                          fontWeight: 700,
                          border: `1px solid ${on ? 'transparent' : 'var(--border)'}`,
                          color: on ? '#fff' : cc.color,
                          background: on ? cc.color : 'var(--surface-2)',
                          transition: 'all .15s var(--ease)',
                          cursor: 'pointer',
                        }}
                      >
                        <Icon name={cc.icon} size={14} stroke={2} />
                        {cc.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div>
              <label className="ic-label">
                <Icon name="comment" size={15} style={{ color: 'var(--brand)' }} />
                Descrizione dettagliata *
              </label>
              <textarea
                className="ic-input"
                value={form.descrizione}
                onChange={(e) => set('descrizione', e.target.value)}
                rows={4}
                placeholder="Descrivi la tua proposta in dettaglio&hellip;"
                style={{ resize: 'vertical', minHeight: 110 }}
              />
            </div>
          </div>
        )}

        {/* ---- Step 2: Foto ---- */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}>Foto di copertina</h2>
            <p
              style={{
                textAlign: 'center',
                color: 'var(--ink-3)',
                fontSize: 14.5,
                marginTop: -8,
              }}
            >
              Una bella immagine attira pi&ugrave; hype{' '}
              <Icon
                name="bolt"
                size={15}
                fill="var(--hype)"
                stroke={0}
                style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }}
              />
            </p>

            <label
              onClick={triggerFileInput}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="ic-card-hover"
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--r-lg)',
                padding: '44px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--surface-2)',
                display: 'block',
                transition: 'all .18s var(--ease)',
              }}
            >
              {previewUrl ? (
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={previewUrl}
                    alt="Anteprima"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 320,
                      borderRadius: 'var(--r-md)',
                      boxShadow: 'var(--shadow-md)',
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removePhoto()
                    }}
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--brand)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    aria-label="Rimuovi foto"
                  >
                    <Icon name="x" size={17} stroke={2.5} />
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: form.categoria ? CATEGORIES[form.categoria].soft : 'var(--brand-soft)',
                      display: 'grid',
                      placeItems: 'center',
                      margin: '0 auto 14px',
                    }}
                  >
                    <Icon
                      name="camera"
                      size={28}
                      style={{ color: form.categoria ? CATEGORIES[form.categoria].color : 'var(--brand)' }}
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    Trascina un&apos;immagine o clicca per caricare
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 5 }}>JPG o PNG &middot; max 2MB</div>
                </>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {!previewUrl && form.categoria && (
              <ImgPlaceholder cat={form.categoria} label="anteprima" ratio="21/9" />
            )}
          </div>
        )}

        {/* ---- Step 3: Luogo & Data ---- */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}>Luogo &amp; Data</h2>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
              <div>
                <label className="ic-label">
                  <Icon name="pin" size={15} style={{ color: 'var(--brand)' }} />
                  Citt&agrave; *
                </label>
                <input
                  className="ic-input"
                  value={form.citta}
                  onChange={(e) => set('citta', e.target.value)}
                  placeholder="Es: Milano"
                />
              </div>
              <div>
                <label className="ic-label">
                  <Icon name="mail" size={15} style={{ color: 'var(--brand)' }} />
                  CAP *
                </label>
                <input
                  className="ic-input"
                  value={form.cap}
                  onChange={(e) => set('cap', e.target.value)}
                  placeholder="20100"
                />
              </div>
              <div>
                <label className="ic-label">
                  <Icon name="building" size={15} style={{ color: 'var(--brand)' }} />
                  Via *
                </label>
                <input
                  className="ic-input"
                  value={form.via}
                  onChange={(e) => set('via', e.target.value)}
                  placeholder="Es: Via Roma"
                />
              </div>
              <div>
                <label className="ic-label">
                  <Icon name="home" size={15} style={{ color: 'var(--brand)' }} />
                  Civico *
                </label>
                <input
                  className="ic-input"
                  value={form.civico}
                  onChange={(e) => set('civico', e.target.value)}
                  placeholder="42"
                />
              </div>
              <div>
                <label className="ic-label">
                  <Icon name="calendar" size={15} style={{ color: 'var(--brand)' }} />
                  Data prevista *
                </label>
                <input
                  className="ic-input"
                  type="date"
                  value={form.dataIpotetica}
                  onChange={(e) => set('dataIpotetica', e.target.value)}
                />
              </div>
            </div>

            {/* Riepilogo (porting summary-card del Vue) */}
            <div
              style={{
                marginTop: 4,
                padding: '16px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Icon name="eye" size={16} style={{ color: 'var(--brand)' }} />
                Riepilogo
              </h3>
              <SummaryRow label="Titolo" value={form.titolo || 'Non specificato'} />
              <SummaryRow label="Categoria" value={getCategoryLabel(form.categoria) || 'Non specificata'} />
              <SummaryRow
                label="Luogo"
                value={`${form.via} ${form.civico}, ${form.citta} ${form.cap}`.trim() || 'Non specificato'}
              />
              <SummaryRow
                label="Data"
                value={form.dataIpotetica ? DateService.formatDate(form.dataIpotetica) : 'Non specificata'}
                last
              />
            </div>

            {/* Avviso moderazione (porting verbatim dal prototipo) */}
            <div
              style={{
                marginTop: 2,
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--cat-workshop-soft)',
                color: 'var(--cat-workshop)',
                fontSize: 13.5,
                fontWeight: 600,
                display: 'flex',
                gap: 9,
                alignItems: 'flex-start',
              }}
            >
              <Icon name="shield" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              La proposta verr&agrave; inviata in moderazione. Un operatore la approver&agrave; prima della
              pubblicazione.
            </div>
          </div>
        )}

        {/* ---- errore inline ---- */}
        {error && (
          <div
            style={{
              marginTop: 20,
              padding: '12px 14px',
              borderRadius: 'var(--r-md)',
              background: 'var(--brand-soft)',
              color: 'var(--brand-700)',
              fontSize: 13.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <Icon name="x" size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-700)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                padding: 0,
              }}
              aria-label="Chiudi errore"
            >
              <Icon name="x" size={16} stroke={2.5} />
            </button>
          </div>
        )}

        {/* ---- navigazione ---- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid var(--border)',
          }}
        >
          {step > 1 ? (
            <Button variant="ghost" icon="arrowleft" onClick={previousStep}>
              Indietro
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length ? (
            <Button iconRight="arrowright" disabled={!canProceed} onClick={nextStep}>
              Avanti
            </Button>
          ) : (
            <Button
              icon="check"
              variant="success"
              disabled={isSubmitting || !canProceed}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Creazione in corso…' : 'Crea Proposta'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        padding: '7px 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        fontSize: 13.5,
        color: 'var(--ink-2)',
      }}
    >
      <strong style={{ color: 'var(--ink)', marginRight: 6 }}>{label}:</strong>
      {value}
    </div>
  )
}
