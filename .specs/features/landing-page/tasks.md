# Tasks — Landing page pública (SEO)

- [ ] T1 Spec registrada (`.specs/features/landing-page/spec.md`)
- [ ] T2 `front/src/index.html`: `<base href="/app/">`
- [ ] T3 `front/landing/index.html`: landing estática (SEO + marca + CTA → `/app/`)
- [ ] T4 `front/landing/robots.txt` e `front/landing/sitemap.xml`
- [ ] T5 `front/scripts/deploy-build.mjs`: move bundle p/ `app/`, copia landing/SEO p/ raiz
- [ ] T6 `front/package.json`: script `build:deploy`
- [ ] T7 `front/vercel.json`: build command, output dir e rewrite `/app/:path*`
- [ ] T8 `back/app/routers/auth.py`: redirect OAuth → `/app/auth/callback`
- [ ] T9 Validar: `npm run build` + `npm test` (ChromeHeadless) + estrutura de `dist`
- [ ] T10 Atualizar `DEPLOY.md`, `STATE.md`, `ROADMAP.md`
- [ ] T11 Commit + push (branch develop)
