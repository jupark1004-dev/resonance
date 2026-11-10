import Anthropic from '@anthropic-ai/sdk';

export const MIN_RESONANCE_SCORE = 75;

// Claude API 크레딧 부족/키 오류 시 배치 매칭에서 불필요한 재호출 지연을 막는 서킷 브레이커 (10분간 유지)
let claudeMatchSkipUntil = 0;

export interface MatchCandidate {
    id: string;
    nickname: string;
    birth_year: number;
    report: string;
}

export interface MatchResult {
    matchedUserId: string | null;
    resonanceScore: number;
    reason: string;
}

// 내면 리포트의 6대 심리·가치관 차원 키워드 사전
const INNER_DIMENSIONS: Record<string, { label: string; keywords: string[] }> = {
    warmth: {
        label: '일상의 작은 온기와 다정함을 발견하는 시선',
        keywords: ['모닥불', '다정한', '포근', '안식처', '외투', '따스함', '미소', '배려', '온기'],
    },
    solitude: {
        label: '고요한 혼자만의 시간과 내면의 여백을 존중하는 태도',
        keywords: ['고요', '조용', '혼자', '창가', '카페', '산책', '여백', '호수', '침묵', '우주'],
    },
    depth: {
        label: '기억과 감정의 깊이를 소중히 간직하는 섬세한 감수성',
        keywords: ['그리움', '기억', '추억', '선율', '책갈피', '밤', '새벽', '편지', '조약돌', '무늬'],
    },
    distance: {
        label: '서로를 구속하지 않으면서도 진심으로 연결되는 건강한 거리감',
        keywords: ['거리', '보폭', '존중', '주파수', '리듬', '기다려', '신뢰', '교감', '정원'],
    },
    healing: {
        label: '지친 하루 끝에 말없이 서로의 안식처가 되어주는 포용력',
        keywords: ['지친', '힘들', '무게', '아픔', '우산', '새순', '안식', '기대', '포용력', '민낯'],
    },
    sensory: {
        label: '계절의 바람과 풍경 속에서 삶의 시를 발견하는 감각',
        keywords: ['바람', '햇살', '풍경', '수채화', '노을', '커피', '향기', '산책길', '골목', '색채'],
    },
};

function extractPersonaTitle(reportText: string): string | null {
    const match = reportText.match(/\*\*"([^"]+)"\*\*/);
    return match ? match[1] : null;
}

function extractDimensionVector(reportText: string): Record<string, number> {
    const vector: Record<string, number> = {};
    // 페르소나 타이틀과 사용자 직접 인용구("...")에 가중치 부여
    const title = extractPersonaTitle(reportText) ?? '';
    const quotes = (reportText.match(/"([^"]+)"/g) ?? []).join(' ');

    for (const [dim, { keywords }] of Object.entries(INNER_DIMENSIONS)) {
        let count = 0;
        for (const kw of keywords) {
            if (reportText.includes(kw)) count += 1;
            if (title.includes(kw)) count += 2;
            if (quotes.includes(kw)) count += 2;
        }
        vector[dim] = count;
    }
    return vector;
}

/**
 * Claude API 크레딧 부족 또는 일시 장애 시에도 억지 매칭을 하지 않고,
 * 두 사람의 리포트 내면 차원 벡터와 페르소나 결을 교차 검증해 75점 이상일 때만 매칭하는 로컬 공명 검증기
 */
