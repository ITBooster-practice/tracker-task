export const overlayReducedMotionClassName =
	'motion-reduce:animate-none! motion-reduce:transition-none!'

export const overlayMotionClassName = `data-[state=open]:duration-500 data-[state=closed]:duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${overlayReducedMotionClassName}`
