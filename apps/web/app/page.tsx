import styles from './page.module.css'

export default function Home() {
	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<div className={styles.hero}>
					<h1 className={styles.title}>Tracker Task</h1>
					<p className={styles.subtitle}>Открытая система управления IT-проектами</p>
				</div>

				<div className={styles.content}>
					<section className={styles.section}>
						<h2>О проекте</h2>
						<p>
							Лёгкая, современная альтернатива Jira и Яндекс.Трекер для разработчиков и
							небольших команд.
						</p>
					</section>

					<section className={styles.section}>
						<h2>Цель</h2>
						<p>
							Создать open-source решение для управления проектами, спринтами и задачами,
							которое просто развернуть на собственном сервере.
						</p>
					</section>

					<section className={styles.section}>
						<h2>Возможности</h2>
						<ul>
							<li>Управление проектами и задачами</li>
							<li>Спринты и бэклог</li>
							<li>Issue tracking</li>
							<li>Простое развёртывание</li>
							<li>Открытый исходный код</li>
						</ul>
					</section>
				</div>

				<div className={styles.footer}>
					<p className={styles.status}>🚧 Проект находится в разработке</p>
				</div>
			</main>
		</div>
	)
}
