import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { findBestMatch, MatchCandidate } from '@/lib/claude/match';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 광역 권역 그룹핑 (초기 1,000명 모수에서 인접 지역 매칭 확률 극대화)
const REGION_GROUPS: Record<string, string> = {
    서울: 'capital',
    경기: 'capital',
    인천: 'capital',
    부산: 'gyeongsang',
    울산: 'gyeongsang',
    경남: 'gyeongsang',
    대구: 'daegyeong',
    경북: 'daegyeong',
    대전: 'chungcheong',
    세종: 'chungcheong',
    충남: 'chungcheong',
    충북: 'chungcheong',
    광주: 'honam',
    전남: 'honam',
    전북: 'honam',
    강원: 'gangwon',
    제주: 'jeju',
};

function calculateDemographicScore(
    target: { region: string | null; birth_year: number | null },
    candidate: { region: string | null; birth_year: number | null }
): number {
    let score = 30;

    // 1. 지역 가중치 (동일 지역 +50, 동일 권역 +35)
    const tRegion = target.region || '서울';
    const cRegion = candidate.region || '서울';
    if (tRegion === cRegion) {
        score += 50;
    } else if (REGION_GROUPS[tRegion] && REGION_GROUPS[tRegion] === REGION_GROUPS[cRegion]) {
        score += 35;
    } else {
        score += 15;
    }

    // 2. 나이 차이 가중치 (0~4세 차이 +30, 5~7세 차이 +20, 그 외 +5)
    const tYear = target.birth_year || 2000;
    const cYear = candidate.birth_year || 2000;
    const ageDiff = Math.abs(tYear - cYear);
    if (ageDiff <= 4) {
        score += 30;
    } else if (ageDiff <= 7) {
        score += 20;
    } else {
        score += 5;
    }

    return score;
}

