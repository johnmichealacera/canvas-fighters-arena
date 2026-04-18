# Fonts and offline builds

This project does not currently use `next/font/google`. If you add it later, Next.js downloads font files at **build time** and embeds them in the `.next` output, so the **Electron / Windows package stays offline-capable** as long as the machine that runs `npm run electron:build` had network access during `next build`.
