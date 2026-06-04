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

        // 1. 최신 리포트를 가진(최근 7일 내) 유저들 조회
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

        const activeUserIds = Array.from(userLatestReportMap.keys());

        // 2. 유저 프로필 정보 한번에 가져오기
        const { data: users } = await supabase
            .from('users')
            .select('id, nickname, birth_year, gender, region')
            .in('id', activeUserIds);

        if (!users || users.length < 2) {
            return NextResponse.json({ success: true, message: '필터링 가능한 유저가 부족합니다.' });
        }

        // 3. 임시 매칭 로직 (테스트용: 첫 번째 유저를 기준으로 삼음)
        // 실제 운영 시에는 '현재 매칭 중(pending)이 아닌 유저들' 큐를 만들어서 순회해야 함.
        let matchCount = 0;
        
        // 간단한 시뮬레이션: 가장 활발한(가입 순) 유저 3명 정도만 타겟으로 매칭 시도
        const targetUsers = users.slice(0, 3);

        for (const targetUser of targetUsers) {
            // 이미 매칭된 상태인지 확인 (pending 이나 matched)
            const { data: existingMatches } = await supabase
                .from('matches')
                .select('id')
                .or(`user_a_id.eq.${targetUser.id},user_b_id.eq.${targetUser.id}`)
                .in('status', ['pending', 'matched', 'gatekeeper'])
                .limit(1);

            if (existingMatches && existingMatches.length > 0) {
                continue; // 이미 진행 중인 매칭이 있으면 패스
            }

            // 후보군 점수화 필터링 (유연한 매칭)
            const scoredCandidates = users
                .filter(u => u.id !== targetUser.id && (u.gender !== targetUser.gender || u.gender === 'other')) // 본인 제외 및 이성 위주
                .map(u => ({
                    ...u,
                    match_score: u.region === targetUser.region ? 100 : 50 // 같은 지역 우선, 아니어도 후보군 유지
                }))
                .sort((a, b) => b.match_score - a.match_score); // 점수 높은 순 정렬
                
            const candidates = scoredCandidates.slice(0, 10); // 최대 10명 추출

            if (candidates.length === 0) continue;

            // AI 전달용 데이터로 변환
            const matchCandidates: MatchCandidate[] = candidates.map(c => ({
                id: c.id,
                nickname: c.nickname || '익명',
                birth_year: c.birth_year || 2000,
                report: userLatestReportMap.get(c.id) || '',
            }));

            // 4. Claude 매칭 API 호출
            const bestMatch = await findBestMatch({
                id: targetUser.id,
                nickname: targetUser.nickname || '익명',
                birth_year: targetUser.birth_year || 2000,
                report: userLatestReportMap.get(targetUser.id) || '',
            }, matchCandidates);

            if (bestMatch && bestMatch.matchedUserId) {
                // 5. DB에 매칭 내역 저장
                await supabase.from('matches').insert({
                    user_a_id: targetUser.id,
                    user_b_id: bestMatch.matchedUserId,
                    resonance_score: bestMatch.resonanceScore,
                    match_reason: bestMatch.reason,
                    status: 'pending',
                });
                console.log(`매칭 성공: ${targetUser.id} <-> ${bestMatch.matchedUserId} (공명지수: ${bestMatch.resonanceScore})`);
                matchCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `${matchCount} 쌍의 매칭이 성공적으로 생성되었습니다.` 
        });

    } catch (error: any) {
        console.error('크론 매칭 에러:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
