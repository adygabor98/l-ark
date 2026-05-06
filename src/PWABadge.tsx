import './PWABadge.css'

import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

function PWABadge() {
	const { t } = useTranslation();
	// check for updates every hour
	const period = 60 * 60 * 1000

	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, r) {
			if (period <= 0) return
			if (r?.active?.state === 'activated') {
				registerPeriodicSync(period, swUrl, r)
			}
			else if (r?.installing) {
				r.installing.addEventListener('statechange', (e) => {
					const sw = e.target as ServiceWorker
					if (sw.state === 'activated')
						registerPeriodicSync(period, swUrl, r)
				})
			}
		},
	})

	function close() {
		setOfflineReady(false)
		setNeedRefresh(false)
	}

	return (
		<div className="PWABadge" role="alert" aria-labelledby="toast-message">
			{ (offlineReady || needRefresh)
			&& (
				<div className="PWABadge-toast">
					<div className="PWABadge-message">
						{ offlineReady
							? <span id="toast-message">{ t('pwa.offline-ready') }</span>
							: <span id="toast-message">{ t('pwa.new-content') }</span>}
					</div>
					<div className="PWABadge-buttons">
						{ needRefresh && <button className="PWABadge-toast-button" onClick={() => updateServiceWorker(true)}>{ t('pwa.reload') }</button> }
						<button className="PWABadge-toast-button" onClick={() => close()}>{ t('pwa.close') }</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default PWABadge

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(period: number, swUrl: string, r: ServiceWorkerRegistration) {
	if (period <= 0) return

	setInterval(async () => {
		if ('onLine' in navigator && !navigator.onLine)
			return

		const resp = await fetch(swUrl, {
			cache: 'no-store',
			headers: {
				'cache': 'no-store',
				'cache-control': 'no-cache',
			},
		})

		if (resp?.status === 200)
			await r.update()
	}, period)
}
