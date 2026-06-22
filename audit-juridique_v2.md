# Nowly — Audit Juridique v2

> Document de travail interne — 22 juin 2026  
> Basé sur l'état actuel de la branche (commit `8af3759`)  
> Comparé à l'audit v1 du même jour

---

## Légende

| Niveau | Signification |
|--------|---------------|
| 🔴 CRITIQUE | Violation légale potentielle — action immédiate |
| 🟠 SÉRIEUX | Non-conformité RGPD — correctif sous 30 jours |
| 🟡 MINEUR | Incohérence ou amélioration recommandée |
| ✅ CONFORME | Aucune action requise |
| 🆕 NOUVEAU | Point non présent dans l'audit v1 |

---

## 1. Évolutions depuis l'audit v1

### Ce qui a changé dans le code

| Commit | Impact légal |
|--------|-------------|
| `refactor: rename native host to Nowly Host` | ✅ Les textes légaux ont été mis à jour en conséquence (politique de confidentialité, CGU, mentions légales) |
| `feat(extension): add diagnostics module and developer mode` | 🆕 Nouveau module exposant des données techniques — à documenter |
| `refactor(extension): rewrite onboarding to guided 6-step` | 🆕 L'onboarding mentionne les `userScripts` et les analytics — cohérence à vérifier avec les textes légaux |
| `feat(extension): add update notification banner` | ✅ Pas d'impact légal |
| `feat(web): add extension diagnostic and presence setup card` | ✅ Pas d'impact légal |

### Ce qui n'a pas été corrigé depuis v1

Aucun des points critiques ou sérieux identifiés dans l'audit v1 n'a été traité. Tous sont reconduits ci-dessous avec leur statut à jour.

---

## 2. Résumé exécutif

| Domaine | Statut | Δ vs v1 |
|---------|--------|---------|
| Licence du code source | 🔴 CRITIQUE | Inchangé |
| Mentions légales (LCEN) | ✅ CONFORME | Inchangé |
| Branding "Nowly Host" | ✅ CONFORME | ✅ Corrigé dans tous les textes |
| Âge minimum / consentement | 🔴 CRITIQUE | Inchangé |
| Base légale RGPD (art. 13/14) | 🟠 SÉRIEUX | Inchangé |
| Durée de conservation | 🟠 SÉRIEUX | Inchangé |
| Transferts hors UE (CCT) | 🟠 SÉRIEUX | Inchangé |
| Permission `<all_urls>` | 🟠 SÉRIEUX | Inchangé |
| Permission `userScripts` | 🟠 SÉRIEUX 🆕 | Nouveau point |
| API self-hosted (override URL) | 🟠 SÉRIEUX 🆕 | Nouveau point |
| Sécurité endpoints analytics | 🟠 SÉRIEUX | Inchangé |
| Mode développeur / logs analytics | 🟡 MINEUR 🆕 | Nouveau point |
| Date mentions légales | 🟡 MINEUR | Inchangé |
| Durée cookie `locale` | 🟡 MINEUR | Inchangé |
| Export données (portabilité) | 🟡 MINEUR | Inchangé |

---

## 3. Points Critiques 🔴 (reconduits de v1)

### 3.1 — Absence de fichier LICENSE

**Statut :** Toujours absent. `git ls-files LICENSE` renvoie rien.

**Problème**

Les CGU et les mentions légales affirment que Nowly est distribué sous « licence open source disponible sur GitHub ». Aucun fichier `LICENSE` n'existe à la racine du dépôt ni dans aucun sous-package. Sans licence explicite, le code est protégé par le droit d'auteur par défaut (tous droits réservés — art. L111-1 CPI).

**Licence recommandée : Business Source License 1.1 (BUSL-1.1)**

Correspond à votre intention : usage personnel libre, revente/déploiement commercial interdit. Passage automatique sous MIT au bout de 4 ans.

**Fichiers à créer / modifier**

