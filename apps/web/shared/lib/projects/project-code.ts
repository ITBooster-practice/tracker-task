export const PROJECT_CODE_MIN_LENGTH = 2
export const PROJECT_CODE_MAX_LENGTH = 4

function isAllowedProjectCodeChar(char: string) {
	const codePoint = char.codePointAt(0)

	if (codePoint === undefined) {
		return false
	}

	const isLatinUppercaseLetter = codePoint >= 65 && codePoint <= 90
	const isCyrillicUppercaseLetter = codePoint >= 1040 && codePoint <= 1071
	const isYoLetter = codePoint === 1025

	return isLatinUppercaseLetter || isCyrillicUppercaseLetter || isYoLetter
}

export function normalizeProjectCodeInput(value: string) {
	let normalizedCode = ''

	for (const char of value.toUpperCase()) {
		if (!isAllowedProjectCodeChar(char)) {
			continue
		}

		normalizedCode += char

		if (normalizedCode.length === PROJECT_CODE_MAX_LENGTH) {
			break
		}
	}

	return normalizedCode
}

export function isValidProjectCode(value: string) {
	const normalizedCode = value.trim().toUpperCase()

	if (
		normalizedCode.length < PROJECT_CODE_MIN_LENGTH ||
		normalizedCode.length > PROJECT_CODE_MAX_LENGTH
	) {
		return false
	}

	for (const char of normalizedCode) {
		if (!isAllowedProjectCodeChar(char)) {
			return false
		}
	}

	return true
}
