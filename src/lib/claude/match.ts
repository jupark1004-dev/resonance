import Anthropic from '@anthropic-ai/sdk';

export const MIN_RESONANCE_SCORE = 75;

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

// 내면 리포트의 5대 심리·가치관 차원 키워드 사전
const INNER_DIMENSIONS: Record<string, { label: string; keywords: string[] }> = {
    warmth: {
        label: '일상의 작은 온기와 다정함을 발견하는 시선',
        keywords: ['따뜻', '다정', '포근', '위로', '온기', '웃음', '고마', '배려', '마음'],
    },
    solitude: {
        label: '고요한 혼자만의 시간과 내면의 여유를 존중하는 태도',
        keywords: ['고요', '조용', '혼자', '창가', '카페', '산책', '여유', '호수', '공간', '아지트'],
    },
    depth: {
        label: '기억과 감정의 깊이를 소중히 간직하는 섬세한 감수성',
        keywords: ['그리움', '기억', '추억', '노래', '계절', '밤', '새벽', '편지', '시간', '깊이'],
    },
    distance: {
        label: '서로를 구속하지 않으면서도 진심으로 연결되는 건강한 거리감',
        keywords: ['거리', '걸음', '존중', '속도', '리듬', '기다림', '신뢰', '편안'],
    },
    healing: {
        label: '지친 하루 끝에 말없이 서로의 안식처가 되어주는 포용력',
        keywords: ['지친', '힘들', '피곤', '안아', '쉬고', '안식', '기대어', '응원', '토닥'],
    },
};

function extractDimensionVector(reportText: string): Record<string, number> {
    const vector: Record<string, number> = {};
    for (const [dim, { keywords }] of Object.entries(INNER_DIMENSIONS)) {
        let count = 0;
        for (const kw of keywords) {
            if (reportText.includes(kw)) count++;
        }
        vector[dim] = count;
    }
    return vector;
}

/**
 * Claude API 일시 장애 시에도 억지 매칭을 하지 않고,
 * 두 사람의 리포트 내면 차원 벡터를 교차 검증해 75점 이상일 때만 매칭하는 로컬 공명 검증기
 */
export function evaluateLocalResonance(
    targetUser: { id: string; nickname: string; birth_year: number; report: string },
    candidates: MatchCandidate[]
): MatchResult | null {
    if (!targetUser.report || targetUser.report.trim().length < 20) return null;

    const targetVec = extractDimensionVector(targetUser.report);
    let bestCandidate: MatchCandidate | null = null;
    let bestScore = 0;
    let sharedThemes: string[] = [];

    for (const candidate of candidates) {
        if (!candidate.report || candidate.report.trim().length < 20) continue;

        const candVec = extractDimensionVector(candidate.report);
        let overlapScore = 55; // 기본 출발 점수
        const currentThemes: string[] = [];

        for (const [dim, info] of Object.entries(INNER_DIMENSIONS)) {
            const tVal = targetVec[dim] || 0;
            const cVal = candVec[dim] || 0;

            if (tVal > 0 && cVal > 0) {
                // 두 사람 모두 해당 내면 차원이 나타난 경우 가점
                overlapScore += Math.min(14, (tVal + cVal) * 3.5);
                currentThemes.push(info.label);
            } else if ((tVal >= 3 && cVal === 0) || (cVal >= 3 && tVal === 0)) {
                // 한쪽은 강하게 나타나는데 다른 쪽은 전혀 없는 경우 감점 (결의 불일치)
                overlapScore -= 6;
            }
        }

        // 상호 보완 보너스: 한쪽의 피로/치유(healing) 욕구와 다른 쪽의 다정함(warmth)이 만날 때
        if ((targetVec.healing > 0 && candVec.warmth >= 2) || (candVec.healing > 0 && targetVec.warmth >= 2)) {
            overlapScore += 8;
        }

        const finalScore = Math.min(97, Math.round(overlapScore));
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

    const primaryTheme = sharedThemes[0];
    const secondaryTheme = sharedThemes[1] ?? '서로의 속도를 배려하는 다정한 시선';

    return {
        matchedUserId: bestCandidate.id,
        resonanceScore: bestScore,
        reason: `두 분의 내면 리포트를 대조한 결과, '${primaryTheme}'과 '${secondaryTheme}'에서 깊은 주파수 일치가 확인되었습니다. 억지로 꾸며내지 않아도 서로의 고요함과 온기를 가장 편안하게 이해해 줄 수 있는 인연입니다.`,
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
    if (!apiKey || apiKey === 'your-anthropic-api-key') {
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
        console.error('Claude 매칭 API 호출 실패, 로컬 내면 벡터 검증기로 대체합니다:', error);
        return evaluateLocalResonance(targetUser, candidates);
    }

    return null;
}
