'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Facebook, Instagram, Megaphone, X } from 'lucide-react'
import type { PortalAnnouncement } from '@/lib/announcement'
import styles from './AnnouncementDialog.module.css'

const SOCIAL_INSTAGRAM = 'https://www.instagram.com/clickgruda.digital/'
const SOCIAL_FACEBOOK = 'https://www.facebook.com/artesparacanecasoficial/'

/** Destaca a última palavra, como na referência: "Novas artes" + "disponíveis!". */
function headlineParts(title: string) {
  const trimmed = title.trim()
  const cut = trimmed.lastIndexOf(' ')
  return cut > 0 ? [trimmed.slice(0, cut), trimmed.slice(cut + 1)] : [trimmed, '']
}

export function AnnouncementCard({ notice, preview = false, onClose }: {
  notice: PortalAnnouncement
  preview?: boolean
  onClose: () => void
}) {
  const [mainTitle, emphasis] = headlineParts(notice.title)
  const kindText = notice.kind === 'AVISO' ? 'AVISO IMPORTANTE' : notice.kind === 'INFORMACAO' ? 'INFORMAÇÃO' : 'NOVIDADE'
  const isLong = notice.title.length > 46 || notice.message.length > 220

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.975, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, y: 5 }}
      transition={{ duration: .2, ease: 'easeOut' }}
      className={styles.card}
      role="dialog"
      aria-modal={!preview}
      aria-labelledby="cg-announcement-title"
      aria-describedby="cg-announcement-message"
    >
      <div className={styles.glow} aria-hidden="true" />
      <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar aviso">
        <X size={18} strokeWidth={2} />
      </button>

      <div className={styles.content}>
        <div className={styles.typeRow}>
          <Megaphone className={styles.megaphone} size={35} strokeWidth={2} aria-hidden="true" />
          <span className={styles.pill}>{kindText}</span>
        </div>

        <div className={styles.announcementBody}>
          <div className={styles.textArea}>
            <h2 id="cg-announcement-title" className={`${styles.title} ${isLong ? styles.titleLong : ''}`}>
              {mainTitle}{emphasis ? <><span className={styles.lineBreak}> </span><span className={styles.highlight}>{emphasis}</span></> : null}
            </h2>
            <p id="cg-announcement-message" className={styles.description}>{notice.message}</p>
          </div>
          <img
            className={styles.artCards}
            src="/uploads/rebrand/announcement-gallery-3d.svg"
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className={styles.socialBox}>
          <p className={styles.socialIntro}>Siga nosso perfil no Instagram e Facebook:</p>
          <div className={styles.socialLinks}>
            <a href={SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Abrir Instagram Click & Gruda">
              <span className={`${styles.socialIcon} ${styles.instagramIcon}`}><Instagram size={15} strokeWidth={2.6} /></span>
              <span>@clickgruda.digital</span>
            </a>
            <span className={styles.separator} aria-hidden="true" />
            <a href={SOCIAL_FACEBOOK} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Abrir Facebook Artes para Canecas Oficial">
              <span className={`${styles.socialIcon} ${styles.facebookIcon}`}><Facebook size={15} fill="currentColor" strokeWidth={1.5} /></span>
              <span>@artesparacanecasoficial</span>
            </a>
          </div>
        </div>
        <button className={styles.continue} type="button" onClick={onClose}>
          Continuar navegando <ArrowRight size={17} strokeWidth={2.3} />
        </button>
      </div>
    </motion.section>
  )
}

export function AnnouncementDialog({ userId }: { userId: string }) {
  const [notice, setNotice] = useState<PortalAnnouncement | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/announcement', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json() as { announcement?: PortalAnnouncement | null }
        const next = data.announcement
        if (!cancelled && next?.enabled && next.revision && next.title && next.message) {
          setNotice(next)
          let seen = false
          try { seen = window.localStorage.getItem(`cg-announcement-seen:${userId}:${next.revision}`) === '1' } catch { /* Negações de armazenamento não bloqueiam a janela. */ }
          setOpen(!seen)
        } else if (!cancelled) setOpen(false)
      } catch { /* Falhas de conexão não impedem o portal. */ }
    }
    void load()
    const timer = window.setInterval(load, 90_000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [userId])
  const dismiss = () => {
    if (notice?.revision) {
      try { window.localStorage.setItem(`cg-announcement-seen:${userId}:${notice.revision}`, '1') } catch { /* armazenamento indisponível */ }
    }
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notice?.revision])
  return <AnimatePresence>{open && notice &&
    <div className={styles.overlay} onMouseDown={event => { if (event.target === event.currentTarget) dismiss() }}>
      <AnnouncementCard notice={notice} onClose={dismiss} />
    </div>
  }</AnimatePresence>
}
