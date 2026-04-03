"""
Roadmap service – generates step-by-step legal action plans for German law cases.

Produces an AI-customised roadmap that accounts for case type, urgency, and status,
and embeds references to German-specific resources like Rechtsantragstelle,
Beratungshilfe, Prozesskostenhilfe, etc.
"""
from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case import Case
from app.services.ai_service import chat_completion

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# German-specific resource references
# ---------------------------------------------------------------------------

GERMAN_RESOURCES = {
    "rechtsantragstelle": {
        "name": "Rechtsantragstelle",
        "description": "Kostenlose Rechtsberatung beim Amtsgericht für einfache Rechtsfragen",
        "url": "https://www.bmj.de/DE/Themen/RechtsprechungundVerfahren/Rechtsantragstelle/Rechtsantragstelle_node.html",
    },
    "beratungshilfe": {
        "name": "Beratungshilfe (BerHG)",
        "description": "Staatliche Unterstützung für Rechtsberatung bei geringem Einkommen – Antrag beim Amtsgericht",
        "url": "https://www.bmj.de/DE/Themen/RechtsprechungundVerfahren/Beratungshilfe/Beratungshilfe_node.html",
    },
    "prozesskostenhilfe": {
        "name": "Prozesskostenhilfe (PKH)",
        "description": "Staatliche Übernahme der Gerichts- und Anwaltskosten für das Gerichtsverfahren (§ 114 ZPO)",
        "url": "https://www.bmj.de/DE/Themen/RechtsprechungundVerfahren/PKH/PKH_node.html",
    },
    "mieterverein": {
        "name": "Mieterverein / Mieterschutzbund",
        "description": "Beratung für Mieterrechtsfragen – günstige Mitgliedschaft",
        "url": "https://www.mieterbund.de",
    },
    "verbraucherzentrale": {
        "name": "Verbraucherzentrale",
        "description": "Unabhängige Beratung bei Verbraucherrechtsproblemen",
        "url": "https://www.verbraucherzentrale.de",
    },
    "polizei": {
        "name": "Polizei – Anzeige erstatten",
        "description": "Strafanzeige online oder bei der zuständigen Polizeidienststelle",
        "url": "https://www.polizei.de",
    },
    "gesetze_im_internet": {
        "name": "Gesetze im Internet",
        "description": "Offizielle Sammlung der deutschen Bundesgesetze",
        "url": "https://www.gesetze-im-internet.de",
    },
    "bundesrechtsanwaltskammer": {
        "name": "Anwaltssuche – BRAK",
        "description": "Suche nach zugelassenen Rechtsanwälten in Ihrer Region",
        "url": "https://www.brak.de/fuer-verbraucher/anwaltssuche/",
    },
    "arbeitsagentur": {
        "name": "Bundesagentur für Arbeit",
        "description": "Beratung zu Arbeitslosengeld, Kurzarbeit und Arbeitsrecht",
        "url": "https://www.arbeitsagentur.de",
    },
    "sozialamt": {
        "name": "Sozialamt / Jobcenter",
        "description": "Bürgergeld (SGB II), Sozialhilfe (SGB XII) und weitere Sozialleistungen",
        "url": "https://www.jobcenter.digital",
    },
    "bamf": {
        "name": "Bundesamt für Migration und Flüchtlinge (BAMF)",
        "description": "Asylverfahren, Aufenthaltstitel und Integrationsberatung",
        "url": "https://www.bamf.de",
    },
    "auslaenderbehoerde": {
        "name": "Ausländerbehörde",
        "description": "Zuständige Behörde für Aufenthalts- und Arbeitsgenehmigungen",
        "url": "https://www.bamf.de/DE/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/Migrathek/ABH/abh-node.html",
    },
}

# ---------------------------------------------------------------------------
# Base roadmap templates per case type
# ---------------------------------------------------------------------------

