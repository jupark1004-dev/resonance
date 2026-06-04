import Anthropic from '@anthropic-ai/sdk';
import { AnalysisReport } from '@/types';

export interface MatchCandidate {
    id: string;
    nickname: string;
    birth_year: number;
    report: string;
}

export interface MatchResult {
    matchedUserId: string;
    resonanceScore: number;
    reason: string;
}

/**
 * 대상 사용자와 후보군들의 주간 리포트를 바탕으로 AI 매칭을 수행합니다.
 */
export async function findBestMatch(
    targetUser: { id: string; nickname: string; birth_year: number; report: string },
    candidates: MatchCandidate[]
): Promise<MatchResult | null> {
    if (!candidates || candidates.length === 0) return null;

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const candidatesString = candidates
        .map((c, i) => `[후보 ${i + 1}] ID: ${c.id} \n닉네임: ${c.nickname} \n나이: ${new Date().getFullYear() - c.birth_year}세 \n심리 리포트: ${c.report}`)
        .join('\n\n-----------------\n\n');

    const prompt = `당신은 사람들의 내면 깊은 곳(주파수)을 읽고 영혼의 단짝을 맺어주는 최고의 매칭 전문가입니다.

[대상 사용자]
ID: ${targetUser.id}
닉네임: ${targetUser.nickname}
나이: ${new Date().getFullYear() - targetUser.birth_year}세
심리 리포트: ${targetUser.report}

[후보군 목록]
${candidatesString}

위 대상 사용자와 심리적으로 가장 깊은 공명(Resonance)을 이룰 수 있는 후보 단 한 명을 선택해 주세요.
결과는 반드시 아래 JSON 형식으로만 반환해야 합니다. 다른 텍스트는 덧붙이지 마세요.

{
  "matchedUserId": "선택된 후보의 ID 문자열",
  "resonanceScore": 0부터 100 사이의 숫자 (공명 지수),
  "reason": "왜 이 두 사람이 영혼의 단짝이 될 수 있는지에 대한 따뜻하고 시적인 설명 (존댓말로 3문장 이내)"
}
`;

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 500,
        temperature: 0.5,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });

    const textResponse = message.content.find((block) => block.type === 'text')?.text;
    if (!textResponse) return null;

    try {
        // 응답 텍스트에서 JSON 부분만 추출 (Claude가 가끔 빈 줄이나 마크다운 백틱을 넣을 수 있음)
        const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]) as MatchResult;
            return result;
        }
    } catch (error) {
        console.error('Claude 매칭 결과 JSON 파싱 실패:', error);
    }
    
    return null;
}