| Fichier | Modification |
|---------|-------------|
| `LICENSE` (racine) | Créer avec le texte BUSL 1.1 (voir section 6) |
| `package.json` (racine) | Ajouter `"license": "BUSL-1.1"` et `"author": "Anthony Lejeune"` |
| `apps/api/package.json` | Ajouter `"license": "BUSL-1.1"` |
| `apps/web/package.json` | Ajouter `"license": "BUSL-1.1"` |
| `apps/extension/package.json` | Ajouter `"license": "BUSL-1.1"` |
| `packages/env/package.json` | Ajouter `"license": "BUSL-1.1"` |
| `packages/websites/package.json` | Ajouter `"license": "BUSL-1.1"` |
| `packages/internal-cli/package.json` | Ajouter `"license": "BUSL-1.1"` |
| `messages/*/tos-page` § License | Remplacer `"applicable license"` / `"licence applicable"` par `"Business Source License 1.1"` |
| `messages/*/legal-notice-page` § Intellectual Property | Remplacer `"open-source licence"` par `"Business Source License 1.1"` |

---

### 3.2 — Âge minimum : incohérence droit français / RGPD

**Statut :** Toujours 13 ans dans les textes. Non corrigé.

**Problème**

Les CGU mentionnent **13 ans** comme seuil minimum puis précisent que les moins de 15 ans doivent avoir le consentement parental — formulation contradictoire non conforme à l'article 45 de la Loi Informatique et Libertés (France) qui fixe le seuil à **15 ans**.

**Fichiers à modifier**

| Fichier | Modification |
|---------|-------------|
| `messages/fr-FR.json` → `tos-page` § Âge minimum | Remplacer `13 ans` par `15 ans`. Supprimer la référence à 13 ans. |
| `messages/en-US.json` → `tos-page` § Minimum Age | Remplacer `13` par `15` |
| `messages/es-ES.json` → `tos-page` § Edad mínima | Même correction en espagnol |

**Texte corrigé (français)**

```
Le service est réservé aux personnes âgées d'au moins 15 ans.
Si vous avez moins de 15 ans, vous devez avoir obtenu le consentement
exprès de votre représentant légal avant d'utiliser la fonctionnalité
de connexion Discord. L'utilisation de Nowly suppose également le
respect des conditions d'utilisation de Discord dans votre pays.
```

---

## 4. Points Sérieux 🟠

### 4.1 — Absence de base légale explicite (RGPD art. 13 §1c)

**Statut :** Non corrigé depuis v1.

Le RGPD impose d'indiquer la base juridique de chaque traitement dans la politique de confidentialité.

**Bases légales à ajouter dans `messages/*/privacy-page`**

| Traitement | Base légale | Référence RGPD |
|-----------|------------|---------------|
| Authentification Discord (avis) | Exécution d'un contrat | Art. 6 §1(b) |
| Stockage Discord ID / username / avatar | Exécution d'un contrat | Art. 6 §1(b) |
| Analytics anonymes (opt-in) | Consentement | Art. 6 §1(a) |
| Proxy d'images (miniatures tierces) | Intérêt légitime | Art. 6 §1(f) |
| Cookie `nowly_oauth_state` (CSRF) | Intérêt légitime (sécurité) | Art. 6 §1(f) |
| Cookie `locale` (préférence) | Intérêt légitime | Art. 6 §1(f) |

**→ Ajouter une section « Base légale des traitements » dans la politique de confidentialité.**

---

### 4.2 — Absence de durée de conservation (RGPD art. 13 §2a)

**Statut :** Non corrigé depuis v1.

**Durées à définir et documenter**

| Donnée | Durée recommandée |
|--------|------------------|
| Discord ID / username / avatar (avis) | Jusqu'à suppression de l'avis, ou 3 ans après dernière activité |
| Commentaires publiés | Jusqu'à suppression explicite par l'utilisateur |
| Événements analytics | Purge automatique après 12 mois |
| JWT | 30 jours (déjà mentionné — conserver) |

