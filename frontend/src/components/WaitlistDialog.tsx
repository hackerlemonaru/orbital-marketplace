import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { siteData } from '../data/site';
import { Button } from './ui';

export default function WaitlistDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setSaved(Boolean(window.localStorage.getItem('orbital-studio-interest')));
    window.setTimeout(() => (email ? closeRef.current : inputRef.current)?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    window.localStorage.setItem('orbital-studio-interest', email.trim());
    setSaved(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="dialog-backdrop"
            aria-label="Close waitlist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="waitlist-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-title"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="waitlist-head">
              <div className="eyebrow">Studio waitlist</div>
              <button ref={closeRef} type="button" className="icon-button" aria-label="Close waitlist" onClick={onClose}><X size={20} /></button>
            </div>
            <h2 id="waitlist-title">Checkout opens soon.</h2>
            {saved ? (
              <div className="waitlist-success">
                <span className="success-icon"><Check size={19} aria-hidden="true" /></span>
                <div>
                  <strong>Interest saved on this device.</strong>
                  <p>No payment or account was created. Watch the public repository for release notes.</p>
                </div>
                <Button href={siteData.repoUrl} variant="secondary" size="compact" icon={<ArrowUpRight size={15} />}>Watch releases</Button>
              </div>
            ) : (
              <>
                <p>ORBITAL Studio is not on sale yet. Leave a local note here, or watch the repository for updates.</p>
                <form onSubmit={submit} className="waitlist-form">
                  <label htmlFor="waitlist-email">Email</label>
                  <input
                    ref={inputRef}
                    id="waitlist-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@studio.com"
                    required
                  />
                  <Button type="submit" variant="primary" size="compact">Notify me</Button>
                </form>
                <p className="waitlist-note">This demo stores interest in this browser only. No checkout is live and no data is sent.</p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
