import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-12">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-sm text-[var(--color-primary)] hover:underline mb-6 inline-block">
                    &larr; 홈으로 돌아가기
                </Link>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">서비스 이용약관</h1>
                
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-sm text-[var(--color-text)] leading-relaxed space-y-4">
                    <p><strong>제1조 (목적)</strong><br />본 약관은 RESONANCE(이하 "서비스")가 제공하는 서비스의 이용조건 및 절차, 이용자와 서비스의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                    <p><strong>제2조 (약관의 효력 및 변경)</strong><br />본 약관은 서비스를 통해 온라인으로 공시함으로써 효력을 발생하며, 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 안에서 개정될 수 있습니다.</p>
                    <p><strong>제3조 (서비스의 제공 및 변경)</strong><br />서비스는 AI 기반 자기발견 및 매칭 기능을 제공하며, 운영상 또는 기술상의 필요에 따라 제공하고 있는 서비스의 전부 또는 일부를 변경할 수 있습니다.</p>
                    <p><strong>제4조 (이용자의 의무)</strong><br />이용자는 타인의 정보를 도용하여서는 안 되며, 서비스가 정한 규정을 준수해야 합니다. 욕설, 비방, 음란물 등 부적절한 콘텐츠를 작성할 경우 서비스 이용이 제한될 수 있습니다.</p>
                </div>
            </div>
        </div>
    );
}
