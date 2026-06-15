import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findBestMatch, MatchCandidate } from '@/lib/claude/match';

// Vercel Cron에서는 Edge Runtime을 권장하지만, Supabase/Anthropic SDK 호환을 위해 Node.js 런타임 사용
export const runtime = 'nodejs';
// maxDuration 은 프로 플랜에서만 길게 설정 가능 (취향에 맞게 조절)
export const maxDuration = 60; 

export async function GET(request: Request) {
    // Cron Job 보안 처리 (권한 키 확인)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 중요: Cron job에서는 일반 Service Role Key를 사용해 모든 데이터에 접근해야 함
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase Service Role Key가 설정되지 않았습니다.');
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. 현재 매칭 중인(busy) 유저 목록 가져오기
        const { data: activeMatches } = await supabase
            .from('matches')
            .select('user_a_id, user_b_id')
            .in('status', ['pending', 'matched', 'gatekeeper']);

        const busyUserIds = new Set<string>();
        if (activeMatches) {
            activeMatches.forEach(m => {
                busyUserIds.add(m.user_a_id);
                busyUserIds.add(m.user_b_id);
            });
        }

        // 2. 최신 리포트를 가진(최근 7일 내) 유저들 조회
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 7);
        
        const { data: recentReports } = await supabase
            .from('analysis_reports')
            .select('user_id, report_text, created_at')
            .gte('created_at', limitDate.toISOString())
            .order('created_at', { ascending: false });

        if (!recentReports || recentReports.length < 2) {
            return NextResponse.json({ success: true, message: '매칭할 충분한 유저 리포트가 없습니다.' });
        }

        // 유저별 가장 최신 리포트만 맵핑
        const userLatestReportMap = new Map<string, string>();
        recentReports.forEach(r => {
            if (!userLatestReportMap.has(r.user_id)) {
                userLatestReportMap.set(r.user_id, r.report_text);
            }
        });

        // 3. 바쁘지 않은(매칭 대기 중인) 유저 ID 추출
        const eligibleUserIds = Array.from(userLatestReportMap.keys()).filter(id => !busyUserIds.has(id));

        if (eligibleUserIds.length < 2) {
            return NextResponse.json({ success: true, message: '현재 매칭 가능한 유휴 유저가 부족합니다.' });
        }

        // 4. 유휴 유저 프로필 정보 한번에 가져오기
        const { data: users } = await supabase
            .from('users')
            .select('id, nickname, birth_year, gender, region')
            .in('id', eligibleUserIds);

        if (!users || users.length < 2) {
            return NextResponse.json({ success: true, message: '필터링 가능한 유저 프로필이 부족합니다.' });
        }

        // 5. 프로덕션 매칭 로직 (청크 처리 및 딜레이)
        let matchCount = 0;
        
        // Edge/Node 런타임 제약(60초)을 피하기 위해 한 번에 최대 5명만 타겟으로 매칭 시도
        const MAX_TARGETS = 5;
        const targetUsers = users.slice(0, MAX_TARGETS);

        for (const targetUser of targetUsers) {
            if (busyUserIds.has(targetUser.id)) continue;

            // 후보군 점수화 필터링 (유연한 매칭)
            const scoredCandidates = users
                .filter(u => 
                    u.id !== targetUser.id && 
                    !busyUserIds.has(u.id) && 
                    (u.gender !== targetUser.gender || u.gender === 'other') // 본인 제외, 바쁘지 않은 사람, 이성 위주
                )
                .map(u => ({
                    ...u,
                    match_score: u.region === targetUser.region ? 100 : 50 // 같은 지역 우선
                }))
                .sort((a, b) => b.match_score - a.match_score); // 점수 높은 순 정렬
                
            const candidates = scoredCandidates.slice(0, 10); // 1명당 최대 10명 추출

            if (candidates.length === 0) continue;

            // AI 전달용 데이터로 변환
            const matchCandidates: MatchCandidate[] = candidates.map(c => ({
                id: c.id,
                nickname: c.nickname || '익명',
                birth_year: c.birth_year || 2000,
                report: userLatestReportMap.get(c.id) || '',
            }));

            try {
                // API Rate Limit 방어를 위한 짧은 지연시간 (1초)
                if (matchCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // Claude 매칭 API 호출
                const bestMatch = await findBestMatch({
                    id: targetUser.id,
                    nickname: targetUser.nickname || '익명',
                    birth_year: targetUser.birth_year || 2000,
                    report: userLatestReportMap.get(targetUser.id) || '',
                }, matchCandidates);

                if (bestMatch && bestMatch.matchedUserId) {
                    // DB에 매칭 내역 저장
                    await supabase.from('matches').insert({
                        user_a_id: targetUser.id,
                        user_b_id: bestMatch.matchedUserId,
                        resonance_score: bestMatch.resonanceScore,
                        match_reason: bestMatch.reason,
                        status: 'pending',
                    });
                    console.log(`매칭 성공: ${targetUser.id} <-> ${bestMatch.matchedUserId} (공명지수: ${bestMatch.resonanceScore})`);
                    
                    // 매칭된 두 사람은 바쁜 상태로 업데이트
                    busyUserIds.add(targetUser.id);
                    busyUserIds.add(bestMatch.matchedUserId);
                    matchCount++;
                }
            } catch (matchError) {
                console.error(`매칭 생성 중 오류 발생 (Target: ${targetUser.id}):`, matchError);
                // 오류가 발생해도 다른 타겟 유저 매칭은 계속 진행
            }
        }

        const resultMessage = `${matchCount} 쌍의 매칭이 성공적으로 생성되었습니다.`;
        
        // 슬랙 웹훅 전송
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (slackWebhookUrl) {
            try {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `*✅ [RESONANCE] 매칭 스케줄러 완료!*\n${resultMessage}`
                    })
                });
            } catch (slackError) {
                console.error('슬랙 웹훅 전송 실패:', slackError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: resultMessage 
        });

    } catch (error: any) {
        console.error('크론 매칭 전체 에러:', error);

        // 슬랙 웹훅 에러 전송
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (slackWebhookUrl) {
            try {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `*🚨 [RESONANCE] 매칭 스케줄러 실패!*\n\`\`\`${error.message}\`\`\``
                    })
                });
            } catch (e) {}
        }

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
