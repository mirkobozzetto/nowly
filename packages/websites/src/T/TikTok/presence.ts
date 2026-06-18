import { handleUpdate } from "./utils/activity"

const settings = Presence.Settings({
  privacy: {
    type: "boolean",
    default: false,
    label: {
      "en-US": "Privacy mode",
      "fr-FR": "Mode privÃ©",
      "es-ES": "Modo privado",
    },
    description: {
      "en-US": "Hide all details about the content you're watching.",
      "fr-FR": "Cache tous les dÃ©tails du contenu que vous regardez.",
      "es-ES": "Oculta todos los detalles del contenido que estÃ¡s viendo.",
    },
  },
  showButtons: {
    type: "boolean",
    default: true,
    label: {
      "en-US": "Show buttons",
      "fr-FR": "Afficher les boutons",
      "es-ES": "Mostrar botones",
    },
    description: {
      "en-US": "Show action buttons (view video, view profile) in your presence.",
      "fr-FR": "Affiche les boutons d'action (voir la vidÃ©o, voir le profil) dans votre prÃ©sence.",
      "es-ES": "Muestra botones de acciÃ³n (ver video, ver perfil) en tu presencia.",
    },
  },
  showProfileUsernames: {
    type: "boolean",
    default: true,
    label: {
      "en-US": "Show profile info",
      "fr-FR": "Afficher les infos du profil",
      "es-ES": "Mostrar informaciÃ³n del perfil",
    },
    description: {
      "en-US": "Show profile usernames when browsing profiles.",
      "fr-FR": "Affiche les noms d'utilisateur lors de la navigation sur les profils.",
      "es-ES": "Muestra los nombres de usuario al navegar por los perfiles.",
    },
  },
})

const presence = new Presence(settings)

presence.on("UpdateData", async (ctx) => handleUpdate(presence, ctx))
