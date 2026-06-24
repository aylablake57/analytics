'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import BootSequence from './primitives/BootSequence';
import Sidebar from './Sidebar';
import TopTicker from './TopTicker';
import StatusBar from './StatusBar';
import ExecutiveHeader from './ExecutiveHeader';
import CommandPalette from './CommandPalette';
import KPIHero from './KPIHero';
import TP18Tracker from './TP18Tracker';
import AlertsPanel from './AlertsPanel';
import ActivityFeed from './ActivityFeed';
import NaturalAssets from './NaturalAssets';

const HeroMap = dynamic(() => import('./HeroMap'), {
    ssr: false,
    loading: () => (
        <div className="glass" style={{ height: 540, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text-3)', fontSize: '0.74rem' }}>Initialising map…</div>
        </div>
    ),
});

function Inner() {
    const [booted, setBooted] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLElement>(null);

    // Lenis smooth scroll on the main scroll container
    useEffect(() => {
        if (!booted || !scrollRef.current) return;
        const lenis = new Lenis({
        wrapper: scrollRef.current,
        content: scrollRef.current.firstElementChild as HTMLElement,
        duration: 1.0,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.95,
        });
        let raf: number;
        function tick(time: number) {
        lenis.raf(time);
        raf = requestAnimationFrame(tick);
        }
        raf = requestAnimationFrame(tick);
        return () => {
        cancelAnimationFrame(raf);
        lenis.destroy();
        };
    }, [booted]);

    // GSAP master timeline on reveal
    useEffect(() => {
        if (!booted || !rootRef.current) return;
        const ctx = gsap.context(() => {
            gsap.from('[data-reveal-section]', {
                opacity: 0,
                y: 36,
                filter: 'blur(8px)',
                stagger: 0.1,
                duration: 0.9,
                ease: 'expo.out',
            });
        }, rootRef);
        return () => ctx.revert();
    }, [booted]);

    return (
        <>
        {!booted && <BootSequence onComplete={() => setBooted(true)} />}

        <AnimatePresence>
            {booted && (
            <motion.div
                ref={rootRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                display: 'flex',
                minHeight: '100vh',
                height: '100vh',
                overflow: 'hidden',
                }}
            >
                <Sidebar />

                {/* Main column */}
                <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                minHeight: 0,
                }}>
                <TopTicker />
                <ExecutiveHeader onOpenPalette={() => setPaletteOpen(true)} />

                {/* Scrollable content */}
                <main
                    ref={scrollRef}
                    className="overview-scope"
                    style={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    minHeight: 0,
                    }}
                >
                    <div style={{
                    padding: '20px 24px 32px',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    maxWidth: 1700, margin: '0 auto', width: '100%',
                    }}>
                    <section data-reveal-section>
                        <KPIHero />
                    </section>

                    <section
                        data-reveal-section
                        style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.55fr) minmax(380px, 1fr)',
                        gap: 14,
                        minHeight: 560,
                        alignItems: 'stretch',
                        }}
                    >
                        <HeroMap />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
                        <NaturalAssets />
                        </div>
                    </section>

                    <section data-reveal-section>
                        <TP18Tracker />
                    </section>

                    <section
                        data-reveal-section
                        style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
                        gap: 14,
                        minHeight: 380,
                        }}
                    >
                        <AlertsPanel />
                        <ActivityFeed />
                    </section>

                    <motion.footer
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.6 }}
                        style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 4px 4px',
                        fontSize: '0.7rem', color: 'var(--text-3)',
                        borderTop: '1px solid var(--border)',
                        marginTop: 8,
                        }}
                    >
                        <div className="mono" style={{ letterSpacing: '0.04em' }}>
                        ICT Digital Twin · Capital Development Authority · Confidential
                        </div>
                        <div style={{ display: 'flex', gap: 16 }} className="mono">
                        <a href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            Analyst View →
                        </a>
                        </div>
                    </motion.footer>
                    </div>
                </main>

                <StatusBar />
                </div>

                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
            </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}

export default function ExecutiveDashboard() {
    return <Inner />;
}
