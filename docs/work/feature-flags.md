# Feature Flags (Trunk Based Development)

В проекте используется система [Feature Flags](https://martinfowler.com/articles/feature-toggles.html) (Флагов Функциональности) на основе переменных окружения (`.env`).

Это критически важный инструмент для **Trunk Based Development**. Он позволяет:

1. Мержить незавершенный код в ветку `main`, не ломая продакшен.
2. Безопасно тестировать функционал (например, включить фичу только на staging-окружении).
3. Избегать долгоживущих feature-веток и тяжелых мержей (merge conflicts).
4. Быстро откатывать сломанный функционал без отката коммитов (Kill Switch).

---

## Архитектура

В условиях монорепозитория (Turborepo), логика работы с флагами вынесена в библиотеку `@repo/shared` для избежания дублирования кода и соблюдения инкапсуляции. При этом списки фич (словари) строго разделены между фронтендом и бэкендом (чтобы не допустить утечку секретных флагов бэкенда в клиентский бандл).

### Как добавить новый флаг (Frontend)

1. Откройте `apps/web/.env.example` (и ваш локальный `.env`) и добавьте переменную с префиксом `NEXT_PUBLIC_`:

```env
NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=true
```

2. Откройте реестр фич фронтенда `apps/web/lib/feature-flags.ts` и зарегистрируйте флаг:

```typescript
export const FEATURES = {
	// ... старые фичи
	NEW_DASHBOARD: process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
} as const
```

3. Используйте строго типизированный хук в React-компонентах:

```tsx
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export const Sidebar = () => {
	const isNewDashboardEnabled = useFeatureFlag('NEW_DASHBOARD')

	return (
		<aside>{isNewDashboardEnabled ? <NewDashboardLink /> : <OldDashboardLink />}</aside>
	)
}
```

> **Важно по Next.js:** Значения `NEXT_PUBLIC_` переменных "сохраняются" в бандл на этапе сборки (`next build`). Изменение флага в рантайме в production не сработает — потребуется пересборка.

---

### Как добавить новый флаг (Backend - NestJS)

1. Откройте `apps/api/.env.example` и добавьте переменную (префикс `NEXT_PUBLIC_` не нужен):

```env
ENABLE_NEW_BILLING=false
```

2. Зарегистрируйте флаг в реестре бэкенда `apps/api/src/common/feature-flags.ts`:

```typescript
export const FEATURES = {
	// ... старые фичи
	NEW_BILLING: process.env.ENABLE_NEW_BILLING === 'true',
} as const

// ...
```

3. Импортируйте `isFeatureEnabled` (экспортируемый из этого же файла), чтобы проверить статус фичи:

```typescript
import { isFeatureEnabled } from '@/common/feature-flags'

if (isFeatureEnabled('NEW_BILLING')) {
	// Новая логика
}
```

> **Совет по Security:** Всегда скрывайте "недопечённые" эндпоинты через Guards на бэкенде. Скрытие кнопки на фронтенде не мешает злоумышленнику послать POST-запрос.

---

## Best Practices в команде

1. **Флаги должны быть временными.** Если фича полностью запущена и работает стабильно — создайте технический тикет на удаление флага и старого (`else`) кода. Не копите мертвый код.
2. **Атомарность.** Не пытайтесь использовать один флаг (например `FEATURE_REDESIGN`) на 10 независимых задач. Используйте гранулярные флаги.
3. **Безопасные дефолты.** Если `process.env.FEATURE_X` не определен (например, из-за ошибки в CI/CD), система должна считать фичу выключенной `false`, чтобы не разломать production. Утилита из `@repo/shared` обрабатывает это автоматически:
   `return features[featureName] ?? false;`

---

## Важно: Turborepo Caching (`turbo.json`)

Так как весь монорепозиторий управляется бандлером **Turborepo**, он кэширует результаты сборок (`.next`, `dist` и т.д.).
Чтобы Turborepo понимал, когда нужно "инвалидировать" (сбросить) кэш из-за того, что значение фичи-флага поменялось в CI/CD или локально, мы **обязаны** декларировать все новые `ENV` переменные в файле `turbo.json` в массиве `globalEnv`:

```json
  "globalEnv": [
    "DATABASE_URL",
    "ENABLE_AUTH",
    "ENABLE_WEBHOOKS",
    "NEXT_PUBLIC_FEATURE_AUTH",
    "NEXT_PUBLIC_FEATURE_NEW_DASHBOARD"
  ],
```

**Если этого не сделать:**
Turborepo возьмет старый кэш сборки, даже если вы поменяли флаг с `true` на `false`, и код `NEXT_PUBLIC_` сохранится со старым результатом. В логах CI вы увидите предупреждение: `ENABLE_AUTH is not listed as a dependency in turbo.json`.
