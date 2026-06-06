# CI/CD в Tracker Task

## Цель

CI проверяет качество кода до и после слияния в основные ветки.

## Содержание раздела

- [ci-cd-overview.md](./ci-cd-overview.md) — базовое объяснение, зачем нужен CI, какие проблемы он решает и как читать статусы.
- [deployment.md](./deployment.md) — целевая инфраструктура: stage и prod на одном VPS, GitHub Actions, SSL, реестр образов, обновление БД stage срезом из prod, защита, мониторинг.
- [release-process.md](./release-process.md) — практический гайд по релизному процессу: release-ветки, RC, smoke, теги, hotfix.
- [runbooks/cicd-start-plan.md](./runbooks/cicd-start-plan.md) — пошаговый старт внедрения CI/CD без перегруза.

## Практические шаблоны

- [runbooks/step-1-vps-bootstrap.md](./runbooks/step-1-vps-bootstrap.md) — подробный runbook Шага 1: VPS, DNS, Caddy, HTTPS.
- [runbooks/step-2-manual-stage-deploy.md](./runbooks/step-2-manual-stage-deploy.md) — подробный runbook Шага 2: ручной stage-деплой.

Шаблоны для шага 2 хранятся в `infra/deploy/stage`.

## Для команды

- Если ты впервые видишь раздел — начни с [ci-cd-overview.md](./ci-cd-overview.md).

## Где находится конфигурация

- Workflow: `.github/workflows/ci.yml`

## Когда запускается CI

Workflow запускается на событиях:

- `pull_request` в ветки `main`, `develop`
- `push` в ветки `main`, `develop`

Дополнительно настроен `paths-ignore`, поэтому CI не запускается при изменениях только в:

- `docs/**`
- `**/*.md`

## Почему есть проверка и на pull_request, и на push

- `pull_request` проверяет изменения до слияния.
- `push` проверяет итоговое состояние целевой ветки после merge (финальный merge commit).
- `push` также страхует от сценариев, когда изменения попали в ветку не через стандартный PR-поток.

## Основные quality gates

В CI настроены отдельные jobs:

1. `lint`
2. `type-check`
3. `test`
4. `build`

`build` запускается только после успешного прохождения `lint`, `type-check` и `test`.

## Требования к тестам и покрытию

- Если падает хотя бы один тест, job `test` падает, а merge блокируется (при включенной branch protection).
- Минимальный порог покрытия: 80% по `statements`, `branches`, `functions`, `lines`.
- Порог покрытий задается в общем vitest-конфиге: `packages/vitest-config/src/base.ts`.

## Какие команды выполняются

В текущем CI используются скрипты из корневого `package.json`:

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`

Для тестов также выполняется остановка тестовых контейнеров:

- `pnpm docker:test-down` с `if: always()`

## Быстрый разбор частых падений

- Упал `lint`: нарушения ESLint/стиля.
- Упал `type-check`: ошибки TypeScript типов.
- Упал `test`: упал тест или покрытие ниже 80%.
- Упал `build`: проект не собирается в одном из пакетов/приложений.

## Локальная проверка перед PR

Рекомендуемый минимум перед пушем:

1. `pnpm lint`
2. `pnpm type-check`
3. `pnpm test`
4. `pnpm build`
