import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FileText, LockKeyhole, Mic, Paperclip, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCase } from '@/lib/api/platform';

const DRAFT_KEY = 'fellaw-case-draft';

const NewCase = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const de = language === 'de';
  const inputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      if (typeof draft.description === 'string') setDescription(draft.description);
      if (Array.isArray(draft.files)) setFiles(draft.files);
    } catch {
      // Ignore an invalid old draft and start clean.
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ description, files, updatedAt: new Date().toISOString() }));
      setSaved(true);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [description, files]);

  const chooseFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).map((file) => file.name);
    setFiles((current) => [...new Set([...current, ...selected])]);
    event.target.value = '';
  };

  const toggleRecording = () => {
    // The browser speech adapter is intentionally not faked. Show the state,
    // but leave the user in control until a real speech service is configured.
    setRecording((current) => !current);
  };

  const canContinue = description.trim().length > 10 || files.length > 0;

  const submitCase = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createCase({
        title: description.trim().slice(0, 120) || (de ? 'Neuer Fall' : 'New case'),
        case_type: 'civil',
        description: description.trim() || null,
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate('/user/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : (de ? 'Fall konnte nicht gespeichert werden.' : 'The case could not be saved.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fellow-page fellow-intake" aria-labelledby="intake-title">
      <div className="fellow-intake__back"><Button variant="ghost" asChild><Link to="/"><ArrowLeft aria-hidden="true" />{de ? 'Zurück' : 'Back'}</Link></Button></div>
      <header className="fellow-page-header fellow-intake__header">
        <div><p className="fellow-eyebrow">{de ? 'Geführter Start' : 'Guided start'}</p><h1 id="intake-title">{de ? 'Was ist passiert?' : 'What happened?'}</h1><p>{de ? 'Beginnen Sie mit Ihren eigenen Worten. Wir helfen Ihnen danach, die Situation zu ordnen.' : 'Start in your own words. We will help you organise the situation afterwards.'}</p></div>
        <div className="fellow-draft-status" aria-live="polite"><span className="fellow-draft-status__dot" />{saved ? (de ? 'Entwurf gespeichert' : 'Draft saved') : (de ? 'Speichert…' : 'Saving…')}</div>
      </header>

      <div className="fellow-intake__layout">
        <section className="fellow-intake__main">
          <div className="fellow-intake-panel">
            <div className="fellow-intake-panel__heading"><div><p className="fellow-eyebrow">01 / 03</p><h2>{de ? 'Ihre Schilderung' : 'Your account'}</h2></div><span className="fellow-intake-progress">{de ? 'Start' : 'Start'}</span></div>
            <Label htmlFor="case-description">{de ? 'Beschreiben Sie kurz, was passiert ist' : 'Briefly describe what happened'}</Label>
            <Textarea id="case-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={de ? 'Zum Beispiel: Ich habe am … ein Schreiben erhalten. Darin steht …' : 'For example: I received a letter on … It says …'} className="fellow-intake-textarea" />
            <div className="fellow-intake-panel__footer"><span>{de ? 'Daten wie Datum, Absender und Frist helfen später.' : 'Dates, sender and deadlines will help later.'}</span><button type="button" className={`fellow-voice-button ${recording ? 'is-recording' : ''}`} onClick={toggleRecording}><Mic aria-hidden="true" />{recording ? (de ? 'Aufnahme stoppen' : 'Stop recording') : (de ? 'Spracheingabe' : 'Use voice')}</button></div>
            {recording && <p className="fellow-inline-notice" role="status">{de ? 'Spracheingabe ist noch nicht verbunden. Bitte nutzen Sie das Textfeld.' : 'Voice input is not connected yet. Please use the text field.'}</p>}
          </div>

          <div className="fellow-intake-panel">
            <div className="fellow-intake-panel__heading"><div><p className="fellow-eyebrow">02 / 03</p><h2>{de ? 'Unterlagen (optional)' : 'Documents (optional)'}</h2></div><Paperclip aria-hidden="true" /></div>
            <p className="fellow-intake-help">{de ? 'Wählen Sie Dateien von Ihrem Gerät aus. Sie werden erst im nächsten Schritt an FelLaw übermittelt.' : 'Choose files from your device. They are not sent to FelLaw until the next step.'}</p>
            <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" onChange={chooseFiles} className="sr-only" aria-label={de ? 'Unterlagen auswählen' : 'Choose documents'} />
            <button type="button" className="fellow-upload-zone" onClick={() => inputRef.current?.click()}><UploadCloud aria-hidden="true" /><strong>{de ? 'Dateien auswählen' : 'Choose files'}</strong><span>PDF, DOC, JPG, PNG, TXT</span></button>
            {files.length > 0 && <ul className="fellow-file-list" aria-label={de ? 'Ausgewählte Dateien' : 'Selected files'}>{files.map((file) => <li key={file}><FileText aria-hidden="true" /><span>{file}</span><Check aria-hidden="true" /></li>)}</ul>}
          </div>

          <div className="fellow-intake-panel fellow-intake-panel--privacy"><LockKeyhole aria-hidden="true" /><div><h2>{de ? 'Sie behalten die Kontrolle' : 'You stay in control'}</h2><p>{de ? 'Der Entwurf wird lokal in diesem Browser gespeichert. Teilen Sie nur, was für Ihre Orientierung nötig ist.' : 'The draft is saved locally in this browser. Share only what is needed for your orientation.'}</p></div></div>

          <div className="fellow-intake-submit">
            <p className="fellow-intake-privacy-note" role="note"><LockKeyhole aria-hidden="true" />{de ? 'Mit „Weiter“ wird Ihre Schilderung im FelLaw-Entwicklungssystem in Ihrem Konto gespeichert. Ausgewählte Dateien bleiben bis zur nächsten Upload-Funktion lokal. Zugriff haben nur Sie und die FelLaw-Betreuenden. Eine Löschfrist ist noch nicht eingerichtet — löschen Sie nicht mehr benötigte Fälle selbst.' : 'By continuing, your description is saved in your FelLaw development account. Selected files remain local until document upload is connected. Only you and the FelLaw operators can access the case. A deletion schedule is not configured yet — delete cases you no longer need yourself.'}</p>
            {submitError && <p className="fellow-inline-notice" role="alert">{submitError}</p>}
            <Button size="lg" disabled={!canContinue || submitting} onClick={submitCase} className="fellow-primary-action">{submitting ? (de ? 'Wird gespeichert…' : 'Saving…') : (de ? 'Fall speichern und weiter' : 'Save case and continue')} <ArrowLeft aria-hidden="true" className="rotate-180" /></Button><p>{canContinue ? (de ? 'Der Fall wird jetzt sicher in Ihrem Konto angelegt.' : 'The case will now be created in your account.') : (de ? 'Fügen Sie eine kurze Schilderung oder Unterlage hinzu.' : 'Add a short description or a document to continue.')}</p></div>
        </section>

        <aside className="fellow-intake__aside"><p className="fellow-eyebrow">{de ? 'Soforthilfe' : 'Urgent help'}</p><h2>{de ? 'Ist es dringend?' : 'Is it urgent?'}</h2><p>{de ? 'Bei unmittelbaren Fristen oder drohendem Nachteil öffnen Sie zuerst die Soforthilfe.' : 'If a deadline is imminent or a disadvantage is looming, open urgent help first.'}</p><Link to="/urgent/select" className="fellow-intake-urgent"><strong>{de ? 'Ist es dringend?' : 'Is it urgent?'}</strong><span>{de ? 'Soforthilfe öffnen' : 'Open urgent help'} <ArrowLeft aria-hidden="true" className="rotate-180" /></span></Link></aside>
      </div>
    </main>
  );
};

export default NewCase;