**→ Ajouter une section « Durées de conservation » dans `messages/*/privacy-page`.**

---

### 4.3 — Transferts hors UE sans mécanisme mentionné (RGPD Chap. V)

**Statut :** Non corrigé depuis v1.

Railway (San Francisco) et Cloudflare (San Francisco) sont des prestataires américains cités sans mention du mécanisme juridique de transfert.

- **Railway** : utilise les Clauses Contractuelles Types (CCT) — source : railway.com/legal/privacy
- **Cloudflare** : CCT + UK-US Data Privacy Framework — source : cloudflare.com/trust-hub/gdpr/

**→ Dans `messages/*/privacy-page` § Services tiers, ajouter après chaque prestataire :** _« Les transferts vers les États-Unis sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission européenne. »_

---

### 4.4 — Permission `<all_urls>` : disclosure insuffisante

**Statut :** Non corrigé depuis v1.

Le manifeste déclare `"host_permissions": ["<all_urls>"]` et un content script injecté sur toutes les pages. La politique de confidentialité ne précise pas explicitement que le script est actif sur chaque page visitée.

**→ Dans `messages/*/privacy-page` § Extension navigateur, ajouter :** _« Un script léger est injecté sur toutes les pages visitées afin de détecter les plateformes supportées. Il ne collecte aucune donnée en dehors des plateformes reconnues. »_

---

### 4.5 — Permission `userScripts` non documentée dans les textes légaux 🆕

**Statut :** Nouveau point identifié en v2.

**Problème**

Le manifeste déclare la permission `"userScripts"`, qui est l'une des permissions les plus sensibles du Chrome Web Store — elle permet l'exécution de JavaScript arbitraire dans les pages web. Elle est désormais **explicitement expliquée dans l'onboarding** de l'extension :

> _"Nowly uses user scripts to run presences on supported websites."_  
> _"Installed presences are signed and verified locally before they run."_

Cette information est présente dans l'UI de l'extension mais **absente de la politique de confidentialité du site web**. C'est un manque de cohérence entre le discours de l'onboarding et la politique légale officielle.

Par ailleurs, le Chrome Web Store impose une justification explicite pour `userScripts` dans la politique de confidentialité publiée sur le store.

**Fichiers à modifier**

| Fichier | Modification |
|---------|-------------|
| `messages/*/privacy-page` § Extension navigateur | Ajouter : _« L'extension utilise la permission User Scripts pour exécuter les scripts de présences sur les sites compatibles. Chaque script est signé cryptographiquement (ECDSA P-256) et vérifié localement avant exécution — aucun script non autorisé ne peut s'exécuter. »_ |

---

### 4.6 — Fonctionnalité "Override API URL" : absence de clause de responsabilité 🆕

**Statut :** Nouveau point identifié en v2.

**Problème**

L'extension expose un paramètre `api-base-url` permettant de pointer vers une instance auto-hébergée :

```
"api-base-url": "API Base URL"
"api-base-url-description": "Override the default API URL for self-hosted instances."
```

Lorsqu'un utilisateur configure une URL tierce, **la politique de confidentialité de Nowly ne s'applique plus** au serveur ciblé. Nowly n'a aucun contrôle sur la collecte de données opérée par un serveur tiers.

Les CGU actuelles ne mentionnent pas ce cas de figure, ce qui crée un risque : un utilisateur pourrait se retourner contre Nowly pour des pratiques de données d'un serveur qu'il a lui-même configuré.

**Fichiers à modifier**

| Fichier | Modification |
|---------|-------------|
| `messages/*/tos-page` § Utilisation responsable | Ajouter un point : _« Si vous configurez une URL d'API personnalisée, vous êtes seul responsable du serveur tiers ciblé. La présente politique de confidentialité ne s'applique pas aux serveurs que vous hébergez ou configurez vous-même. »_ |
| `messages/*/privacy-page` | Ajouter une note dans la section Services tiers précisant que l'override d'URL sort du périmètre de la présente politique |

