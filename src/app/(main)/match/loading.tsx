export default function MatchLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8 pb-32">
            <div className="max-w-lg mx-auto">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        새로운 공명 ✨
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        AI가 당신의 기록을 엮어 찾아낸 특별한 인연입니다.
                    </p>
                </div>

                <div className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse">
                            <div className="mb-4">
                                <div className="w-20 h-6 bg-[var(--color-border)] rounded-full mb-3" />
                                <div className="w-32 h-6 bg-[var(--color-border)] rounded-md" />
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--color-background)] mb-6 border border-[var(--color-border)]">
                                <div className="w-1/2 h-4 bg-[var(--color-border)] rounded-md mb-3" />
                                <div className="w-full h-4 bg-[var(--color-border)] rounded-md mb-2" />
                                <div className="w-5/6 h-4 bg-[var(--color-border)] rounded-md" />
                            </div>
                            <div className="w-full h-14 bg-[var(--color-border)] rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