export function evaluateLocalResonance(
    targetUser: { id: string; nickname: string; birth_year: number; report: string },
    candidates: MatchCandidate[]
): MatchResult | null {
    if (!targetUser.report || targetUser.report.trim().length < 20) return null;

    const targetVec = extractDimensionVector(targetUser.report);
    const targetTitle = extractPersonaTitle(targetUser.report);
    let bestCandidate: MatchCandidate | null = null;
    let bestScore = 0;
    let sharedThemes: string[] = [];

    for (const candidate of candidates) {
        if (!candidate.report || candidate.report.trim().length < 20) continue;

        const candVec = extractDimensionVector(candidate.report);
        let overlapScore = 54; // 기본 출발 점수
        const currentThemes: string[] = [];

        for (const [dim, info] of Object.entries(INNER_DIMENSIONS)) {
            const tVal = targetVec[dim] || 0;
            const cVal = candVec[dim] || 0;

            if (tVal >= 2 && cVal >= 2) {
                // 두 사람 모두 해당 내면 차원이 뚜렷하게 나타난 경우 높은 가점
                overlapScore += Math.min(15, (tVal + cVal) * 2.5);
                currentThemes.push(info.label);
            } else if (tVal >= 1 && cVal >= 1) {
                overlapScore += 6;
                currentThemes.push(info.label);
            } else if ((tVal >= 4 && cVal === 0) || (cVal >= 4 && tVal === 0)) {
                // 한쪽은 강하게 나타나는데 다른 쪽은 전혀 없는 경우 감점 (결의 불일치)
                overlapScore -= 5;
            }
        }

        // 상호 보완 보너스 1: 한쪽의 피로/치유(healing) 욕구와 다른 쪽의 다정함(warmth)이 만날 때
        if ((targetVec.healing >= 2 && candVec.warmth >= 2) || (candVec.healing >= 2 && targetVec.warmth >= 2)) {
            overlapScore += 9;
            if (!currentThemes.includes(INNER_DIMENSIONS.healing.label)) {
                currentThemes.push(INNER_DIMENSIONS.healing.label);
            }
        }

        // 상호 보완 보너스 2: 고요함(solitude)과 건강한 거리감(distance)의 조화
        if ((targetVec.solitude >= 2 && candVec.distance >= 2) || (candVec.solitude >= 2 && targetVec.distance >= 2)) {
            overlapScore += 7;
        }

        // 나이대 근접 보너스 (대화의 시대적 정서 공감대)
        const ageDiff = Math.abs((targetUser.birth_year || 2000) - (candidate.birth_year || 2000));
        if (ageDiff <= 3) overlapScore += 3;
        else if (ageDiff >= 9) overlapScore -= 4;

        const finalScore = Math.min(98, Math.round(overlapScore));
        if (finalScore > bestScore) {
            bestScore = finalScore;
            bestCandidate = candidate;
            sharedThemes = currentThemes;
        }
    }

    // 최소 공명 커트라인(75점) 미달 시 억지 매칭 거부
    if (!bestCandidate || bestScore < MIN_RESONANCE_SCORE || sharedThemes.length === 0) {
        return null;
    }

    const candTitle = extractPersonaTitle(bestCandidate.report);
    const primaryTheme = sharedThemes[0];
    const secondaryTheme = sharedThemes[1] ?? '서로의 속도를 배려하는 다정한 시선';

    const personaContext =
        targetTitle && candTitle
            ? `'${targetTitle}'의 결을 지닌 ${targetUser.nickname}님과 '${candTitle}'의 내면을 지닌 ${bestCandidate.nickname}님은 `
            : `두 분의 내면 리포트를 심층 대조한 결과, `;

    return {
        matchedUserId: bestCandidate.id,
        resonanceScore: bestScore,
        reason: `${personaContext}'${primaryTheme}' 및 '${secondaryTheme}'에서 깊은 주파수 일치가 확인되었습니다. 억지로 꾸며내지 않아도 서로의 고요함과 온기를 가장 편안하게 이해해 줄 수 있는 인연입니다.`,
    };
}

/**
 * 대상 사용자와 후보군들의 주간 리포트를 바탕으로 엄격한 3대 공명 기준에 따라 AI 매칭을 수행합니다.
 * 공명 지수가 MIN_RESONANCE_SCORE(75점) 미만이면 억지로 매칭하지 않고 null을 반환합니다.
 */
