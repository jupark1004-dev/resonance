import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'RESONANCE — 내면이 공명하는 만남';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at 50% 45%, #2A1B15 0%, #101320 55%, #07090F 100%)',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* 상단 서브 배지 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 22px',
                        borderRadius: '999px',
                        border: '1px solid rgba(245, 176, 65, 0.35)',
                        backgroundColor: 'rgba(245, 176, 65, 0.1)',
                        color: '#F8C471',
                        fontSize: '20px',
                        fontWeight: 600,
                        marginBottom: '26px',
                        letterSpacing: '0.08em',
                    }}
                >
                    ✦ 스와이프 없는 자기발견형 AI 내면 공명 매칭
                </div>

                {/* 중앙 두 개의 황금빛 공명 구체 비주얼 (2번 이미지 무드) */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        width: '540px',
                        height: '250px',
                        marginBottom: '24px',
                    }}
                >
                    {/* 수평 주파수 라인 */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '760px',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(248, 196, 113, 0.7) 50%, transparent 100%)',
                        }}
                    />

                    {/* 왼쪽 황금 구체 */}
                    <div
                        style={{
                            width: '220px',
                            height: '220px',
                            borderRadius: '110px',
                            background: 'radial-gradient(circle at 35% 35%, rgba(255, 243, 205, 0.95) 0%, rgba(245, 176, 65, 0.65) 50%, rgba(231, 76, 60, 0.15) 85%, transparent 100%)',
                            border: '2px solid rgba(255, 224, 130, 0.75)',
                            boxShadow: '0 0 60px rgba(245, 176, 65, 0.55)',
                            marginRight: '-28px',
                        }}
                    />

                    {/* 오른쪽 황금 구체 */}
                    <div
                        style={{
                            width: '220px',
                            height: '220px',
                            borderRadius: '110px',
                            background: 'radial-gradient(circle at 65% 35%, rgba(255, 243, 205, 0.95) 0%, rgba(245, 176, 65, 0.65) 50%, rgba(231, 76, 60, 0.15) 85%, transparent 100%)',
                            border: '2px solid rgba(255, 224, 130, 0.75)',
                            boxShadow: '0 0 60px rgba(245, 176, 65, 0.55)',
                            marginLeft: '-28px',
                        }}
                    />
                </div>

                {/* R E S O N A N C E 메인 타이틀 */}
                <div
                    style={{
                        fontSize: '46px',
                        fontWeight: 700,
                        color: '#FDEBD0',
                        letterSpacing: '0.36em',
                        marginBottom: '16px',
                    }}
                >
                    RESONANCE
                </div>

                <div
                    style={{
                        fontSize: '26px',
                        color: '#F5CBA7',
                        fontWeight: 500,
                    }}
                >
                    나를 가장 깊이 이해한 날, 결이 같은 사람을 만납니다
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
