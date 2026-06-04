export default function HistoryLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8 pb-32">
            <div className="max-w-lg mx-auto">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        나의 주파수 기록
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        그동안 남긴 마음의 파편들입니다.
                    </p>
                </div>

                <div className="relative border-l-2 border-[var(--color-border)] ml-4 pl-6 space-y-10">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="relative animate-pulse">
                            {/* 타임라인 노드 스켈레톤 */}
                            <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[var(--color-border)] ring-4 ring-[var(--color-background)]" />
                            
                            {/* 내용 스켈레톤 */}
                            <div className="mb-2 w-24 h-4 bg-[var(--color-border)] rounded-md" />
                            <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                                <div className="w-3/4 h-5 bg-[var(--color-border)] rounded-md mb-4" />
                                <div className="space-y-2">
                                    <div className="w-full h-4 bg-[var(--color-border)] rounded-md" />
                                    <div className="w-5/6 h-4 bg-[var(--color-border)] rounded-md" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
