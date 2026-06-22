'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { login } from '@/lib/auth';
import styles from './login.module.css';

// Shared entrance transition — matches exec dashboard [data-reveal-section] timing
const REVEAL = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };

// Staggered fade-up for individual form elements
function fadeUp(delay: number) {
	return {
		initial:    { opacity: 0, y: 14 },
		animate:    { opacity: 1, y: 0  },
		transition: { ...REVEAL, delay },
	};
}

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername]         = useState('');
	const [password, setPassword]         = useState('');
	const [loading, setLoading]           = useState(false);
	const [error, setError]               = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember]         = useState(false);

	// If already logged in (cookie present), skip to executive dashboard
	useEffect(() => {
		const authed = document.cookie.split(';').some(c => c.trim().startsWith('ict_session=') && c.trim() !== 'ict_session=');
		if (authed) router.replace('/executive');
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			await login(username, password, remember);
			router.replace('/executive');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
			setLoading(false);
		}
	};

	return (
		// Page-level fade-in — matches exec dashboard root motion.div
		<motion.div
		className={styles.container}
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		transition={{ duration: 0.4 }}
		>
			<div className={styles.backgroundShapes}>
				<div className={styles.shape1} />
				<div className={styles.shape2} />
				<div className={styles.shape3} />
			</div>

			{/* Card entrance: opacity + upward movement + blur dissolve */}
			<motion.div
				className={styles.wrapper}
				initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
				animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
				transition={{ ...REVEAL, duration: 0.7 }}
			>

				{/* ── Branding side ── */}
				<div className={styles.brandingSide}>
					<motion.div
						className={styles.brandContent}
						initial={{ opacity: 0, y: -16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ ...REVEAL, delay: 0.15 }}
					>
						{/* Logo: scale + fade entrance */}
						<motion.div
						className={styles.logo}
						initial={{ opacity: 0, scale: 0.88 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ ...REVEAL, delay: 0.25 }}
						>
						<svg width="56" height="56" viewBox="0 0 60 60" fill="none">
							<rect width="60" height="60" rx="12" fill="rgba(0,224,255,0.08)" stroke="rgba(0,224,255,0.25)" strokeWidth="1" />
							<polygon
							points="12,46 22,20 30,34 38,22 48,46"
							fill="rgba(0,224,255,0.15)"
							stroke="var(--accent)"
							strokeWidth="2"
							strokeLinejoin="round"
							/>
							<circle cx="30" cy="16" r="4" fill="var(--accent-2)" />
						</svg>
						</motion.div>
						<h1 className={styles.brandTitle}>ICT Digital Twin</h1>
						<p className={styles.brandSubtitle}>Islamabad Capital Territory<br />GIS Intelligence Platform</p>
						<div className={styles.features}>
						<div className={styles.feature}>
							<span className={styles.featureIcon}>✓</span>
							<span>Interactive Map Layers</span>
						</div>
						<div className={styles.feature}>
							<span className={styles.featureIcon}>✓</span>
							<span>Spatial Data Analysis</span>
						</div>
						<div className={styles.feature}>
							<span className={styles.featureIcon}>✓</span>
							<span>Land Records &amp; Parcels</span>
						</div>
						</div>

						<div className={styles.systemStatus}>
						<span className="pulse-dot" />
						<span className={styles.statusLabel}>System</span>
						<span className={styles.statusValue}>OPERATIONAL</span>
						</div>
					</motion.div>
				</div>

				{/* ── Form side ── */}
				<div className={styles.formSide}>
					<div className={styles.formWrapper}>

						{/* Form header — staggered entrance */}
						<motion.div className={styles.formHeader} {...fadeUp(0.22)}>
						<div className={styles.eyebrow}>Secure Access</div>
						<h2 className={styles.formTitle}>Welcome Back</h2>
						<p className={styles.formSubtitle}>Sign in to access the dashboard</p>
						</motion.div>

						{/* Error alert — AnimatePresence for smooth mount/unmount */}
						<AnimatePresence>
						{error && (
							<motion.div
							className={styles.errorAlert}
							initial={{ opacity: 0, y: -8, scale: 0.98 }}
							animate={{ opacity: 1, y: 0,  scale: 1    }}
							exit={{    opacity: 0, y: -8, scale: 0.98 }}
							transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
							>
							<span className={styles.errorIcon}>⚠</span>
							<span>{error}</span>
							</motion.div>
						)}
						</AnimatePresence>

						<form onSubmit={handleSubmit} className={styles.form}>

						{/* Username — staggered */}
						<motion.div className={styles.formGroup} {...fadeUp(0.32)}>
							<label htmlFor="username" className={styles.label}>Username</label>
							<div className={styles.inputWrapper}>
							<input
								type="text"
								id="username"
								value={username}
								onChange={e => { setUsername(e.target.value); setError(''); }}
								required
								placeholder="Enter your username"
								className={styles.input}
								disabled={loading}
								autoComplete="username"
								autoFocus
							/>
							<span className={styles.inputIcon}>⌘</span>
							</div>
						</motion.div>

						{/* Password — staggered */}
						<motion.div className={styles.formGroup} {...fadeUp(0.40)}>
							<label htmlFor="password" className={styles.label}>Password</label>
							<div className={styles.inputWrapper}>
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								value={password}
								onChange={e => { setPassword(e.target.value); setError(''); }}
								required
								placeholder="••••••••"
								className={styles.input}
								disabled={loading}
								autoComplete="current-password"
							/>
							<button
								type="button"
								className={styles.togglePassword}
								onClick={() => setShowPassword(p => !p)}
								disabled={loading}
								tabIndex={-1}
							>
								{showPassword ? '○' : '●'}
							</button>
							</div>
						</motion.div>

						{/* Remember me + submit — staggered */}
						<motion.div {...fadeUp(0.48)}>
							<div className={styles.formFooter}>
							<label className={styles.rememberMe}>
								<input
								type="checkbox"
								checked={remember}
								onChange={e => setRemember(e.target.checked)}
								/>
								<span>Keep me signed in for 7 days</span>
							</label>
							</div>

							{/* Button: whileHover scale + whileTap — matches exec header "+ New" button */}
							<motion.button
							type="submit"
							disabled={loading}
							className={styles.submitBtn}
							whileHover={loading ? {} : { scale: 1.015 }}
							whileTap={loading  ? {} : { scale: 0.97  }}
							transition={{ duration: 0.15 }}
							>
							{loading
								? <><span className={styles.loader} />Authenticating…</>
								: 'Sign In →'
							}
							</motion.button>
						</motion.div>

						</form>
					</div>
				</div>

			</motion.div>
		</motion.div>
	);
}
