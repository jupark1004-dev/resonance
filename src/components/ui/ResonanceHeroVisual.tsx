'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FLOATING_PARTICLES = [
    { id: 1, char: 'R', x: '18%', y: '34%', delay: 0.1 },
    { id: 2, char: 'E', x: '78%', y: '30%', delay: 0.3 },
    { id: 3, char: 'S', x: '24%', y: '66%', delay: 0.2 },
    { id: 4, char: 'O', x: '74%', y: '64%', delay: 0.4 },
    { id: 5, char: 'N', x: '14%', y: '52%', delay: 0.25 },
    { id: 6, char: 'A', x: '84%', y: '48%', delay: 0.15 },
    { id: 7, char: '✦', x: '32%', y: '26%', delay: 0.35 },
    { id: 8, char: '✦', x: '68%', y: '72%', delay: 0.45 },
];

const EQUALIZER_BARS = [
    12, 18, 28, 16, 38, 54, 30, 68, 92, 60, 44, 78, 110, 84, 56, 96, 124, 88,
    64, 90, 118, 82, 52, 74, 42, 62, 34, 48, 24, 32, 18, 12,
];

export default function ResonanceHeroVisual() {
    const [showSplash, setShowSplash] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const seen = sessionStorage.getItem('resonance_splash_seen');
        if (!seen) {
            setShowSplash(true);
            sessionStorage.setItem('resonance_splash_seen', 'true');
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, 2800);
            return () => clearTimeout(timer);
        }
    }, []);

    const replaySplash = () => {
        setShowSplash(true);
        setTimeout(() => {
            setShowSplash(false);
        }, 2800);
    };

    return (
        <>
            {/* 1. 시네마틱 오프닝 스플래시 (2번 이미지 무드: 다크 코스믹 + 두 황금 구체 공명) */}
            <AnimatePresence>
                {mounted && showSplash && (
                    <motion.div
                        key="resonance-splash"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.65, ease: 'easeInOut' } }}
                        onClick={() => setShowSplash(false)}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
                        style={{
                            background:
                                'radial-gradient(circle at 50% 48%, #261914 0%, #11131F 52%, #07090F 100%)',
                        }}
                    >
                        {/* 배경 별빛 & 알파벳 조각 파티클 */}
                        {FLOATING_PARTICLES.map((p) => (
                            <motion.span
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{
                                    opacity: [0, 0.55, 0.25],
                                    scale: [0.8, 1.1, 0.95],
                                    y: [0, -10, 0],
                                }}
                                transition={{
                                    duration: 2.4,
                                    delay: p.delay,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                style={{ left: p.x, top: p.y }}
                                className="absolute text-xs sm:text-sm font-serif text-[#F5CBA7]/50 px-1.5 py-0.5 rounded border border-[#F5CBA7]/15 bg-[#F5CBA7]/5 backdrop-blur-xs"
                            >
                                {p.char}
                            </motion.span>
                        ))}

                        {/* 중앙 수평 음파(Frequency) 이퀄라이저 라인 */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-8 flex items-center justify-center gap-1 sm:gap-1.5 opacity-45 px-8">
                            {EQUALIZER_BARS.map((height, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ height: 6 }}
                                    animate={{
                                        height: [height * 0.35, height, height * 0.5],
                                    }}
                                    transition={{
                                        duration: 1.4,
                                        delay: (idx % 7) * 0.06,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    className="w-0.5 sm:w-1 rounded-full bg-gradient-to-b from-transparent via-[#F8C471] to-transparent"
                                />
                            ))}
                        </div>

                        {/* 두 영혼의 황금빛 구체가 가까워지며 공명하는 메인 비주얼 */}
                        <div className="relative w-80 h-60 sm:w-96 sm:h-64 flex items-center justify-center">
                            {/* 외곽 공명 파동 링 */}
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: [0.85, 1.25], opacity: [0.6, 0] }}
                                transition={{ duration: 2.1, repeat: Infinity, ease: 'easeOut' }}
                                className="absolute w-64 h-64 rounded-full border border-[#F5B041]/30"
                            />
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: [0.8, 1.4], opacity: [0.4, 0] }}
                                transition={{
                                    duration: 2.1,
                                    delay: 0.4,
                                    repeat: Infinity,
                                    ease: 'easeOut',
                                }}
                                className="absolute w-72 h-72 rounded-full border border-[#EB984E]/20"
                            />

                            {/* 왼쪽 황금 구체 */}
                            <motion.div
                                initial={{ x: -82, scale: 0.85, opacity: 0 }}
                                animate={{ x: -38, scale: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full relative flex items-center justify-center"
                                style={{
                                    background:
                                        'radial-gradient(circle at 38% 38%, rgba(255, 236, 179, 0.95) 0%, rgba(245, 176, 65, 0.65) 45%, rgba(231, 76, 60, 0.15) 80%, transparent 100%)',
                                    boxShadow:
                                        '0 0 60px rgba(245, 176, 65, 0.55), inset 0 0 30px rgba(255, 255, 255, 0.6)',
                                    border: '1.5px solid rgba(255, 224, 130, 0.65)',
                                }}
                            />

                            {/* 오른쪽 황금 구체 */}
                            <motion.div
                                initial={{ x: 82, scale: 0.85, opacity: 0 }}
                                animate={{ x: 38, scale: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full relative flex items-center justify-center -ml-8"
                                style={{
                                    background:
                                        'radial-gradient(circle at 62% 38%, rgba(255, 236, 179, 0.95) 0%, rgba(245, 176, 65, 0.65) 45%, rgba(231, 76, 60, 0.15) 80%, transparent 100%)',
                                    boxShadow:
                                        '0 0 60px rgba(245, 176, 65, 0.55), inset 0 0 30px rgba(255, 255, 255, 0.6)',
                                    border: '1.5px solid rgba(255, 224, 130, 0.65)',
                                }}
                            />

                            {/* 두 구체 내부를 잇는 별자리 공명 선 (SVG) */}
                            <motion.svg
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.85 }}
                                transition={{ delay: 0.6, duration: 0.9 }}
                                viewBox="0 0 300 160"
                                className="absolute inset-0 w-full h-full pointer-events-none"
                            >
                                <polyline
                                    fill="none"
                                    stroke="#FFF8E7"
                                    strokeWidth="1.2"
                                    strokeDasharray="3 3"
                                    points="65,105 95,82 128,96 155,64 185,48 218,68 242,40"
                                />
                                {[
                                    [65, 105],
                                    [95, 82],
                                    [128, 96],
                                    [155, 64],
                                    [185, 48],
                                    [218, 68],
                                    [242, 40],
                                ].map(([cx, cy], i) => (
                                    <circle
                                        key={i}
                                        cx={cx}
                                        cy={cy}
                                        r="2.8"
                                        fill="#FFFFFF"
                                    />
                                ))}
                            </motion.svg>
                        </div>

                        {/* 하단 R E S O N A N C E 타이포그래피 */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.8 }}
                            className="text-center mt-4"
                        >
                            <h2
                                className="text-2xl sm:text-3xl font-light tracking-[0.42em] text-[#FDEBD0] ml-[0.42em]"
                                style={{
                                    textShadow: '0 0 24px rgba(245, 176, 65, 0.7)',
                                }}
                            >
                                RESONANCE
                            </h2>
                            <p className="text-xs sm:text-sm text-[#F5CBA7]/75 tracking-widest mt-3">
                                내면의 주파수가 만나는 순간
                            </p>
                        </motion.div>

                        <span className="absolute bottom-8 text-[11px] text-white/35 tracking-wider">
                            화면을 터치하면 바로 시작됩니다
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. 히어로 섹션 중앙 '살아 움직이는 공명 웨이브 아트 카드' (1번 + 2번 이미지 감성 결합) */}
            <div className="my-10 flex flex-col items-center">
                <div
                    onClick={replaySplash}
                    title="클릭하면 공명 인트로를 다시 감상할 수 있어요"
                    className="group relative w-full max-w-sm rounded-[32px] p-7 sm:p-8 overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
                    style={{
                        background:
                            'linear-gradient(155deg, #F6E6DF 0%, #FDF8F5 48%, #EFE0D9 100%)',
                        boxShadow:
                            '0 20px 50px rgba(180, 120, 100, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(220, 180, 165, 0.5)',
                    }}
                >
                    {/* 중앙 은은한 웜 로즈/골드 후광 */}
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none blur-2xl opacity-75"
                        style={{
                            background:
                                'radial-gradient(circle, rgba(235, 160, 115, 0.55) 0%, rgba(231, 76, 60, 0.18) 55%, transparent 75%)',
                        }}
                    />

                    {/* 상단 클래식 세리프 로고 (1번 이미지 스타일) */}
                    <div className="relative z-10 text-center mb-4">
                        <p
                            className="text-2xl sm:text-[28px] tracking-[0.16em] text-[#5C433B] font-serif select-none"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                            RESONANCE
                        </p>
                        <p className="text-[10px] tracking-[0.25em] uppercase text-[#9C7E73] mt-1">
                            Inner Frequency Match
                        </p>
                    </div>

                    {/* 중앙 실시간 빛의 파동(Glowing Soundwave) SVG 애니메이션 */}
                    <div className="relative z-10 h-40 flex items-center justify-center my-2">
                        <svg
                            viewBox="0 0 400 180"
                            className="w-full h-full overflow-visible"
                        >
                            <defs>
                                <filter id="wave-glow" x="-20%" y="-30%" width="140%" height="160%">
                                    <feGaussianBlur stdDeviation="4.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="gold-wave-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.1" />
                                    <stop offset="25%" stopColor="#FFE0B2" stopOpacity="0.95" />
                                    <stop offset="50%" stopColor="#FFF8E7" stopOpacity="1" />
                                    <stop offset="75%" stopColor="#F5B041" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="rose-wave-2" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FFF0EE" stopOpacity="0.05" />
                                    <stop offset="30%" stopColor="#F5CBA7" stopOpacity="0.85" />
                                    <stop offset="50%" stopColor="#E74C3C" stopOpacity="0.65" />
                                    <stop offset="70%" stopColor="#FADBD8" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#FFF0EE" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>

                            {/* 파동 곡선 1 (메인 황금빛 공명선) */}
                            <motion.path
                                filter="url(#wave-glow)"
                                fill="none"
                                stroke="url(#gold-wave-1)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                animate={{
                                    d: [
                                        'M 10 90 C 65 90, 85 35, 130 90 C 165 135, 185 15, 220 90 C 255 155, 285 50, 325 90 C 355 120, 375 90, 390 90',
                                        'M 10 90 C 65 90, 85 135, 130 90 C 165 35, 185 160, 220 90 C 255 25, 285 130, 325 90 C 355 65, 375 90, 390 90',
                                        'M 10 90 C 65 90, 85 35, 130 90 C 165 135, 185 15, 220 90 C 255 155, 285 50, 325 90 C 355 120, 375 90, 390 90',
                                    ],
                                }}
                                transition={{
                                    duration: 5.2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />

                            {/* 파동 곡선 2 (대칭 위상 공명선) */}
                            <motion.path
                                filter="url(#wave-glow)"
                                fill="none"
                                stroke="url(#gold-wave-1)"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                animate={{
                                    d: [
                                        'M 10 90 C 65 90, 85 140, 130 90 C 165 40, 185 165, 220 90 C 255 20, 285 135, 325 90 C 355 60, 375 90, 390 90',
                                        'M 10 90 C 65 90, 85 45, 130 90 C 165 145, 185 20, 220 90 C 255 160, 285 45, 325 90 C 355 115, 375 90, 390 90',
                                        'M 10 90 C 65 90, 85 140, 130 90 C 165 40, 185 165, 220 90 C 255 20, 285 135, 325 90 C 355 60, 375 90, 390 90',
                                    ],
                                }}
                                transition={{
                                    duration: 5.2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />

                            {/* 파동 곡선 3 (로즈골드 잔향선) */}
                            <motion.path
                                filter="url(#wave-glow)"
                                fill="none"
                                stroke="url(#rose-wave-2)"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                animate={{
                                    d: [
                                        'M 10 90 C 70 60, 110 130, 160 90 C 195 55, 215 125, 255 90 C 295 55, 330 115, 390 90',
                                        'M 10 90 C 70 120, 110 50, 160 90 C 195 125, 215 55, 255 90 C 295 125, 330 65, 390 90',
                                        'M 10 90 C 70 60, 110 130, 160 90 C 195 55, 215 125, 255 90 C 295 55, 330 115, 390 90',
                                    ],
                                }}
                                transition={{
                                    duration: 3.8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        </svg>
                    </div>

                    {/* 하단 재생 바 디테일 (1번 이미지 감성 그대로 재현) */}
                    <div className="relative z-10 mt-3 pt-2">
                        <div className="relative h-0.5 w-full bg-[#D5C2B8] rounded-full flex items-center">
                            <div className="h-full w-2/5 bg-[#8E7065] rounded-full" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8E7065] -ml-1 shadow-xs" />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#8E7065]">
                            <span className="group-hover:text-[var(--color-primary)] transition-colors">
                                ✦ 인트로 다시 보기
                            </span>
                            <span>03:00 / 07:00</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
