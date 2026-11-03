'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface CloseRequest {
	promise: Promise<void>
	resolve: () => void
}

export function useOverlayClose(onClose: () => void, initiallyOpen = true) {
	const [open, setOpen] = useState(initiallyOpen)
	const mounted = useRef(true)
	const completed = useRef(false)
	const request = useRef<CloseRequest | null>(null)

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
			request.current?.resolve()
		}
	}, [])

	const close = useCallback(() => {
		if (!mounted.current) return Promise.resolve()
		if (request.current) return request.current.promise
		let resolve!: () => void
		const promise = new Promise<void>((done) => {
			resolve = done
		})
		request.current = { promise, resolve }
		setOpen(false)
		return promise
	}, [])

	const completeClose = useCallback(() => {
		const closing = request.current
		if (!mounted.current || completed.current || !closing) return
		completed.current = true
		try {
			onClose()
		} finally {
			closing.resolve()
		}
	}, [onClose])

	const show = useCallback(() => {
		if (request.current && !completed.current) return
		request.current = null
		completed.current = false
		setOpen(true)
	}, [])

	return { open, close, completeClose, show }
}