ROADMAP_TEMPLATES: dict[str, list[dict[str, Any]]] = {
    "criminal": [
        {
            "step_number": 1,
            "title": "Schweigerecht wahrnehmen",
            "description": "Bei polizeilicher Vernehmung: Personalien angeben, aber zur Sache schweigen (§ 136 StPO). Keine Aussage ohne Anwalt.",
            "action_items": [
                "Nur Name, Geburtsdatum und Adresse angeben",
                "Zur Sache keine Angaben machen",
                "Anwalt hinzuziehen bevor Aussagen gemacht werden",
            ],
            "deadline_days": 0,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer", "beratungshilfe"],
        },
        {
            "step_number": 2,
            "title": "Anwalt beauftragen",
            "description": "Einen Strafverteidiger oder Fachanwalt für Strafrecht beauftragen. Bei finanziellen Schwierigkeiten Beratungshilfe beantragen.",
            "action_items": [
                "Fachanwalt für Strafrecht suchen",
                "Beratungshilfe beim Amtsgericht beantragen (BerHG)",
                "Alle relevanten Dokumente sammeln",
            ],
            "deadline_days": 3,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer", "beratungshilfe"],
        },
        {
            "step_number": 3,
            "title": "Akteneinsicht beantragen",
            "description": "Nach § 147 StPO hat der Verteidiger Recht auf Einsicht in die Ermittlungsakte. Dies ist entscheidend für die Verteidigungsstrategie.",
            "action_items": [
                "Anwalt beauftragt Akteneinsicht bei der Staatsanwaltschaft",
                "Alle Beweise und Dokumente sichern",
                "Zeugenaussagen dokumentieren",
            ],
            "deadline_days": 14,
            "priority": "high",
            "resource_keys": ["gesetze_im_internet"],
        },
        {
            "step_number": 4,
            "title": "Verteidigungsstrategie entwickeln",
            "description": "Mit dem Anwalt die optimale Verteidigungsstrategie erarbeiten: Einstellung des Verfahrens (§ 153 StPO), Freispruch oder Strafminderung.",
            "action_items": [
                "Akteneinsicht auswerten",
                "Entlastungszeugen identifizieren",
                "Alibi und Gegenbeweise sammeln",
            ],
            "deadline_days": 21,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer"],
        },
        {
            "step_number": 5,
            "title": "Hauptverhandlung vorbereiten",
            "description": "Vorbereitung auf die mündliche Verhandlung vor Gericht. Prozesskostenhilfe bei Bedarf beantragen.",
            "action_items": [
                "Prozesskostenhilfe beantragen (§ 114 ZPO)",
                "Zeugen vorbereiten",
                "Verhandlungsablauf mit Anwalt besprechen",
            ],
            "deadline_days": 30,
            "priority": "medium",
            "resource_keys": ["prozesskostenhilfe", "beratungshilfe"],
        },
    ],
    "civil": [
        {
            "step_number": 1,
            "title": "Sachverhalt dokumentieren",
            "description": "Alle relevanten Dokumente, Verträge, Rechnungen und Korrespondenz sammeln und chronologisch ordnen.",
            "action_items": [
                "Verträge und Vereinbarungen sichern",
                "Zahlungsbelege und Rechnungen sammeln",
                "Schriftverkehr mit der Gegenseite archivieren",
            ],
            "deadline_days": 7,
            "priority": "high",
            "resource_keys": ["verbraucherzentrale"],
        },
        {
            "step_number": 2,
            "title": "Außergerichtliche Einigung versuchen",
            "description": "Schriftliche Aufforderung an die Gegenseite mit Fristsetzung. Bei Verbraucherstreitigkeiten Schlichtungsstelle einschalten.",
            "action_items": [
                "Mahnschreiben mit 14-Tage-Frist verfassen",
                "Per Einschreiben mit Rückschein senden",
                "Schlichtungsstelle kontaktieren (falls verfügbar)",
            ],
            "deadline_days": 14,
            "priority": "high",
            "resource_keys": ["verbraucherzentrale", "bundesrechtsanwaltskammer"],
        },
        {
            "step_number": 3,
            "title": "Rechtsberatung einholen",
            "description": "Fachanwalt für Zivilrecht konsultieren. Beratungshilfe und Prozesskostenhilfe bei Bedarf beantragen.",
            "action_items": [
                "Fachanwalt für Zivilrecht aufsuchen",
                "Beratungshilfe beim Amtsgericht beantragen",
                "Erfolgsaussichten einschätzen lassen",
            ],
            "deadline_days": 21,
            "priority": "medium",
            "resource_keys": ["beratungshilfe", "rechtsantragstelle"],
        },
        {
            "step_number": 4,
            "title": "Klage einreichen",
            "description": "Bei Streitwert bis 5.000 € ist das Amtsgericht zuständig (§ 23 GVG), darüber das Landgericht. Prozesskostenhilfe beantragen.",
            "action_items": [
                "Zuständiges Gericht ermitteln",
                "Klageschrift verfassen",
                "Prozesskostenhilfe beantragen (§ 114 ZPO)",
                "Klage fristgerecht einreichen (Verjährungsfrist beachten!)",
            ],
            "deadline_days": 60,
            "priority": "medium",
            "resource_keys": ["prozesskostenhilfe", "gesetze_im_internet"],
        },
    ],
    "administrative": [
        {
            "step_number": 1,
            "title": "Bescheid prüfen",
            "description": "Den Verwaltungsbescheid sorgfältig lesen. Auf Rechtsbehelfsbelehrung und Widerspruchsfrist (1 Monat) achten.",
            "action_items": [
                "Datum des Bescheids und Zustellungsdatum notieren",
                "Widerspruchsfrist berechnen (1 Monat ab Zustellung, § 70 VwGO)",
                "Rechtsgrundlage im Bescheid identifizieren",
            ],
            "deadline_days": 3,
            "priority": "high",
            "resource_keys": ["gesetze_im_internet", "rechtsantragstelle"],
        },
        {
            "step_number": 2,
            "title": "Widerspruch einlegen",
            "description": "Widerspruch fristgerecht einlegen (§ 68 VwGO). Frist: 1 Monat nach Zustellung des Bescheids.",
            "action_items": [
                "Widerspruchsschreiben verfassen",
                "Per Einschreiben an die erlassende Behörde senden",
                "Kopie aufbewahren (Datum des Postaufgabe nachweisbar!)",
            ],
            "deadline_days": 25,
            "priority": "high",
            "resource_keys": ["beratungshilfe", "rechtsantragstelle"],
        },
        {
            "step_number": 3,
            "title": "Begründung nachreichen",
            "description": "Ausführliche Begründung des Widerspruchs mit rechtlichen und tatsächlichen Argumenten.",
            "action_items": [
                "Rechtliche Grundlagen recherchieren",
                "Begründung mit Belegen einreichen",
                "Anwalt bei komplexen Fällen hinzuziehen",
            ],
            "deadline_days": 30,
            "priority": "medium",
            "resource_keys": ["bundesrechtsanwaltskammer", "beratungshilfe"],
        },
        {
            "step_number": 4,
            "title": "Widerspruchsbescheid abwarten / Klage",
            "description": "Die Behörde hat 3 Monate Zeit. Danach Untätigkeitsklage möglich (§ 75 VwGO). Bei Ablehnung: Klage vor Verwaltungsgericht.",
            "action_items": [
                "Widerspruchsbescheid abwarten (max. 3 Monate)",
                "Bei Ablehnung: Klage vor Verwaltungsgericht (1-Monat-Frist!)",
                "Prozesskostenhilfe beantragen",
            ],
            "deadline_days": 90,
            "priority": "medium",
            "resource_keys": ["prozesskostenhilfe", "bundesrechtsanwaltskammer"],
        },
    ],
    "housing": [
        {
            "step_number": 1,
            "title": "Mietmängel dokumentieren",
            "description": "Alle Mängel fotografisch und schriftlich dokumentieren. Datum der Erstfeststellung notieren.",
            "action_items": [
                "Mängel fotografieren und beschreiben",
                "Datum der Feststellung dokumentieren",
                "Zeugen für die Mängel benennen",
            ],
            "deadline_days": 3,
            "priority": "high",
            "resource_keys": ["mieterverein"],
        },
        {
            "step_number": 2,
            "title": "Vermieter schriftlich informieren",
            "description": "Mängelrüge per Einschreiben an den Vermieter senden mit angemessener Frist zur Mängelbeseitigung (§ 536 BGB).",
            "action_items": [
                "Mängelrüge schriftlich verfassen",
                "Per Einschreiben senden",
                "Angemessene Frist setzen (2-4 Wochen)",
                "Mietminderung ankündigen falls berechtigt",
            ],
            "deadline_days": 7,
            "priority": "high",
            "resource_keys": ["mieterverein", "gesetze_im_internet"],
        },
        {
            "step_number": 3,
            "title": "Mieterverein beitreten / Beratung",
            "description": "Mitglied im lokalen Mieterverein werden für günstige Rechtsberatung und Unterstützung.",
            "action_items": [
                "Lokalen Mieterverein kontaktieren",
                "Mitgliedschaft beantragen",
                "Rechtslage einschätzen lassen",
            ],
            "deadline_days": 14,
            "priority": "medium",
            "resource_keys": ["mieterverein", "verbraucherzentrale"],
        },
        {
            "step_number": 4,
            "title": "Rechtliche Schritte einleiten",
            "description": "Bei Nichtreaktion: Mietminderung, Zurückbehaltungsrecht oder Klage auf Mängelbeseitigung (§ 536 BGB).",
            "action_items": [
                "Mietminderung berechnen und durchführen",
                "Anwalt für Mietrecht konsultieren",
                "Klage auf Mängelbeseitigung prüfen",
            ],
            "deadline_days": 30,
            "priority": "medium",
            "resource_keys": ["mieterverein", "prozesskostenhilfe"],
        },
    ],
    "employment": [
        {
            "step_number": 1,
            "title": "Kündigung prüfen lassen",
            "description": "Kündigungsschreiben auf formelle Wirksamkeit prüfen. Kündigungsfristen und Kündigungsschutz (KSchG) beachten.",
            "action_items": [
                "Datum der Kündigung und Zustellung notieren",
                "3-Wochen-Frist für Kündigungsschutzklage merken!",
                "Betriebsrat-Anhörung prüfen (§ 102 BetrVG)",
            ],
            "deadline_days": 3,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer", "beratungshilfe"],
        },
        {
            "step_number": 2,
            "title": "Sofortige Kündigungsschutzklage (3-Wochen-Frist!)",
            "description": "KRITISCH: Kündigungsschutzklage muss innerhalb von 3 Wochen nach Zustellung der Kündigung beim Arbeitsgericht eingereicht werden (§ 4 KSchG)!",
            "action_items": [
                "Sofort Rechtsanwalt oder Gewerkschaft kontaktieren",
                "Klage beim zuständigen Arbeitsgericht einreichen",
                "Prozesskostenhilfe gleichzeitig beantragen",
            ],
            "deadline_days": 18,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer", "prozesskostenhilfe"],
        },
        {
            "step_number": 3,
            "title": "Arbeitslosengeld beantragen",
            "description": "Sofort nach Kenntnis der Kündigung bei der Bundesagentur für Arbeit melden (§ 38 SGB III). Sperrzeit bei eigener Kündigung beachten.",
            "action_items": [
                "Arbeitssuchend melden (sofort nach Kenntnisnahme!)",
                "ALG I beantragen",
                "Zeugnis beim Arbeitgeber anfordern (§ 109 GewO)",
            ],
            "deadline_days": 3,
            "priority": "high",
            "resource_keys": ["arbeitsagentur"],
        },
        {
            "step_number": 4,
            "title": "Vergleich oder Urteil",
            "description": "Im Gütetermin Vergleich mit Abfindung anstreben oder Urteil auf Weiterbeschäftigung erstreiten.",
            "action_items": [
                "Vergleichsangebot und Abfindung verhandeln",
                "Arbeitszeugnis verhandeln",
                "Weiterbeschäftigungsanspruch prüfen",
            ],
            "deadline_days": 60,
            "priority": "medium",
            "resource_keys": ["bundesrechtsanwaltskammer"],
        },
    ],
    "traffic": [
        {
            "step_number": 1,
            "title": "Bußgeldbescheid prüfen",
            "description": "Bußgeldbescheid auf Fehler prüfen. Einspruchsfrist beachten: 2 Wochen nach Zustellung (§ 67 OWiG).",
            "action_items": [
                "Zustellungsdatum und Einspruchsfrist notieren",
                "Messung und Tatvorwurf prüfen",
                "Fotos und Messdaten anfordern",
            ],
            "deadline_days": 7,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer", "beratungshilfe"],
        },
        {
            "step_number": 2,
            "title": "Einspruch einlegen",
            "description": "Einspruch gegen den Bußgeldbescheid einlegen (§ 67 OWiG). Frist: 2 Wochen. Keine Begründung erforderlich.",
            "action_items": [
                "Schriftlichen Einspruch einlegen (keine Begründung nötig)",
                "Per Einschreiben senden",
                "Fahrtenbuch und Zeugen prüfen",
            ],
            "deadline_days": 12,
            "priority": "high",
            "resource_keys": ["gesetze_im_internet"],
        },
        {
            "step_number": 3,
            "title": "Akteneinsicht beantragen",
            "description": "Einsicht in die Bußgeldakte und Messdaten beantragen. Messfehler oder Verfahrensfehler können zur Einstellung führen.",
            "action_items": [
                "Akteneinsicht bei der Bußgeldstelle beantragen",
                "Messprotokoll und Eichung des Messgeräts prüfen",
                "Spezialisierter Anwalt für Verkehrsrecht konsultieren",
            ],
            "deadline_days": 21,
            "priority": "medium",
            "resource_keys": ["bundesrechtsanwaltskammer"],
        },
    ],
    "family": [
        {
            "step_number": 1,
            "title": "Beratung beim Jugendamt / Familienberatung",
            "description": "Jugendamt und Familienberatungsstellen bieten kostenlose Unterstützung bei Trennungen, Sorgerecht und Unterhaltsstreitigkeiten.",
            "action_items": [
                "Jugendamt kontaktieren (bei Kindern betroffen)",
                "Familienberatungsstelle aufsuchen",
                "Mediation als Alternative zu Gerichtsverfahren prüfen",
            ],
            "deadline_days": 7,
            "priority": "high",
            "resource_keys": ["rechtsantragstelle", "beratungshilfe"],
        },
        {
            "step_number": 2,
            "title": "Anwalt für Familienrecht beauftragen",
            "description": "Fachanwalt für Familienrecht beauftragen. Bei Scheidungsverfahren besteht Anwaltspflicht (§ 114 FamFG).",
            "action_items": [
                "Fachanwalt für Familienrecht suchen",
                "Beratungshilfe / Verfahrenskostenhilfe beantragen",
                "Wichtige Dokumente (Heiratsurkunde, Geburtsurkunden) sammeln",
            ],
            "deadline_days": 14,
            "priority": "high",
            "resource_keys": ["bundesrechtsanwaltskammer", "beratungshilfe"],
        },
        {
            "step_number": 3,
            "title": "Unterhaltsansprüche sichern",
            "description": "Kindesunterhalt und ggf. Ehegattenunterhalt nach Düsseldorfer Tabelle berechnen und geltend machen.",
            "action_items": [
                "Einkommensnachweise beider Parteien sammeln",
                "Unterhalt nach Düsseldorfer Tabelle berechnen",
                "Unterhaltsvorschuss beim Jugendamt beantragen (für Kinder)",
            ],
            "deadline_days": 21,
            "priority": "medium",
            "resource_keys": ["sozialamt", "rechtsantragstelle"],
        },
    ],
}

