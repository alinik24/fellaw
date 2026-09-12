import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Filter, Globe2, Loader2, MapPin, Search, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchLawyers, LawyerSearchResult } from '@/lib/api/lawyers';
import { useLanguage } from '@/contexts/LanguageContext';

const FindLawyer = () => {
  const { language } = useLanguage();
  const de = language === 'de';
  const [results, setResults] = useState<LawyerSearchResult[]>([]);
  const [city, setCity] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [lawLanguage, setLawLanguage] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true); setError(null); setSearched(true);
    try { setResults(await searchLawyers({ city, specialization, language: lawLanguage, offers_free: freeOnly, verified_only: verifiedOnly })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : (de ? 'Suche nicht verfügbar.' : 'Search unavailable.')); setResults([]); }
    finally { setLoading(false); }
  }, [city, specialization, lawLanguage, freeOnly, verifiedOnly, de]);

  useEffect(() => { void runSearch(); }, [runSearch]);

  return (
    <main className="fellow-page fellow-lawyers" aria-labelledby="lawyers-title">
      <div className="fellow-intake__back"><Button variant="ghost" asChild><Link to="/"><ArrowLeft aria-hidden="true" />{de ? 'Zurück' : 'Back'}</Link></Button></div>
      <header className="fellow-page-header"><div><p className="fellow-eyebrow">{de ? 'Passende Unterstützung' : 'Find support'}</p><h1 id="lawyers-title">{de ? 'Anwalt finden' : 'Find a lawyer'}</h1><p>{de ? 'Filtern Sie nach dem, was für Ihren Fall wichtig ist. Wir zeigen nur Profile, die das Backend zurückgibt.' : 'Filter by what matters for your case. We only show profiles returned by the FelLaw service.'}</p></div><Link className="fellow-text-link" to="/new-case">{de ? 'Fall zuerst einordnen' : 'Describe your case first'} <ArrowRight aria-hidden="true" /></Link></header>
      <div className="fellow-lawyers__layout">
        <aside className="fellow-lawyers__filters" aria-label={de ? 'Suchfilter' : 'Search filters'}><div className="fellow-filter-heading"><Filter aria-hidden="true" /><h2>{de ? 'Filter' : 'Filters'}</h2></div><div className="fellow-filter-field"><Label htmlFor="lawyer-city">{de ? 'Ort' : 'City'}</Label><Input id="lawyer-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={de ? 'z. B. Berlin' : 'e.g. Berlin'} /></div><div className="fellow-filter-field"><Label htmlFor="lawyer-specialization">{de ? 'Rechtsgebiet' : 'Specialisation'}</Label><select id="lawyer-specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)}><option value="">{de ? 'Alle Bereiche' : 'All areas'}</option><option value="housing">{de ? 'Wohnen' : 'Housing'}</option><option value="employment">{de ? 'Arbeit' : 'Employment'}</option><option value="family">{de ? 'Familie' : 'Family'}</option><option value="traffic">{de ? 'Verkehr' : 'Traffic'}</option><option value="immigration">{de ? 'Aufenthalt' : 'Immigration'}</option></select></div><div className="fellow-filter-field"><Label htmlFor="lawyer-language">{de ? 'Sprache' : 'Language'}</Label><select id="lawyer-language" value={lawLanguage} onChange={(e) => setLawLanguage(e.target.value)}><option value="">{de ? 'Alle Sprachen' : 'All languages'}</option><option value="de">Deutsch</option><option value="en">English</option><option value="ar">العربية</option><option value="tr">Türkçe</option></select></div><label className="fellow-check"><input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> <span>{de ? 'Kostenlose Erstberatung' : 'Free consultation'}</span></label><label className="fellow-check"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> <span>{de ? 'Nur verifizierte Profile' : 'Verified profiles only'}</span></label><Button onClick={() => void runSearch()} className="fellow-primary-action" disabled={loading}><Search aria-hidden="true" />{de ? 'Suchen' : 'Search'}</Button><p className="fellow-filter-note">{de ? 'Verifizierung, Verfügbarkeit und Preise werden nur angezeigt, wenn sie vom Profil bestätigt sind.' : 'Verification, availability and fees are shown only when returned by the profile service.'}</p></aside>
        <section className="fellow-lawyers__results" aria-live="polite"><div className="fellow-results-heading"><div><p className="fellow-eyebrow">{de ? 'Ergebnisse' : 'Results'}</p><h2>{loading ? (de ? 'Suche läuft…' : 'Searching…') : `${results.length} ${de ? 'Profile' : 'profiles'}`}</h2></div>{searched && !loading && !error && <span className="fellow-results-state"><CheckCircle2 aria-hidden="true" />{de ? 'Live-Suche' : 'Live search'}</span>}</div>{loading ? <div className="fellow-results-state-large"><Loader2 className="animate-spin" aria-hidden="true" /><p>{de ? 'Profile werden geladen…' : 'Loading profiles…'}</p></div> : error ? <div className="fellow-results-state-large fellow-results-error"><ShieldCheck aria-hidden="true" /><h3>{de ? 'Suche gerade nicht verfügbar' : 'Search is unavailable'}</h3><p>{de ? 'Die Profile konnten nicht geladen werden. Es wurden keine erfundenen Ergebnisse angezeigt.' : 'Profiles could not be loaded. No invented results are shown.'}</p><Button variant="outline" onClick={() => void runSearch()}>{de ? 'Erneut versuchen' : 'Try again'}</Button></div> : results.length === 0 ? <div className="fellow-results-state-large"><UserRound aria-hidden="true" /><h3>{de ? 'Keine passenden Profile' : 'No matching profiles'}</h3><p>{de ? 'Erweitern Sie die Filter oder beginnen Sie mit einer Fallschilderung.' : 'Broaden your filters or start with a case description.'}</p><Button variant="outline" asChild><Link to="/new-case">{de ? 'Situation schildern' : 'Describe your situation'}</Link></Button></div> : <div className="fellow-lawyer-list">{results.map((lawyer) => <article className="fellow-lawyer-row" key={lawyer.id}><div className="fellow-lawyer-avatar"><UserRound aria-hidden="true" /></div><div className="fellow-lawyer-main"><div className="fellow-lawyer-name"><h3>{lawyer.title ? `${lawyer.title} ` : ''}{lawyer.user_full_name || (de ? 'Name nicht angegeben' : 'Name not provided')}</h3>{lawyer.verified && <span className="fellow-verified"><ShieldCheck aria-hidden="true" />{de ? 'Verifiziert' : 'Verified'}</span>}</div><p className="fellow-lawyer-firm">{lawyer.law_firm_name || (de ? 'Kanzlei nicht angegeben' : 'Firm not provided')}{lawyer.city ? ` · ${lawyer.city}` : ''}</p><div className="fellow-lawyer-tags">{lawyer.specializations.map((tag) => <span key={tag}>{tag}</span>)}{lawyer.languages.map((tag) => <span key={tag}><Globe2 aria-hidden="true" />{tag}</span>)}</div>{lawyer.bio_snippet && <p className="fellow-lawyer-bio">{lawyer.bio_snippet}</p>}</div><div className="fellow-lawyer-meta">{lawyer.rating !== null && <span>★ {lawyer.rating.toFixed(1)} <small>({lawyer.review_count})</small></span>}{lawyer.offers_free_consultation && <span className="fellow-free"><WalletCards aria-hidden="true" />{de ? 'Kostenloses Erstgespräch' : 'Free consultation'}</span>}{lawyer.hourly_rate !== null && <span>{lawyer.hourly_rate} €/h</span>}<Link className="fellow-text-link" to="/find-lawyer">{de ? 'Profil prüfen' : 'Review profile'} <ArrowRight aria-hidden="true" /></Link></div></article>)}</div>}</section>
      </div>
      <p className="fellow-legal-note">{de ? 'FelLaw vermittelt Kontakte und Rechtsinformation. Eine Profilanzeige ist keine Empfehlung und ersetzt keine anwaltliche Prüfung.' : 'FelLaw provides legal information and introductions. A profile listing is not a recommendation and does not replace legal advice.'}</p>
    </main>
  );
};

export default FindLawyer;
