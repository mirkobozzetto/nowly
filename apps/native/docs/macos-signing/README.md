# macOS signing + notarization - Guide team

But: signer et notariser le native host macOS (Developer ID, distribution hors App Store)
de facon automatique dans le CI. Une fois en place, n'importe quel dev cut une release
en poussant un tag. Aucune cle ne circule entre les devs.

## TL;DR

1. L'admin (Mirko) fait le setup one-time: creer le cert Developer ID, exporter le `.p12`,
   renseigner les GitHub Secrets (table plus bas).
2. Copier `release-macos.yml` dans `.github/workflows/`.
3. Cut une release: `git tag host-macos-v1.3.0 && git push origin host-macos-v1.3.0`.
   Le CI build le binaire universel, signe, notarise, staple, et publie la DMG sur la release GitHub.

---

## Les fichiers: lesquels servent ?

| Fichier | Role | Garder ? |
|---|---|---|
| `AuthKey_MHV46DCLJ2.p8` | Cle privee App Store Connect API, sert a `notarytool` | OUI -> secret `APPLE_API_KEY_P8` |
| `nowly.certSigningRequest` (CSR) | Sert UNE fois a generer le cert Developer ID sur le portail Apple | NON, jetable apres |
| `.p12` (a creer) | Cert Developer ID Application **+ cle privee**, sert a `codesign` | OUI -> secret `APPLE_CERT_P12_BASE64` |

Le CSR genere une cle privee localement dans ton Keychain (la moitie publique part dans le CSR).
Apple te renvoie le `.cer` (public). Pour signer ailleurs (CI), tu exportes cert + cle privee
ensemble en `.p12`. C'est ce `.p12` qui compte, pas le CSR.

## Securite (non negociable)

- Ne JAMAIS committer `.p8` / `.p12` / `.cer` dans le repo. Pas dans ce dossier non plus.
- Les cles vont uniquement dans **GitHub Secrets** (Settings -> Secrets and variables -> Actions).
- `.p8` non re-telechargeable: garde une copie hors-repo (gestionnaire de mots de passe).
- La team n'a pas besoin des cles brutes: l'admin set les secrets une fois, les devs releasent via tag.

---

## Setup one-time (admin)

### 1. Creer le cert Developer ID Application
https://developer.apple.com/account/resources/certificates/list
-> "+" -> "Developer ID Application" -> upload le CSR `nowly.certSigningRequest` -> Download le `.cer`.
Double-clic le `.cer` pour l'installer dans le Keychain (login).

Verifier:
```bash
security find-identity -v -p codesigning
# doit lister: "Developer ID Application: Mirko Bozzetto (R477R8NK27)"
```

### 2. Exporter le `.p12`
Keychain Access -> categorie "My Certificates" -> clic droit sur "Developer ID Application: ..."
-> Export -> format `.p12` -> mettre un mot de passe (= `APPLE_CERT_PASSWORD`).

### 3. Encoder en base64 pour les secrets
```bash
base64 -i cert.p12 | pbcopy                          # -> APPLE_CERT_P12_BASE64
base64 -i AuthKey_MHV46DCLJ2.p8 | pbcopy             # -> APPLE_API_KEY_P8
```

### 4. Renseigner les GitHub Secrets

| Secret | Valeur | Ou la trouver |
|---|---|---|
| `APPLE_API_KEY_ID` | `MHV46DCLJ2` | nom du fichier `.p8` |
| `APPLE_API_ISSUER_ID` | `577952ce-234c-4466-ace8-ec263a6f2dfa` | App Store Connect -> Users and Access -> Integrations -> App Store Connect API (en haut) |
| `APPLE_API_KEY_P8` | base64 du `.p8` | etape 3 |
| `APPLE_CERT_P12_BASE64` | base64 du `.p12` | etape 3 |
| `APPLE_CERT_PASSWORD` | mot de passe du `.p12` | choisi a l'export (etape 2) |
| `APPLE_TEAM_ID` | `R477R8NK27` | visible dans le nom du cert / https://developer.apple.com/account -> Membership |
| `KEYCHAIN_PASSWORD` | au choix (mot de passe keychain temporaire CI) | invente-le |

GOTCHA notarisation: `notarytool` exige une **Team Key** (permission Developer), pas une
Individual/Personal Key (onglet People). Une Individual Key renvoie `401 Unauthorized`.
Verifie que `AuthKey_MHV46DCLJ2` vient de l'onglet **Integrations -> Team Keys**.

---

## Installer le workflow

Copier `release-macos.yml` (a cote de ce README) dans `.github/workflows/`.
Il ne touche pas a `host-release.yml` existant: trigger distinct sur tag `host-macos-v*`.

## Cut une release

```bash
git tag host-macos-v1.3.0
git push origin host-macos-v1.3.0
```

Le CI: build universel (Intel + Apple Silicon) -> sign Developer ID -> notarize (Apple) ->
staple -> publie `NowlyHost-macos.dmg` sur la release GitHub.

Verifier une DMG signee + notarisee localement:
```bash
codesign --verify --strict --verbose=2 "Nowly Host.app"
spctl -a -t open --context context:primary-signature -v NowlyHost-macos.dmg   # doit dire "accepted"
xcrun stapler validate NowlyHost-macos.dmg
```

---

## FAQ

**Si un dev modifie le code Go, faut re-signer ?**
Oui, a chaque build: la signature est un hash du binaire, tout changement l'invalide.
MAIS le cert et le `.p8` se **reutilisent** (cert valable ~5 ans). Pas de nouveau cert par
changement. Et comme c'est dans le CI, personne ne re-signe a la main: push un tag, le CI signe.

**Le cert expire, et apres ?**
Recreer un cert Developer ID (nouveau CSR), re-exporter le `.p12`, remettre a jour
`APPLE_CERT_P12_BASE64` + `APPLE_CERT_PASSWORD`. Le reste ne bouge pas.

**`notarytool` renvoie 401 / Unauthorized**
Tu utilises une Individual Key. Genere une **Team Key** (Integrations -> Team Keys,
permission Developer) et refais `APPLE_API_KEY_ID` / `APPLE_API_KEY_P8`.

## Liens

- API keys (Issuer/Key ID): https://appstoreconnect.apple.com/access/integrations/api
- Creer une API key (doc Apple): https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/
- Certificats Developer ID: https://developer.apple.com/account/resources/certificates/list
- notarytool (man): https://keith.github.io/xcode-man-pages/notarytool.1.html
- Installer un cert Apple en CI (GitHub docs): https://docs.github.com/en/actions/deployment/deploying-xcode-applications