export async function findBestMatch(
    targetUser: { id: string; nickname: string; birth_year: number; report: string },
    candidates: MatchCandidate[]
): Promise<MatchResult | null> {
    if (!candidates || candidates.length === 0) return null;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key' || Date.now() < claudeMatchSkipUntil) {
        return evaluateLocalResonance(targetUser, candidates);
    }

    try {
        const anthropic = new Anthropic({ apiKey });

        const candidatesString = candidates
            .map(
                (c, i) =>
                    `[후보 ${i + 1}] ID: ${c.id}\n닉네임: ${c.nickname}\n나이: ${new Date().getFullYear() - c.birth_year}세\n내면 분석 리포트:\n${c.report}`
            )
            .join('\n\n-----------------\n\n');

        const prompt = `당신은 사람들의 내면 기록(심리 분석 리포트)을 심층 대조하여, 진짜 서로를 울릴 수 있는(Resonance) 인연만을 엄격하게 선별하는 RESONANCE의 수석 심리 매칭 검증관입니다.

[절대 원칙: 억지 매칭 금지]
- 단순히 후보가 있다고 해서 무조건 한 명을 고르지 마세요.
- 아래 3대 공명 평가 기준을 합산한 공명 지수(resonanceScore)가 ${MIN_RESONANCE_SCORE}점 미만이라면, 가차 없이 "matchedUserId": null 을 반환하여 매칭을 보류해야 합니다.

[3대 내면 공명 채점 기준 (총 100점)]
1. 정서적 온도와 감수성의 결 (40점): 일상의 풍경, 음악, 기억에서 위로를 얻는 방식과 감정의 온도가 서로 닮아 있는가?
2. 관계의 거리감과 소통 리듬 (35점): 타인과 맺고 싶어 하는 심리적 거리(혼자만의 공간 존중 vs 정서적 밀착)가 충돌하지 않고 조화로운가?
3. 상호 치유와 울림의 가능성 (25점): 한 사람의 내면적 갈증이나 지친 마음을 다른 사람의 고유한 다정함이 자연스럽게 감싸줄 수 있는가?

[대상 사용자]
ID: ${targetUser.id}
닉네임: ${targetUser.nickname}
나이: ${new Date().getFullYear() - targetUser.birth_year}세
내면 분석 리포트:
${targetUser.report}

[후보군 목록]
${candidatesString}

위 대상 사용자와 후보군을 3대 기준으로 엄밀히 대조해 주세요.
가장 높은 공명을 보인 후보가 ${MIN_RESONANCE_SCORE}점 이상일 때만 해당 후보의 ID를 반환하고, 모든 후보가 ${MIN_RESONANCE_SCORE}점 미만이면 "matchedUserId": null 로 반환하세요.
결과는 반드시 아래 JSON 형식으로만 반환해야 합니다.

{
  "matchedUserId": "선택된 후보의 ID 문자열 또는 기준 미달 시 null",
  "resonanceScore": 0부터 100 사이의 정수,
  "reason": "두 사람의 리포트 속 어떤 구체적인 감정선·공간감·관계의 태도가 서로 맞닿아 있는지 설명하는 1차 공명 보증서 (존댓말, 2~3문장)"
}`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 600,
            temperature: 0.3,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const textResponse = message.content.find((block) => block.type === 'text')?.text;
        if (!textResponse) {
            return evaluateLocalResonance(targetUser, candidates);
        }

        const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]) as MatchResult;
            if (!result.matchedUserId || result.resonanceScore < MIN_RESONANCE_SCORE) {
                return null;
            }
            return result;
        }
    } catch (error) {
        // 크레딧 부족 또는 인증 오류 시 10분간 서킷 브레이커 작동하여 배치 타임아웃 방지
        claudeMatchSkipUntil = Date.now() + 10 * 60 * 1000;
        console.warn('Claude 매칭 API 비활성/크레딧 부족 감지 — 로컬 내면 벡터 검증기로 즉시 전환합니다:', error instanceof Error ? error.message : error);
        return evaluateLocalResonance(targetUser, candidates);
    }

    return null;
}