---

### 4.7 — Endpoints analytics non authentifiés (RGPD art. 32)

**Statut :** Non corrigé depuis v1.

Les routes `POST /analytics/consent`, `DELETE /devices/:deviceId` et `GET /analytics/device/:id/export` ne requièrent aucune authentification. Un tiers connaissant un `deviceId` peut modifier le consentement ou supprimer les données d'un autre utilisateur.

**→ Dans `apps/api/src/features/analytics/analytics.routes.ts` : ajouter un mécanisme d'autorisation minimal** (ex. token HMAC signé délivré par l'extension à l'installation).

---

## 5. Points Mineurs 🟡

### 5.1 — Mode développeur et onglet "Analytics logs" 🆕

**Statut :** Nouveau point identifié en v2.

L'extension expose désormais un onglet « Analytics logs » visible en mode développeur. Cet onglet affiche vraisemblablement les événements analytics collectés. La politique de confidentialité ne mentionne pas l'existence de cet outil de transparence, alors qu'il constitue un moyen supplémentaire pour l'utilisateur d'exercer son droit d'accès (RGPD art. 15).

**→ Dans `messages/*/privacy-page` § Vos droits (RGPD) : mentionner que le mode développeur donne accès aux logs analytics locaux.**

---

### 5.2 — Date des mentions légales (reconduit de v1)

La date des mentions légales (15 juin 2026) est antérieure aux CGU et à la politique de confidentialité (18 juin 2026).

**→ Dans `messages/*/legal-notice-page` `last-updated` : harmoniser à 18 juin 2026.**

---

### 5.3 — Durée du cookie `locale` vague (reconduit de v1)

La durée est décrite comme « session ou persistant selon votre navigateur » sans précision de la valeur réelle.

**→ Dans `messages/*/cookies-page` § Cookie `locale` : préciser la durée exacte configurée dans le code.**

---

### 5.4 — Portabilité décrite comme manuelle alors qu'elle est automatisée (reconduit de v1)

La politique indique que les données sont fournies « sur demande » en JSON, alors que la page `/consent` offre déjà un export automatique.

**→ Dans `messages/*/privacy-page` § Vos droits : remplacer « sur demande » par une mention de l'export en libre-service disponible sur `/consent`.**

---

## 6. Points confirmés conformes ✅

| Point | Statut |
|-------|--------|
| Mentions légales (LCEN) — données éditeur | ✅ Conforme. `injectPublisherInfo()` injecte correctement nom, SIREN, adresse, email et région Railway. |
| Branding "Nowly Host" | ✅ Corrigé dans tous les textes légaux (politique de confidentialité, CGU, mentions légales). |
| Cookie `nowly_oauth_state` | ✅ HttpOnly, SameSite=Lax, 10 min, supprimé après login — conforme. |
| Signature ECDSA des présences | ✅ Mentionnée dans la politique de confidentialité et dans l'onboarding. |
| JWT dans le fragment URL | ✅ Évite les logs serveur — bonne pratique sécurité. |
| Anonymisation des avis (HMAC-SHA256) | ✅ Correctement décrite et implémentée. |
| Suppression des données utilisateur | ✅ Route DELETE fonctionnelle, UI de suppression présente dans `/consent`. |
| DPO | ✅ Non obligatoire pour une micro-entreprise sans traitement de données sensibles à grande échelle. |
| Région Railway | ✅ EU West (Amsterdam, Netherlands) — données hébergées dans l'UE. |

---

## 7. Plan d'action priorisé (v2)

