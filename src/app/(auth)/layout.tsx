export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-background)]">
            <div className="w-full max-w-sm animate-fade-in">
                {children}
            </div>
        </div>
    );
}
