export default function ReportLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8 pb-32">
            <div className="max-w-lg mx-auto">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        주간 분석 리포트
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        지난 7일간의 기록을 바탕으로 분석된 당신의 내면입니다.
                    </p>
                </div>

                <div className="p-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse">
                    <div className="flex justify-between items-center mb-8 border-b border-[var(--color-border)] pb-6">
                        <div className="w-16 h-16 bg-[var(--color-border)] rounded-full" />
                        <div className="text-right">
                            <div className="w-24 h-4 bg-[var(--color-border)] rounded-md mb-2 ml-auto" />
                            <div className="w-32 h-6 bg-[var(--color-border)] rounded-md ml-auto" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="w-full h-4 bg-[var(--color-border)] rounded-md" />
                        <div className="w-full h-4 bg-[var(--color-border)] rounded-md" />
                        <div className="w-5/6 h-4 bg-[var(--color-border)] rounded-md" />
                        <div className="w-full h-4 bg-[var(--color-border)] rounded-md mt-6" />
                        <div className="w-4/5 h-4 bg-[var(--color-border)] rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
