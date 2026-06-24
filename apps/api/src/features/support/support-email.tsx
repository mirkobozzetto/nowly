import { serverEnv } from "@nowly/env/server"
import { createEmailClient, type EmailClient } from "@opencoredev/email-sdk"
import { ses } from "@opencoredev/email-sdk/ses"
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { render } from "@react-email/render"
import type { CSSProperties, ReactElement } from "react"

const YELLOW = "#FEE961"
const redeemUrl = (): string =>
  serverEnv.SUPPORT_REDEEM_URL ?? `${serverEnv.FRONTEND_URL.replace(/\/$/, "")}/support/redeem`

let emailClient: EmailClient | null = null

const getEmailClient = (): EmailClient | null => {
  if (!serverEnv.AWS_ACCESS_KEY_ID || !serverEnv.AWS_SECRET_ACCESS_KEY || !serverEnv.AWS_REGION) return null

  emailClient ??= createEmailClient({
    adapters: [
      ses({
        accessKeyId: serverEnv.AWS_ACCESS_KEY_ID,
        secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY,
        region: serverEnv.AWS_REGION,
        sessionToken: serverEnv.AWS_SESSION_TOKEN,
        configurationSetName: serverEnv.AWS_SES_CONFIGURATION_SET,
        baseUrl: serverEnv.AWS_SES_BASE_URL,
      }),
    ],
    defaultAdapter: "ses",
    retry: { retries: 1 },
  })

  return emailClient
}

const formatDonation = (amount: string | undefined, currency: string | undefined): string | undefined => {
  if (!amount) return undefined
  return [amount, currency?.toUpperCase()].filter(Boolean).join(" ")
}

export type SupporterPassEmailInput = {
  to?: string
  donorName?: string
  code: string
  provider: "kofi" | "github" | "manual"
  amount?: string
  currency?: string
}

export type SupporterPassEmailResult =
  | { sent: true; id?: string }
  | { sent: false; reason: "missing_recipient" | "not_configured" | "send_failed"; error?: string }

export const SupporterPassEmail = ({
  code,
  donorName,
  provider,
  amount,
  currency,
}: SupporterPassEmailInput): ReactElement => {
  const name = donorName?.trim()
  const donation = formatDonation(amount, currency)
  const activationUrl = redeemUrl()
  const providerLabel = provider === "github" ? "GitHub Sponsors" : provider === "kofi" ? "Ko-fi" : "Nowly"

  return (
    <Html lang="fr">
      <Head />
      <Preview>Merci pour votre donation. Voici votre clé donateur Nowly.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.hero}>
            <Text style={styles.brand}>Nowly</Text>
            <Heading style={styles.title}>Merci.</Heading>
            <Text style={styles.lead}>
              {name ? `Merci ${name}. ` : ""}
              Quel que soit le montant de votre donation, votre soutien nous touche sincèrement et nous aide à continuer Nowly.
            </Text>
          </Section>

          <Section style={styles.card}>
            <Text style={styles.label}>Votre clé donateur</Text>
            <Text style={styles.code}>{code}</Text>
            {donation ? (
              <Text style={styles.meta}>
                Donation reçue via {providerLabel} : {donation}
              </Text>
            ) : (
              <Text style={styles.meta}>Donation reçue via {providerLabel}.</Text>
            )}

            <Button href={activationUrl} style={styles.button}>
              Activer la clé
            </Button>

            <Text style={styles.help}>
              Ouvrez ce lien avec le navigateur où l'extension Nowly est installée. Une fois la clé activée, l'extension
              affichera votre ID d'appareil pour réclamer le rôle Discord avec la commande <strong>/donator</strong>.
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :{" "}
            <Link href={activationUrl} style={styles.link}>
              {activationUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const sendSupporterPassEmail = async (input: SupporterPassEmailInput): Promise<SupporterPassEmailResult> => {
  const to = input.to?.trim()
  if (!to) return { sent: false, reason: "missing_recipient" }

  const client = getEmailClient()
  if (!client || !serverEnv.SUPPORT_EMAIL_FROM) {
    return { sent: false, reason: "not_configured" }
  }

  try {
    const email = <SupporterPassEmail {...input} to={to} />
    const [html, text] = await Promise.all([
      render(email),
      render(email, { plainText: true }),
    ])

    const result = await client.send({
      from: serverEnv.SUPPORT_EMAIL_FROM,
      to,
      replyTo: serverEnv.SUPPORT_EMAIL_REPLY_TO,
      subject: "Votre clé donateur Nowly",
      html,
      text,
      headers: {
        "X-Nowly-Email": "supporter-pass",
      },
      tags: [
        { name: "type", value: "supporter-pass" },
        { name: "provider", value: input.provider },
      ],
    }, {
      idempotencyKey: `supporter-pass:${input.provider}:${input.code}`,
    })

    return { sent: true, id: result.messageId ?? result.id }
  } catch (error) {
    return { sent: false, reason: "send_failed", error: error instanceof Error ? error.message : "Unknown email error" }
  }
}

const styles = {
  body: {
    margin: 0,
    backgroundColor: "#090A0D",
    color: "#F7F7F2",
    fontFamily: "Inter, Arial, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "40px 18px",
  },
  hero: {
    borderRadius: "18px",
    padding: "34px 28px",
    backgroundColor: "#131418",
    backgroundImage: `radial-gradient(circle at 50% 0%, ${YELLOW}4D 0, rgba(254,233,97,0) 45%)`,
    border: "1px solid rgba(254, 233, 97, 0.28)",
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.42)",
  },
  brand: {
    margin: "0 0 28px",
    color: YELLOW,
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0",
  },
  title: {
    margin: "0",
    color: "#FFFFFF",
    fontSize: "42px",
    lineHeight: "46px",
    fontWeight: 750,
    letterSpacing: "0",
  },
  lead: {
    margin: "18px 0 0",
    color: "#D9D8CF",
    fontSize: "16px",
    lineHeight: "26px",
  },
  card: {
    marginTop: "18px",
    borderRadius: "14px",
    padding: "26px",
    backgroundColor: "#111216",
    border: "1px solid rgba(255, 255, 255, 0.10)",
  },
  label: {
    margin: "0 0 10px",
    color: "#AFAEA7",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: 700,
  },
  code: {
    margin: "0",
    padding: "16px 14px",
    borderRadius: "10px",
    backgroundColor: "#07080A",
    border: "1px solid rgba(254, 233, 97, 0.32)",
    color: YELLOW,
    fontFamily: "Consolas, Menlo, monospace",
    fontSize: "20px",
    lineHeight: "26px",
    fontWeight: 700,
    textAlign: "center",
  },
  meta: {
    margin: "14px 0 0",
    color: "#BEBDB5",
    fontSize: "14px",
    lineHeight: "22px",
  },
  button: {
    display: "block",
    marginTop: "22px",
    padding: "14px 18px",
    borderRadius: "10px",
    backgroundColor: YELLOW,
    color: "#08090C",
    fontSize: "15px",
    lineHeight: "20px",
    fontWeight: 800,
    textAlign: "center",
    textDecoration: "none",
  },
  help: {
    margin: "18px 0 0",
    color: "#D9D8CF",
    fontSize: "14px",
    lineHeight: "23px",
  },
  hr: {
    margin: "26px 0 18px",
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  footer: {
    margin: 0,
    color: "#8D8C86",
    fontSize: "12px",
    lineHeight: "20px",
  },
  link: {
    color: YELLOW,
    textDecoration: "underline",
  },
} satisfies Record<string, CSSProperties>