# Add missing case types as fallback
for _ct in ["other", "general"]:
    ROADMAP_TEMPLATES[_ct] = ROADMAP_TEMPLATES["civil"]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def generate_roadmap(case: Case, db: AsyncSession) -> list[dict]:
    """
    Generate a personalised step-by-step legal roadmap for a case.

    Uses a base template for the case type and then asks the AI to customise
    it based on the specific details of the case.

    Returns a list of step dicts:
        {step_number, title, description, action_items, deadline_days,
         priority, resources}
    """
    log.info("generate_roadmap.start", case_id=str(case.id), case_type=case.case_type)

    base_steps = ROADMAP_TEMPLATES.get(case.case_type, ROADMAP_TEMPLATES["civil"])

    # Build context for AI customisation
    case_context = _build_case_context(case)
    base_template_json = json.dumps(base_steps, ensure_ascii=False, indent=2)

    system = """Du bist ein erfahrener Rechtsassistent in Deutschland.
Deine Aufgabe ist es, basierend auf den Falldetails einen maßgeschneiderten rechtlichen Aktionsplan zu erstellen.
Antworte ausschließlich mit einem validen JSON-Array. Keine Markdown-Codeblöcke, kein erklärender Text davor oder danach."""

    user_prompt = f"""Erstelle einen rechtlichen Aktionsplan (Roadmap) für diesen Fall.

**Falldetails:**
{case_context}

**Basis-Template (anpassen und ergänzen):**
{base_template_json}

Gib ein JSON-Array zurück. Jeder Schritt hat diese Felder:
{{
  "step_number": 1,
  "title": "Titel des Schritts",
  "description": "Ausführliche Beschreibung was zu tun ist",
  "action_items": ["Konkrete Aufgabe 1", "Konkrete Aufgabe 2"],
  "deadline_days": 7,
  "priority": "high|medium|low",
  "resources": [
    {{"name": "Ressourcenname", "description": "Beschreibung", "url": "https://..."}}
  ]
}}

Passe die Schritte an den spezifischen Fall an. Füge fall-spezifische Schritte hinzu oder entferne irrelevante.
Bei Dringlichkeit "{case.urgency}" entsprechend kürzere Fristen und höhere Prioritäten setzen.
Antwort: nur das JSON-Array, beginnend mit [ und endend mit ]"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    try:
        raw = await chat_completion(messages, temperature=0.3, max_tokens=4096)
        assert isinstance(raw, str)

        cleaned = raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            cleaned = parts[1] if len(parts) > 1 else cleaned
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()

        steps = json.loads(cleaned)
        if isinstance(steps, list):
            # Resolve resource keys to full resource objects
            enriched = _enrich_resources(steps)
            log.info("generate_roadmap.done", steps=len(enriched))
            return enriched

    except (json.JSONDecodeError, AssertionError) as exc:
        log.warning("generate_roadmap.ai_failed", error=str(exc))

    # Fallback to template
    return _build_fallback_roadmap(base_steps, case)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _build_case_context(case: Case) -> str:
    lines = [
        f"Falltyp: {case.case_type}",
        f"Titel: {case.title}",
        f"Status: {case.status}",
        f"Dringlichkeit: {case.urgency}",
    ]
    if case.description:
        lines.append(f"Beschreibung: {case.description}")
    if case.incident_date:
        days_ago = (date.today() - case.incident_date).days
        lines.append(f"Vorfallsdatum: {case.incident_date} (vor {days_ago} Tagen)")
    if case.location:
        lines.append(f"Ort: {case.location}")
    if case.opposing_party:
        lines.append(f"Gegenpartei: {case.opposing_party}")
    if case.court_name:
        lines.append(f"Gericht: {case.court_name}")
    if case.case_number:
        lines.append(f"Aktenzeichen: {case.case_number}")
    return "\n".join(lines)


def _enrich_resources(steps: list[dict]) -> list[dict]:
    """Resolve resource_keys to full resource objects if present."""
    enriched = []
    for step in steps:
        resource_keys = step.pop("resource_keys", [])
        resources = list(step.get("resources", []))
        for key in resource_keys:
            if key in GERMAN_RESOURCES and GERMAN_RESOURCES[key] not in resources:
                resources.append(GERMAN_RESOURCES[key])
        step["resources"] = resources
        enriched.append(step)
    return enriched


def _build_fallback_roadmap(base_steps: list[dict], case: Case) -> list[dict]:
    """Build a roadmap from the template when AI generation fails."""
    urgency_multiplier = {
        "critical": 0.5,
        "high": 0.7,
        "medium": 1.0,
        "low": 1.5,
    }.get(case.urgency, 1.0)

    result = []
    for step in base_steps:
        resource_keys = step.get("resource_keys", [])
        resources = [GERMAN_RESOURCES[k] for k in resource_keys if k in GERMAN_RESOURCES]

        deadline_days = int(step.get("deadline_days", 14) * urgency_multiplier)

        result.append(
            {
                "step_number": step["step_number"],
                "title": step["title"],
                "description": step["description"],
                "action_items": step.get("action_items", []),
                "deadline_days": max(1, deadline_days),
                "priority": step.get("priority", "medium"),
                "resources": resources,
            }
        )
    return result
