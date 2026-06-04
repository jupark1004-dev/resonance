// Claude API를 사용한 주간 분석 함수 (+ 로컬 폴백)
import Anthropic from '@anthropic-ai/sdk';

interface ResponseForAnalysis {
    question_text: string;
    category: string;
    text_response: string | null;
    image_url: string | null;
    responded_at: string;
}

/**
 * 사용자의 응답 텍스트에서 감정 키워드를 추출하여
 * 따뜻하고 개인화된 리포트를 로컬에서 생성합니다.
 * Claude API 호출 없이 동작하는 폴백 분석기입니다.
 */
function generateLocalReport(responses: ResponseForAnalysis[]): string {
    const allText = responses
        .map((r) => r.text_response ?? '')
        .join(' ');

    // 카테고리별 응답 수 집계
    const categoryCount: Record<string, number> = {};
    for (const r of responses) {
        const cat = r.category || 'emotion';
        categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
    }
    const dominantCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'emotion';

    // 감정 키워드 감지
    const emotionKeywords = {
        warmth: ['따뜻', '다정', '포근', '안아', '위로', '좋아', '사랑', '고마', '행복'],
        longing: ['그리', '보고 싶', '돌아가', '옛날', '추억', '기억', '그때', '과거'],
        solitude: ['혼자', '고요', '조용', '아무도', '한적', '카페', '구석', '창가', '밤'],
        fatigue: ['지쳤', '힘들', '피곤', '눈물', '울었', '무겁', '버겁', '쉬고'],
        connection: ['누군가', '친구', '사람', '관계', '거리', '연결', '함께', '곁에'],
    };

    const detected: string[] = [];
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        for (const kw of keywords) {
            if (allText.includes(kw)) {
                detected.push(emotion);
                break;
            }
        }
    }

    // 응답에서 인상적인 구절 발췌 (가장 긴 응답)
    const longestResponse = responses
        .filter((r) => r.text_response)
        .sort((a, b) => (b.text_response?.length ?? 0) - (a.text_response?.length ?? 0))[0];
    const quote = longestResponse?.text_response?.substring(0, 30) ?? '';

    // 카테고리별 타이틀
    const titleMap: Record<string, string[]> = {
        emotion: [
            '조용히 빛나는 감정의 결을 가진 사람',
            '마음 깊은 곳에 따뜻한 불씨를 품은 사람',
            '감정의 파도를 온유하게 타는 사람',
        ],
        relationship: [
            '사람과 사람 사이, 가장 아름다운 거리를 아는 사람',
            '보이지 않는 다리를 놓는 사람',
            '관계 속에서 고요한 빛을 만드는 사람',
        ],
        space: [
            '자신만의 아지트에서 세상을 바라보는 사람',
            '고요한 공간에서 마음을 정돈하는 사람',
            '풍경 속에 자신을 녹여내는 사람',
        ],
        time: [
            '시간의 강을 다정하게 건너는 사람',
            '과거와 현재 사이에서 빛을 찾는 사람',
            '흘러간 시간 속에서도 온기를 간직한 사람',
        ],
    };
    const titles = titleMap[dominantCategory] ?? titleMap['emotion'];
    const title = titles[Math.floor(Math.random() * titles.length)];

    // 감정 조합에 따른 첫 번째 문단 (공감과 요약)
    let paragraph1 = '';
    if (detected.includes('fatigue') && detected.includes('warmth')) {
        paragraph1 = `이번 주 당신의 기록을 찬찬히 읽어보았어요. 조금 지치고 무거운 하루들 사이에서도, 작은 것들에 마음을 기울이는 당신의 다정함이 문장마다 조용히 배어 있었습니다. 힘든 날에도 주변을 향한 따뜻한 시선을 놓지 않는 모습이 정말 인상 깊었어요.`;
    } else if (detected.includes('longing')) {
        paragraph1 = `이번 주 당신의 이야기 속에는 그리움이라는 부드러운 실이 조용히 흐르고 있었어요. 과거의 어떤 순간, 어떤 사람을 떠올리며 마음이 아련해지는 시간들이 있었던 것 같습니다. 그 그리움은 당신이 얼마나 깊이 사랑할 수 있는 사람인지를 보여주는 아름다운 증거예요.`;
    } else if (detected.includes('solitude')) {
        paragraph1 = `이번 주 당신의 기록에서는 고요하고 섬세한 감수성이 느껴졌어요. 혼자만의 시간과 공간을 소중히 여기면서도, 그 고요함 속에서 자신만의 방식으로 세상과 연결되려는 마음이 보였습니다. 당신의 내면에는 잔잔한 호수 같은 평화로움이 자리 잡고 있어요.`;
    } else if (detected.includes('connection')) {
        paragraph1 = `이번 주 당신의 이야기들을 읽으며, 사람과의 관계를 얼마나 세심하게 가꾸는 분인지 느낄 수 있었어요. 적당한 거리를 유지하면서도 진심으로 다가가고 싶은 마음, 그 사이에서 고민하는 당신의 모습이 참 따뜻했습니다.`;
    } else {
        paragraph1 = `이번 주 당신의 기록을 한 줄 한 줄 따라가다 보니, 평범한 일상 속에서도 특별한 의미를 발견하는 당신만의 시선이 느껴졌어요. 작은 순간들을 소중히 기록하는 모습에서 당신이 삶을 얼마나 섬세하게 살아가고 있는지 알 수 있었습니다.`;
    }

    // 두 번째 문단 (관계와 매력)
    let paragraph2 = '';
    if (quote.length > 10) {
        paragraph2 = `"${quote}..." 라고 적어주신 부분에서 특히 마음이 머물렀어요. 이 한 문장 안에 당신이 타인과 세상을 대하는 태도가 고스란히 담겨 있는 것 같습니다. 당신은 말로 표현하지 않아도 곁에 있는 것만으로 위안이 되는 사람, 그런 조용한 따뜻함을 가진 분이에요. 본인은 미처 느끼지 못하셨겠지만, 당신의 그 섬세한 감수성은 주변 사람들에게 소리 없는 위로가 되고 있을 거예요.`;
    } else {
        paragraph2 = `당신의 답변들을 통해 느낀 건, 겉으로는 조용해 보여도 내면에는 풍성한 감정의 세계가 펼쳐져 있다는 거예요. 타인의 마음을 먼저 헤아리고, 자신의 감정은 조심스럽게 간직하는 성향이 엿보였습니다. 그건 연약함이 아니라, 당신만이 가진 가장 아름다운 강점이에요.`;
    }

    // 세 번째 문단 (응원과 여운)
    const closings = [
        `이번 주도 수고 많으셨어요. 당신의 하루하루가 누군가에게는 따뜻한 영감이 되고 있다는 걸 기억해 주세요. 다음 주에도 당신만의 속도로, 당신만의 방식으로 걸어가시길 응원합니다. 🌿`,
        `오늘 하루의 끝에서, 잠시 눈을 감고 이번 주의 나에게 "잘했어"라고 말해주세요. 당신은 생각보다 훨씬 더 멋진 사람이에요. 다음 주에 또 만나요. ✨`,
        `세상이 아무리 빠르게 돌아가도, 당신의 마음은 당신만의 리듬으로 뛰고 있어요. 그 리듬이 참 아름답습니다. 다음 주에도 솔직한 당신의 이야기를 기다릴게요. 💫`,
    ];
    const paragraph3 = closings[Math.floor(Math.random() * closings.length)];

    return `**"${title}"**\n\n${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;
}

/**
 * 7일치 응답을 분석하여 주간 리포트를 생성합니다.
 * Claude API를 우선 시도하고, 실패 시 로컬 폴백으로 자동 전환합니다.
 */
export async function analyzeWeeklyResponses(
    responses: ResponseForAnalysis[]
): Promise<string> {
    // Claude API 시도
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey || apiKey === 'your-anthropic-api-key') {
            console.log('Claude API 키가 설정되지 않았습니다. 로컬 분석으로 대체합니다.');
            return generateLocalReport(responses);
        }

        const anthropic = new Anthropic({ apiKey });

        // 응답 데이터를 JSON으로 구성
        const responsesData = responses.map((r, i) => ({
            day: i + 1,
            category: r.category,
            question: r.question_text,
            answer: r.text_response ?? '(이미지로 답변)',
            has_image: !!r.image_url,
        }));

        // 이미지가 포함된 응답 처리
        const contentBlocks: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

        // 텍스트 데이터 추가
        contentBlocks.push({
            type: 'text',
            text: `다음은 사용자의 최근 ${responses.length}일간의 질문과 응답입니다. 이 데이터를 분석해 주세요.\n\n${JSON.stringify(responsesData, null, 2)}`,
        });

        // 이미지 응답이 있으면 vision으로 분석 요청
        for (const response of responses) {
            if (response.image_url) {
                try {
                    const imgRes = await fetch(response.image_url);
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const base64Data = Buffer.from(arrayBuffer).toString('base64');
                    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

                    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
                    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) {
                        mediaType = contentType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
                    }

                    contentBlocks.push({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mediaType,
                            data: base64Data,
                        },
                    });
                } catch (error) {
                    console.error('이미지 변환 실패:', error);
                }
            }
        }

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1024,
            system: `당신은 사용자의 일주일치 기록을 가장 먼저, 그리고 다정하게 읽고 깊은 내면의 빛을 발견해주는 숙련된 심리 분석가입니다.

