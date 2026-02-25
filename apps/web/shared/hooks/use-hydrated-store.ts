'use client'

import { useEffect, useState } from 'react'

export const useHydratedStore = <T, F>(
	store: (callback: (state: T) => unknown) => unknown,
	selector: (state: T) => F,
): F | undefined => {
	// 1. Достаем сырое значение из стора
	const result = store(selector) as F

	// 2. Флаг, который скажет нам: "браузер отрендерил компонент?"
	const [isHydrated, setIsHydrated] = useState(false)

	// 3. useEffect работает ТОЛЬКО в браузере и ТОЛЬКО после первого рендера
	useEffect(() => {
		setIsHydrated(true)
	}, [])

	// 4. Если мы на сервере или это самый первый render в браузере —
	// отдаем undefined (чтобы верстка совпала с сервером).
	// Как только отработает useEffect, произойдет ререндер с реальными данными.
	return isHydrated ? result : undefined
}
