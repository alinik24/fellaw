import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  MessageCircle,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { language } = useLanguage();
  const de = language === 'de';
  const isRegisteredUser = localStorage.getItem('isRegisteredUser') === 'true';

  const copy = de
    ? {
        eyebrow: 'Rechtliche Orientierung, wenn es darauf ankommt',
        title: 'Vom ersten Schreck zum nächsten sicheren Schritt.',
        intro: 'FelLaw hilft Ihnen, Ihre Situation zu ordnen, Fristen zu erkennen und den passenden Weg zu finden — auf Deutsch oder Englisch.',
        primary: 'Situation schildern',
        urgent: 'Soforthilfe',
        urgentNote: 'Für Polizei, Unfall, Haft, Kündigung oder andere zeitkritische Situationen.',
        primaryNote: 'Geführtes Formular. Sie entscheiden selbst, welche Informationen Sie teilen.',
        trustTitle: 'Klarheit vor Aktion',
        trustBody: 'Wir trennen Rechtsinformation, persönliche Daten und anwaltliche Beratung. KI-Ergebnisse sind Hinweise und ersetzen keine Rechtsberatung.',
        howTitle: 'Ein ruhiger Weg durch die nächsten Schritte',
        steps: [
          ['01', 'Situation ordnen', 'Wählen Sie den passenden Bereich und beantworten Sie nur die wichtigsten Fragen.'],
          ['02', 'Fristen sichtbar machen', 'Laden Sie Unterlagen optional hoch und behalten Sie wichtige nächste Schritte im Blick.'],
          ['03', 'Passenden Weg wählen', 'Finden Sie eine passende anwaltliche Ansprechperson.'],
        ],
        signedTitle: 'Schon registriert?',
        signedBody: 'Öffnen Sie Ihre Fälle, Dokumente und Nachrichten an einem Ort.',
        dashboard: 'Zum Dashboard',
        lawyerTitle: 'Für Kanzleien',
        lawyerBody: 'Strukturierte Anfragen statt unvollständiger Erstkontakte.',
        lawyer: 'Kanzlei-Zugang',
        assistant: 'Frage an den Assistenten',
        disclaimer: 'Rechtsinformation, keine Rechtsberatung im Sinne des RDG.',
      }
    : {
        eyebrow: 'Legal orientation when it matters',
        title: 'From the first shock to the next safe step.',
        intro: 'FelLaw helps you organise what happened, spot deadlines and choose the right path — in German or English.',
        primary: 'Describe your situation',
        urgent: 'Get urgent help',
        urgentNote: 'For police contact, accidents, detention, dismissal or other time-critical situations.',
        primaryNote: 'Guided intake. You decide which information to share.',
        trustTitle: 'Clarity before action',
        trustBody: 'We separate legal information, personal data and lawyer advice. AI outputs are guidance and are not legal advice.',
        howTitle: 'A calmer way through the next steps',
        steps: [
          ['01', 'Make sense of the situation', 'Choose an area and answer only the questions that matter first.'],
          ['02', 'Make deadlines visible', 'Optionally add documents and keep important next steps in view.'],
          ['03', 'Choose your path', 'Find a lawyer who fits your situation.'],
        ],
        signedTitle: 'Already registered?',
        signedBody: 'Open your cases, documents and messages in one place.',
        dashboard: 'Open dashboard',
        lawyerTitle: 'For law firms',
        lawyerBody: 'Structured enquiries instead of incomplete first contacts.',
        lawyer: 'Law firm access',
        assistant: 'Ask the assistant',
        disclaimer: 'Legal information, not legal advice under the German RDG.',
      };

  return (
    <div className="fellow-home">
      <section className="fellow-entry" aria-labelledby="home-title">
        <div className="fellow-entry__copy">
          <p className="fellow-eyebrow"><span className="fellow-eyebrow__dot" aria-hidden="true" />{copy.eyebrow}</p>
          <h1 id="home-title">{copy.title}</h1>
          <p className="fellow-lead">{copy.intro}</p>
          <div className="fellow-entry__actions">
            <Button asChild size="lg" className="fellow-primary-action">
              <Link to="/new-case">{copy.primary}<ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Link to="/urgent/select" className="fellow-urgent-action">
              <span className="fellow-urgent-action__mark" aria-hidden="true"><Clock3 /></span>
              <span><strong>{copy.urgent}</strong><small>{copy.urgentNote}</small></span>
            </Link>
          </div>
          <p className="fellow-action-note"><CheckCircle2 aria-hidden="true" />{copy.primaryNote}</p>
        </div>
        <aside className="fellow-entry__signal" aria-label={de ? 'FelLaw Orientierung' : 'FelLaw orientation'}>
          <div className="fellow-signal__header"><span className="fellow-signal__live" />{de ? 'Ihr nächster Schritt' : 'Your next step'}</div>
          <div className="fellow-signal__line" />
          <div className="fellow-signal__body">
            <ShieldCheck aria-hidden="true" />
            <strong>{de ? 'Sicher starten' : 'Start safely'}</strong>
            <p>{de ? 'Keine Zahlung. Kein Anruf. Erst Orientierung.' : 'No payment. No call. Orientation first.'}</p>
          </div>
          <div className="fellow-signal__footer"><Globe2 aria-hidden="true" />DE / EN</div>
        </aside>
      </section>

      <section className="fellow-trust" aria-labelledby="trust-title">
        <div className="fellow-trust__icon" aria-hidden="true"><ShieldCheck /></div>
        <div><h2 id="trust-title">{copy.trustTitle}</h2><p>{copy.trustBody}</p></div>
        <Link to="/contact" className="fellow-text-link">{de ? 'Mehr über Vertrauen' : 'How we handle trust'} <ArrowRight aria-hidden="true" /></Link>
      </section>

      <section className="fellow-how" aria-labelledby="how-title">
        <div className="fellow-section-heading"><p className="fellow-eyebrow">{de ? 'So funktioniert es' : 'How it works'}</p><h2 id="how-title">{copy.howTitle}</h2></div>
        <ol className="fellow-step-list">
          {copy.steps.map(([number, title, body]) => <li key={number}><span className="fellow-step-number">{number}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}
        </ol>
      </section>

      <section className="fellow-choose" aria-label={de ? 'Weitere Wege' : 'Other paths'}>
        <div className="fellow-choose__intro"><p className="fellow-eyebrow">{de ? 'Weitere Wege' : 'Other paths'}</p><p>{de ? 'Starten Sie dort, wo Sie gerade stehen.' : 'Start where you are.'}</p></div>
        {isRegisteredUser && <Link to="/user/dashboard" className="fellow-compact-link"><UserRound aria-hidden="true" /><span><strong>{copy.signedTitle}</strong><small>{copy.signedBody}</small></span><ArrowRight aria-hidden="true" /></Link>}
        <Link to="/find-lawyer" className="fellow-compact-link"><UsersRound aria-hidden="true" /><span><strong>{de ? 'Anwalt finden' : 'Find a lawyer'}</strong><small>{de ? 'Nach Bereich und passender Unterstützung suchen.' : 'Search by area and the support you need.'}</small></span><ArrowRight aria-hidden="true" /></Link>
      </section>

      <section className="fellow-roles" aria-label={de ? 'Zugänge' : 'Access'}>
        <Link to={isRegisteredUser ? '/user/dashboard' : '/auth/user/login'}><Briefcase aria-hidden="true" /><span><strong>{isRegisteredUser ? copy.dashboard : copy.signedTitle}</strong><small>{isRegisteredUser ? copy.signedBody : copy.dashboard}</small></span></Link>
        <Link to="/auth/lawyer/login"><FileText aria-hidden="true" /><span><strong>{copy.lawyerTitle}</strong><small>{copy.lawyerBody}</small></span><ArrowRight aria-hidden="true" /></Link>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-fellaw-assistant'))}><MessageCircle aria-hidden="true" /><span><strong>{copy.assistant}</strong><small>{copy.disclaimer}</small></span><ArrowRight aria-hidden="true" /></button>
      </section>
    </div>
  );
};

export default Index;
