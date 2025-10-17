// Minimal Telegram Web App typings used in this project.
// We only declare the parts the app currently uses. Expand as needed.

interface TelegramUser {
  id?: number | string
  first_name?: string
  last_name?: string
  username?: string
}

interface TelegramWebAppInitDataUnsafe {
  user?: TelegramUser
}

interface TelegramWebApp {
  ready: () => void
  initDataUnsafe?: TelegramWebAppInitDataUnsafe
  // add other properties/methods if/when you use them
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export {}