| # | Priorité | Action | Fichier(s) | Délai |
|---|---------|--------|-----------|-------|
| 1 | 🔴 | Créer le fichier LICENSE (BUSL 1.1) | `LICENSE` (racine) | Immédiat |
| 2 | 🔴 | Ajouter `license` dans tous les package.json | `*/package.json` (×7) | Immédiat |
| 3 | 🔴 | Corriger l'âge minimum à 15 ans | `messages/*/tos-page` | Immédiat |
| 4 | 🟠 | Documenter la permission `userScripts` | `messages/*/privacy-page` | < 15 jours |
| 5 | 🟠 | Ajouter clause de responsabilité override API URL | `messages/*/tos-page` + `privacy-page` | < 15 jours |
| 6 | 🟠 | Ajouter les bases légales RGPD | `messages/*/privacy-page` | < 15 jours |
| 7 | 🟠 | Ajouter les durées de conservation | `messages/*/privacy-page` | < 15 jours |
| 8 | 🟠 | Mentionner les CCT pour Railway et Cloudflare | `messages/*/privacy-page` | < 15 jours |
| 9 | 🟠 | Renforcer la disclosure `<all_urls>` | `messages/*/privacy-page` | < 30 jours |
| 10 | 🟠 | Sécuriser les endpoints analytics | `apps/api/analytics.routes.ts` | < 30 jours |
| 11 | 🟡 | Mentionner le mode développeur dans les droits RGPD | `messages/*/privacy-page` | < 60 jours |
| 12 | 🟡 | Harmoniser les dates des textes légaux | `messages/*/legal-notice-page` | < 60 jours |
| 13 | 🟡 | Préciser la durée du cookie `locale` | `messages/*/cookies-page` | < 60 jours |
| 14 | 🟡 | Mentionner l'export automatique des données | `messages/*/privacy-page` | < 60 jours |

---

## 8. Modèle de fichier LICENSE (BUSL 1.1)

```
Business Source License 1.1

Parameters

Licensor:             Anthony Lejeune
Licensed Work:        Nowly
                      The Licensed Work is (c) 2024–2026 Anthony Lejeune.
Additional Use Grant: You may make production use of the Licensed Work for
                      personal, non-commercial purposes only. Commercial use,
                      including offering the Licensed Work or a derivative work
                      as a paid service, product, or managed offering, requires
                      a separate commercial licence from the Licensor.
Change Date:          Four years from the date the Licensed Work is first
                      publicly distributed (no earlier than 2028-06-01).
Change License:       MIT

For information about alternative licensing arrangements for the Licensed Work,
please contact: contact@q-kimi.fr

---

Business Source License 1.1 — Full Text

The Licensor hereby grants you the right to copy, modify, create derivative
works, redistribute, and make non-production use of the Licensed Work. The
Licensor may make an Additional Use Grant, above, permitting limited production
use.

Effective on the Change Date, or the fourth anniversary of the first publicly
available distribution of a specific version of the Licensed Work under this
License, whichever comes first, the Licensor hereby grants you rights under the
terms of the Change License, and the rights granted in the paragraph above
terminate.

If your use of the Licensed Work does not comply with the requirements
currently in effect as described in this License, you must purchase a
commercial license from the Licensor, its affiliated entities, or authorised
resellers, or you must refrain from using the Licensed Work.

All copies of the original and modified Licensed Work, and derivative works of
the Licensed Work, are subject to this License. This License does not grant you
any right in any trademark or logo of the Licensor or its affiliates.

TO THE EXTENT PERMITTED BY APPLICABLE LAW, THE LICENSED WORK IS PROVIDED ON
AN "AS IS" BASIS. LICENSOR HEREBY DISCLAIMS ALL WARRANTIES AND CONDITIONS,
EXPRESS OR IMPLIED, INCLUDING (WITHOUT LIMITATION) WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND TITLE.
```

---

*Ce document identifie des risques juridiques potentiels mais ne constitue pas un avis juridique formel. Pour toute décision engageant ta responsabilité légale, consulte un avocat spécialisé en droit numérique.*
