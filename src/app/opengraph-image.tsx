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
                    background: 'linear-gradient(135deg, #FFF5F3 0%, #FAFAFA 50%, #FFEAE5 100%)',
                    padding: '60px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '36px',
                        padding: '56px 72px',
                        border: '2px solid rgba(231, 76, 60, 0.2)',
                        boxShadow: '0 20px 50px rgba(44, 62, 80, 0.08)',
                        width: '1040px',
                        height: '510px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#FFF0EE',
                            color: '#E74C3C',
                            padding: '10px 24px',
                            borderRadius: '999px',
                            fontSize: '22px',
                            fontWeight: 700,
                            marginBottom: '28px',
                        }}
                    >
                        ✦ RESONANCE · 자기발견형 AI 내면 매칭
                    </div>

                    <div
                        style={{
                            fontSize: '54px',
                            fontWeight: 800,
                            color: '#2C3E50',
                            textAlign: 'center',
                            lineHeight: 1.3,
                            marginBottom: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <span>나를 가장 깊이 이해한 날,</span>
                        <span style={{ color: '#E74C3C' }}>결이 같은 사람을 만납니다</span>
                    </div>

                    <div
                        style={{
                            fontSize: '26px',
                            color: '#7F8C8D',
                            textAlign: 'center',
                            lineHeight: 1.5,
                        }}
                    >
                        단 3개의 질문으로 받아보는 나의 AI 내면 페르소나 리포트 & 공명 매칭
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