[분석 및 작성 원칙]
1. 어조: 일기장을 조심스럽게 마주하듯, 다정하고 포근한 존댓말('-해요/해드려요/입니다')을 사용합니다. 기계적이거나 가르치려는 태도는 지양합니다.
2. 수용: 모순된 감정이나 부정적인 감정도 자연스럽고 의미 있는 것으로 온전히 수용합니다. 섣부른 긍정을 강요하지 않습니다.
3. 통찰(자기발견): 표면적인 응답 이면에 숨겨진 사용자의 고유한 가치관, 타인과 세상을 대하는 섬세한 태도, 본인도 미처 깨닫지 못한 매력적인 성향을 부드럽게 짚어줍니다.
4. 구조 및 형식:
   - 1문단 (공감과 요약): 한 주간의 전반적인 감정선과 주요 테마에 대한 따뜻한 공감
   - 2문단 (관계와 매력): 타인과 관계를 맺는 방식, 그리고 그 안에서 빛나는 사용자만의 특별한 매력이나 가치
   - 3문단 (응원과 여운): 마음에 울림을 주는 따뜻한 문장으로 마무리
   - 기계적인 번호매기기(1., 2.)는 절대 사용하지 않으며, 한 편의 다정한 편지 같은 산문 형식으로 500자 내외로 작성합니다.

이미지가 포함된 경우에는, 그 이미지가 품고 있는 분위기와 피사체, 색감이 사용자의 현재 마음 상태를 어떻게 투영하고 있는지 시적이면서도 자연스럽게 연결해 주세요.`,
            messages: [
                {
                    role: 'user',
                    content: contentBlocks,
                },
            ],
        });

        // 텍스트 응답 추출
        const textBlock = message.content.find((block) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error('분석 결과를 생성하지 못했습니다.');
        }

        return textBlock.text;
    } catch (error) {
        console.error('Claude API 호출 실패, 로컬 분석으로 대체합니다:', error);
        return generateLocalReport(responses);
    }
}