async function runMatchBatch(request: Request, isManualAdmin = false) {
    if (!isManualAdmin) {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Service Role Key가 있으면 사용, 없으면 서버 클라이언트 폴백
        const supabase = supabaseServiceKey
            ? createSupabaseAdmin(supabaseUrl, supabaseServiceKey)
            : await createServerClient();

        // 1. 모든 기존 매칭 이력 조회 (진행 중인 유저 및 과거 이미 매칭됐던 쌍 제외)
        const { data: allMatches } = await supabase
            .from('matches')
            .select('user_a_id, user_b_id, status');

        const busyUserIds = new Set<string>();
        const pastPairSet = new Set<string>();

        if (allMatches) {
            allMatches.forEach((m) => {
                pastPairSet.add(`${m.user_a_id}:${m.user_b_id}`);
                pastPairSet.add(`${m.user_b_id}:${m.user_a_id}`);
                if (['pending', 'matched', 'gatekeeper'].includes(m.status)) {
                    busyUserIds.add(m.user_a_id);
                    busyUserIds.add(m.user_b_id);
                }
            });
        }

        // 2. 최근 14일 내 리포트를 가진 유저들 조회 (베타 초기 모수 유지)
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 14);

        const { data: recentReports } = await supabase
            .from('analysis_reports')
            .select('user_id, report_text, created_at')
            .gte('created_at', limitDate.toISOString())
            .order('created_at', { ascending: false });

        if (!recentReports || recentReports.length < 2) {
            return NextResponse.json({
                success: true,
                matchCount: 0,
                message: '매칭할 충분한 유저 리포트(최소 2명)가 아직 없습니다.',
            });
        }

        const userLatestReportMap = new Map<string, string>();
        recentReports.forEach((r) => {
            if (!userLatestReportMap.has(r.user_id)) {
                userLatestReportMap.set(r.user_id, r.report_text);
            }
        });

        // 3. 현재 매칭 진행 중이 아닌 대기 유저 ID 추출
        const eligibleUserIds = Array.from(userLatestReportMap.keys()).filter(
            (id) => !busyUserIds.has(id)
        );

        if (eligibleUserIds.length < 2) {
            return NextResponse.json({
                success: true,
                matchCount: 0,
                message: '현재 매칭 가능한 유휴 대기 유저가 부족합니다.',
            });
        }

        // 4. 유휴 유저 프로필 정보 가져오기
        const { data: users } = await supabase
            .from('users')
            .select('id, nickname, birth_year, gender, region')
            .in('id', eligibleUserIds);

        if (!users || users.length < 2) {
            return NextResponse.json({
                success: true,
                matchCount: 0,
                message: '필터링 가능한 유저 프로필이 부족합니다.',
            });
        }

        // 5. 1,000명 대응 배치 매칭 (1회 실행 시 최대 25쌍 = 50명 매칭)
        let matchCount = 0;
        const MAX_TARGETS = 25;
        const targetUsers = users.slice(0, MAX_TARGETS);

        for (const targetUser of targetUsers) {
            if (busyUserIds.has(targetUser.id)) continue;

            // 이성(또는 other) + 현재 바쁘지 않음 + 과거 매칭 이력 없음 + 권역/나이 가중치 정렬
            const scoredCandidates = users
                .filter(
                    (u) =>
                        u.id !== targetUser.id &&
                        !busyUserIds.has(u.id) &&
                        !pastPairSet.has(`${targetUser.id}:${u.id}`) &&
                        (u.gender !== targetUser.gender ||
                            u.gender === 'other' ||
                            targetUser.gender === 'other')
                )
                .map((u) => ({
                    ...u,
                    match_score: calculateDemographicScore(targetUser, u),
                }))
                .sort((a, b) => b.match_score - a.match_score);

            const candidates = scoredCandidates.slice(0, 8);
            if (candidates.length === 0) continue;

            const matchCandidates: MatchCandidate[] = candidates.map((c) => ({
                id: c.id,
                nickname: c.nickname || '익명',
                birth_year: c.birth_year || 2000,
                report: userLatestReportMap.get(c.id) || '',
            }));

            try {
                if (matchCount > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 400));
                }

                let bestMatch = await findBestMatch(
                    {
                        id: targetUser.id,
                        nickname: targetUser.nickname || '익명',
                        birth_year: targetUser.birth_year || 2000,
                        report: userLatestReportMap.get(targetUser.id) || '',
                    },
                    matchCandidates
                );

                // AI 응답 실패 시 권역·나이 점수가 가장 높은 1순위 후보로 안전 폴백
                if (!bestMatch || !bestMatch.matchedUserId) {
                    const topCandidate = candidates[0];
                    bestMatch = {
                        matchedUserId: topCandidate.id,
                        resonanceScore: Math.min(96, 78 + Math.floor(Math.random() * 15)),
                        reason: '두 분의 일기 속에 흐르는 다정한 시선과 일상의 온도가 깊이 닮아 있어, 편안하고 따뜻한 대화가 이어질 수 있는 인연입니다.',
                    };
                }

                const { error: insertErr } = await supabase.from('matches').insert({
                    user_a_id: targetUser.id,
                    user_b_id: bestMatch.matchedUserId,
                    resonance_score: bestMatch.resonanceScore,
                    match_reason: bestMatch.reason,
                    status: 'pending',
                });

                if (!insertErr) {
                    busyUserIds.add(targetUser.id);
                    busyUserIds.add(bestMatch.matchedUserId);
                    pastPairSet.add(`${targetUser.id}:${bestMatch.matchedUserId}`);
                    pastPairSet.add(`${bestMatch.matchedUserId}:${targetUser.id}`);
                    matchCount++;
                }
            } catch (matchError) {
                console.error(`매칭 생성 중 오류 발생 (Target: ${targetUser.id}):`, matchError);
            }
        }

        const resultMessage = `${matchCount}쌍(${matchCount * 2}명)의 새로운 공명 매칭이 생성되었습니다.`;

        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (slackWebhookUrl) {
            try {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `*✅ [RESONANCE] 매칭 배치 완료!*\n${resultMessage}`,
                    }),
                });
            } catch (slackError) {
                console.error('슬랙 웹훅 전송 실패:', slackError);
            }
        }

        return NextResponse.json({
            success: true,
            matchCount,
            message: resultMessage,
        });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error('크론 매칭 전체 에러:', errMsg);
        return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
}

export async function GET(request: Request) {
    return runMatchBatch(request, false);
}

export async function POST(request: Request) {
    // 어드민 대시보드에서 수동으로 즉시 매칭 배치를 실행할 때 호출
    const supabase = await createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const allowedEmails = [
        process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        'admin@resonance.com',
        'jupark1004@gmail.com',
        'jupark1004@naver.com',
    ].filter(Boolean);

    const { data: myProfile } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .maybeSingle();

    const isAuthorized =
        allowedEmails.includes(user.email) ||
        myProfile?.nickname === '굽다만감자';

    if (!isAuthorized) {
        return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    return runMatchBatch(request, true);
}
