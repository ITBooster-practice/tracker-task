'use client'

import { useState, type Ref } from 'react'

import {
	Button,
	ChoiceGroup,
	ChoiceGroupItem,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Label,
} from '@repo/ui'
import { UserRound, UserRoundMinus } from '@repo/ui/icons'

const visibleLimit = 10

interface TaskAssigneeChoicesProps {
	value: string | null | undefined
	onChange: (value: string | null) => void
	onBlur: () => void
	inputRef: Ref<HTMLButtonElement>
	members: { userId: string; name: string | null }[]
	disabled: boolean
}

export function TaskAssigneeChoices({
	value,
	onChange,
	onBlur,
	inputRef,
	members,
	disabled,
}: TaskAssigneeChoicesProps) {
	const [expanded, setExpanded] = useState(false)
	const choices =
		value && !members.some((member) => member.userId === value)
			? [...members, { userId: value, name: 'Назначенный участник' }]
			: members
	const showAll = expanded && choices.length > visibleLimit
	let visible = choices.slice(0, visibleLimit)
	if (value && !showAll && !visible.some((member) => member.userId === value)) {
		const selected = choices.find((member) => member.userId === value)!
		visible = [...visible.slice(0, visibleLimit - 1), selected]
	}
	const visibleIds = new Set(visible.map((member) => member.userId))
	const additional = choices.filter((member) => !visibleIds.has(member.userId))
	return (
		<Collapsible open={showAll} onOpenChange={setExpanded} asChild>
			<div className='space-y-2'>
				<Label id='task-assignee-label' className='text-sm leading-5'>
					Исполнитель
				</Label>
				<ChoiceGroup
					id='task-assignee-options'
					aria-labelledby='task-assignee-label'
					name='assigneeId'
					className='block'
					value={value || '__unassigned__'}
					onValueChange={(next) => onChange(next === '__unassigned__' ? null : next)}
					onBlur={onBlur}
					disabled={disabled}
				>
					<div className='flex min-w-0 flex-wrap gap-2'>
						<ChoiceGroupItem
							value='__unassigned__'
							tone='neutral'
							icon={<UserRoundMinus />}
							ref={!value ? inputRef : undefined}
						>
							Без исполнителя
						</ChoiceGroupItem>
						{visible.map((member) => (
							<ChoiceGroupItem
								key={member.userId}
								value={member.userId}
								icon={<UserRound />}
								ref={value === member.userId ? inputRef : undefined}
							>
								{member.name ?? member.userId}
							</ChoiceGroupItem>
						))}
					</div>
					<CollapsibleContent
						className='-mx-1 px-1'
						aria-hidden={!showAll}
						inert={!showAll}
					>
						<div className='flex min-w-0 flex-wrap gap-2 pt-2 pb-1'>
							{additional.map((member) => (
								<ChoiceGroupItem
									key={member.userId}
									value={member.userId}
									icon={<UserRound />}
									ref={value === member.userId ? inputRef : undefined}
									disabled={disabled || !showAll}
								>
									{member.name ?? member.userId}
								</ChoiceGroupItem>
							))}
						</div>
					</CollapsibleContent>
				</ChoiceGroup>
				{choices.length > visibleLimit && (
					<CollapsibleTrigger asChild>
						<Button
							type='button'
							variant='link'
							className='h-auto min-h-8 px-0 py-1'
							disabled={disabled}
						>
							{showAll ? 'Свернуть список' : `Показать всех (${choices.length})`}
						</Button>
					</CollapsibleTrigger>
				)}
			</div>
		</Collapsible>
	)
}
