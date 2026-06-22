import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import ExecProviders from '@/components/executive/ExecProviders';
import './executive.css';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
});

const mono = JetBrains_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'ICT Executive Brief — Digital Twin',
	description: 'Real-time geospatial intelligence for Islamabad Capital Territory',
};

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
	return (
		<div data-exec data-theme="dark" className={`${inter.variable} ${mono.variable}`}>
			<div className="exec-root">
				<ExecProviders>{children}</ExecProviders>
			</div>
		</div>
	);
}
