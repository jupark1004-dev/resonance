import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-12">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-sm text-[var(--color-primary)] hover:underline mb-6 inline-block">
                    &larr; 홈으로 돌아가기
                </Link>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">개인정보 처리방침</h1>
                
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-sm text-[var(--color-text)] leading-relaxed space-y-4">
                    <p><strong>1. 수집하는 개인정보 항목</strong><br />RESONANCE는 회원가입 및 서비스 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.<br />- 필수항목: 이메일, 비밀번호, 닉네임, 출생년도, 성별, 지역, 데일리 질문 응답 내용</p>
                    <p><strong>2. 개인정보의 수집 및 이용 목적</strong><br />- 회원 관리: 회원제 서비스 이용에 따른 본인확인, 가입의사 확인<br />- AI 분석 및 매칭: 작성한 응답 데이터를 기반으로 한 AI 분석 리포트 생성 및 타 사용자와의 매칭</p>
                    <p><strong>3. 개인정보의 보유 및 이용기간</strong><br />회원 탈퇴 시 또는 서비스 종료 시까지 개인정보를 보관하며, 탈퇴 시 지체 없이 파기합니다.</p>
                    <p><strong>4. AI 데이터 분석 관련 고지</strong><br />사용자가 작성한 데일리 질문 응답은 AI 모델(Anthropic Claude)을 통해 분석되며, 해당 내용은 사용자의 성향 분석 및 매칭 서비스 제공을 위해서만 사용됩니다. 외부 학습 데이터로는 제공되지 않습니다.</p>
                </div>
            </div>
        </div>
    );
}
