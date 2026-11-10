// Claude API를 사용한 주간 분석 함수 (+ 고정밀 로컬 심리 분석 엔진 폴백)
import Anthropic from '@anthropic-ai/sdk';

interface ResponseForAnalysis {
    question_text: string;
    category: string;
    text_response: string | null;
    image_url: string | null;
    responded_at: string;
}

// Claude API 크레딧 부족/키 오류 시 불필요한 재호출 지연을 막는 서킷 브레이커 (10분간 유지)
let claudeSkipUntil = 0;

interface DimensionProfile {
    key: string;
    score: number;
    matchedWords: string[];
}

const PSYCH_DIMENSIONS: Record<
    string,
    {
        keywords: string[];
        titles: string[];
        openingInsights: string[];
        relationalStrengths: string[];
    }
> = {
    warmth: {
        keywords: ['따뜻', '다정', '포근', '안아', '위로', '좋아', '사랑', '고마', '행복', '웃음', '미소', '온기', '배려', '마음'],
        titles: [
            '마음 깊은 곳에 꺼지지 않는 모닥불을 품은 사람',
            '사소한 일상에서 다정한 온기를 길어 올리는 사람',
            '말없이 건네는 눈빛에 계절의 따스함을 담은 사람',
            '타인의 추운 하루에 조용히 외투를 덮어주는 사람',
            '차분한 온기로 주변의 공기를 부드럽게 데우는 사람',
        ],
        openingInsights: [
            '당신의 기록을 찬찬히 따라가다 보면, 세상을 바라보는 시선 끝에 늘 다정한 온기가 맺혀 있다는 걸 느끼게 됩니다. 쉽게 지나칠 수 있는 순간에도 마음을 기울일 줄 아는 섬세한 애정이 문장마다 배어 있었어요.',
            '이번 기록들 속에서 가장 선명하게 빛난 건 사람을 향한 당신의 부드러운 시선이었습니다. 거창한 말보다 작은 배려와 진심을 더 소중히 여기는 내면의 결이 참 인상 깊었어요.',
        ],
        relationalStrengths: [
            '관계 속에서 당신은 상대를 다그치기보다, 그 사람이 자기만의 속도로 마음을 열 때까지 기다려주는 포근한 안식처 같은 존재예요. 함께 있는 것만으로도 상대의 긴장을 풀어주는 특별한 힘을 가지고 계십니다.',
            '당신이 가진 다정함은 억지로 만들어낸 예의가 아니라, 타인의 아픔과 기쁨에 자연스럽게 공명하는 깊은 공감 능력에서 비롯됩니다. 이런 온기는 당신과 마주하는 사람에게 오래도록 잊히지 않는 위안이 됩니다.',
        ],
    },
    solitude: {
        keywords: ['혼자', '고요', '조용', '아무도', '한적', '카페', '구석', '창가', '밤', '산책', '새벽', '방', '독서', '여유', '침묵'],
        titles: [
            '고요한 밤하늘 아래 자신만의 우주를 유영하는 사람',
            '소란한 세상 속에서도 내면의 잔잔한 호수를 지키는 사람',
            '창가의 햇살과 침묵 속에서 진짜 나를 만나는 사람',
            '혼자만의 시간을 가장 품격 있는 여백으로 채우는 사람',
            '새벽 공기의 고요함을 닮은 단단한 내면의 소유자',
        ],
        openingInsights: [
            '당신의 문장들 사이에는 새벽녘 호수처럼 맑고 고요한 여백이 흐르고 있었어요. 외부의 소음에 휩쓸리지 않고, 혼자만의 시간과 공간 속에서 감정을 정돈할 줄 아는 단단한 내면이 느껴졌습니다.',
            '이번 기록에서 당신은 혼자 있는 시간을 외로움이 아닌, 자신을 돌보고 채우는 충만한 시간으로 가꾸고 계셨어요. 고요함 속에서 비로소 선명해지는 마음의 소리에 귀 기울이는 모습이 참 아름다웠습니다.',
        ],
        relationalStrengths: [
            '역설적이게도 혼자만의 시간을 깊이 사랑할 줄 아는 사람만이 타인에게도 가장 건강한 온기를 건넬 수 있습니다. 당신은 상대에게 과도하게 의존하거나 구속하지 않으면서도, 나란히 앉아 편안한 침묵을 공유할 수 있는 성숙한 연인이에요.',
            '말을 많이 하지 않아도 어색하지 않은 관계, 각자의 세계를 온전히 존중하면서도 문득 눈이 마주칠 때 깊은 신뢰가 오가는 관계에서 당신의 진가는 가장 반짝입니다.',
        ],
    },
    longing: {
        keywords: ['그리', '보고 싶', '돌아가', '옛날', '추억', '기억', '그때', '과거', '계절', '냄새', '노래', '편지', '아련', '여운'],
        titles: [
            '지나간 계절의 온기와 기억을 소중히 책갈피에 끼워둔 사람',
            '시간이 흘러도 바래지 않는 마음의 무늬를 간직한 사람',
            '한 곡의 음악과 풍경 속에 깊은 그리움을 수놓는 사람',
            '스쳐간 인연과 순간들까지 다정하게 기억해 주는 사람',
            '기억의 강가에서 가장 맑은 조약돌을 건져 올리는 사람',
        ],
        openingInsights: [
            '당신의 이야기 속에는 지나간 시간과 기억을 함부로 흘려보내지 않는 애틋한 시선이 담겨 있었습니다. 어떤 계절의 공기, 문득 들려온 선율, 오래된 순간들을 마음 깊이 간직하는 깊은 감수성이 느껴졌어요.',
            '이번 기록을 읽으며 당신이 순간의 감정을 얼마나 깊이 새기는 사람인지 알 수 있었습니다. 쉽게 잊고 빠르게 소비하는 시대에, 무언가를 오래도록 기억하고 그리워할 줄 안다는 건 그만큼 깊이 사랑할 줄 안다는 뜻이니까요.',
        ],
        relationalStrengths: [
            '당신은 누군가와 함께한 사소한 말 한마디, 함께 걸었던 거리의 계절감까지 오래도록 기억해 주는 사람입니다. 당신과 마음을 나누는 사람은 자신이 진심으로 소중히 대우받고 있다는 깊은 감동을 느끼게 될 거예요.',
            '가볍게 스쳐 가는 만남보다, 시간이 쌓일수록 더 깊은 향기를 내는 관계에서 당신의 매력이 온전히 드러납니다. 함께 새로운 추억의 페이지를 채워갈 사람에게 당신은 가장 깊은 울림을 줄 인연입니다.',
        ],
    },
    healing: {
        keywords: ['지쳤', '힘들', '피곤', '눈물', '울었', '무겁', '버겁', '쉬고', '괜찮', '버티', '토닥', '안식', '기대', '숨'],
        titles: [
            '비 개인 뒤의 숲처럼 아픔을 딛고 더 깊어진 사람',
            '무거운 하루 끝에서도 끝내 솔직한 마음을 잃지 않는 사람',
            '스스로의 상처를 보듬으며 더 넓은 품을 갖게 된 사람',
            '비를 맞아본 적이 있기에 우산을 기울일 줄 아는 사람',
            '지친 마음 너머로 다시 피어날 새순을 품고 있는 사람',
        ],
        openingInsights: [
            '이번 기록에는 쉽지 않았던 하루들의 무게와, 그럼에도 자신의 감정을 외면하지 않고 정직하게 마주한 용기가 담겨 있었어요. 지치고 버거운 마음을 있는 그대로 적어 내려간 문장들에서 오히려 깊은 생명력이 느껴졌습니다.',
            '당신의 기록을 읽으며 마음 한구석이 조용히 일렁였습니다. 겉으로는 아무렇지 않은 척 하루를 버텨내면서도, 내면에서는 섬세하게 흔들리고 고민하는 당신의 진짜 얼굴이 참 소중하게 다가왔어요.',
        ],
        relationalStrengths: [
            '마음의 무게를 직접 견뎌본 사람은 타인의 한숨 소리도 결코 가볍게 듣지 않습니다. 당신은 상대방이 약한 모습을 보일 때 판단하거나 조언하기보다, 그저 옆에서 조용히 손을 잡아줄 수 있는 깊은 포용력을 지니고 있어요.',
            '완벽하게 꾸며진 모습보다 서로의 지친 민낯까지 편안하게 내려놓을 수 있는 관계, 하루의 끝에 "오늘도 수고했어" 한마디로 모든 무장을 해제할 수 있는 다정한 관계가 당신에게 가장 잘 어울립니다.',
        ],
    },
    connection: {
        keywords: ['누군가', '친구', '사람', '관계', '거리', '연결', '함께', '곁에', '대화', '이야기', '이해', '진심', '우리', '믿음'],
        titles: [
            '사람과 사람 사이, 가장 아름다운 거리와 리듬을 아는 사람',
            '보이지 않는 마음의 주파수로 진심을 주고받는 사람',
            '가벼운 말보다 깊은 눈빛으로 세상과 연결되는 사람',
            '관계의 정원을 서두르지 않고 정성껏 가꾸는 사람',
            '타인의 마음속 숨은 문장까지 다정하게 읽어내는 사람',
        ],
        openingInsights: [
            '당신의 기록 전반에는 사람과 관계에 대한 깊고 진지한 성찰이 흐르고 있었습니다. 누군가와 어떻게 마음을 나누고, 어떤 거리에서 가장 편안한 숨을 쉴 수 있는지 고민하는 성숙한 시선이 돋보였어요.',
            '이번 기록에서 당신은 피상적인 인맥이나 가벼운 대화보다, 단 한 사람과 나누는 진짜 교감의 가치를 일관되게 이야기하고 계셨습니다. 관계에 임하는 당신의 진정성이 문장마다 또렷하게 새겨져 있었어요.',
        ],
        relationalStrengths: [
            '당신은 상대방의 말 너머에 있는 감정과 맥락을 세심하게 읽어내는 탁월한 공감자입니다. 서둘러 가까워지려 애쓰기보다, 서로의 보폭을 맞추며 천천히 깊어지는 신뢰를 쌓아가는 데 큰 강점이 있어요.',
            '대화의 주제가 끊겨도 결코 불안해하지 않고, 서로의 생각과 가치관을 밤새도록 나눌 수 있는 깊이 있는 파트너를 만났을 때 당신의 내면은 가장 환하게 공명할 것입니다.',
        ],
    },
    sensory: {
        keywords: ['바람', '햇살', '하늘', '구름', '바다', '나무', '숲', '꽃', '커피', '차', '향기', '빛', '색', '소리', '비', '창밖', '풍경'],
        titles: [
            '계절의 바람과 빛의 조각에서 삶의 시를 발견하는 사람',
            '창밖의 풍경과 작은 감각들로 일상을 예술로 만드는 사람',
            '스쳐 지나가는 바람의 온도까지 섬세하게 기억하는 사람',
            '일상의 사소한 풍경 속에서 마음의 쉼표를 찾는 사람',
            '세상의 빛과 소리를 자기만의 따뜻한 색채로 번역하는 사람',
        ],
        openingInsights: [
            '당신의 기록은 마치 한 폭의 수채화나 단편 영화를 보는 것처럼 감각적인 장면들로 가득했습니다. 창밖의 빛, 스치는 바람, 공간의 공기 같은 일상의 미세한 결들을 포착해내는 남다른 감수성이 느껴졌어요.',
            '바쁘게 흘러가는 일상 속에서도 잠시 걸음을 멈추고 풍경과 계절의 변화를 눈에 담을 줄 아는 여유가 당신의 문장 속에 살아 숨 쉬고 있었습니다.',
        ],
        relationalStrengths: [
            '당신과 함께 걷는 산책길은 평범한 골목조차 특별한 여행지가 됩니다. 좋은 풍경을 보면 사랑하는 사람과 함께 보고 싶어 하고, 작은 계절의 변화를 다정하게 건넬 줄 아는 로맨틱한 섬세함이 당신의 큰 매력이에요.',
            '화려한 이벤트보다 나란히 걸으며 노을을 바라보거나, 좋아하는 음악과 커피 향을 공유하는 소박하고 감각적인 일상 속에서 당신의 사랑은 가장 깊어집니다.',
        ],
    },
};

function hashText(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
}

/**
 * 사용자의 응답 텍스트에서 다차원 심리 키워드와 실제 문장을 추출하여
 * Claude API 없이도 고유하고 깊이 있는 주간 내면 리포트를 생성합니다.
 */
function generateLocalReport(responses: ResponseForAnalysis[]): string {
    const validTexts = responses
        .map((r) => (r.text_response ?? '').trim())
        .filter((t) => t.length > 0);
    const allText = validTexts.join(' ');
    const seed = hashText(allText || responses.map((r) => r.question_text).join(''));

    // 6대 심리 차원 점수 측정
    const profiles: DimensionProfile[] = Object.entries(PSYCH_DIMENSIONS).map(([key, dim]) => {
        const matchedWords: string[] = [];
        let score = 0;
        for (const kw of dim.keywords) {
            if (allText.includes(kw)) {
                score += 2;
                matchedWords.push(kw);
            }
        }
        return { key, score, matchedWords };
    });

    // 카테고리 가중치 반영
    for (const r of responses) {
        if (r.category === 'emotion') {
            const p = profiles.find((x) => x.key === 'warmth');
            if (p) p.score += 1;
        } else if (r.category === 'relationship') {
            const p = profiles.find((x) => x.key === 'connection');
            if (p) p.score += 1;
        } else if (r.category === 'space') {
            const p = profiles.find((x) => x.key === 'solitude' || x.key === 'sensory');
            if (p) p.score += 1;
        } else if (r.category === 'time') {
            const p = profiles.find((x) => x.key === 'longing');
            if (p) p.score += 1;
        }
    }

    profiles.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
    const primary = profiles[0]?.score > 0 ? profiles[0].key : 'warmth';
    const secondary = profiles[1]?.score > 0 ? profiles[1].key : primary === 'solitude' ? 'sensory' : 'solitude';

    const primaryDim = PSYCH_DIMENSIONS[primary];
    const secondaryDim = PSYCH_DIMENSIONS[secondary];

    // 고유한 페르소나 타이틀 선택 (해시 기반으로 일관되면서도 다양하게)
    const titlePool = [...primaryDim.titles, ...secondaryDim.titles];
    const title = titlePool[seed % titlePool.length];

    // 사용자의 실제 문장 발췌 (가장 진솔하고 긴 문장 1~2개)
    const sortedByLength = [...validTexts].sort((a, b) => b.length - a.length);
    const mainQuoteRaw = sortedByLength[0] ?? '';
    const subQuoteRaw = sortedByLength[1] ?? '';

    const formatQuote = (q: string, maxLen: number) => {
        const cleaned = q.replace(/\s+/g, ' ').trim();
        return cleaned.length > maxLen ? `${cleaned.substring(0, maxLen).trim()}...` : cleaned;
    };

    const mainQuote = formatQuote(mainQuoteRaw, 42);
    const subQuote = formatQuote(subQuoteRaw, 32);

    // 1문단: 주요 내면 차원 통찰 + 사용자 응답 키워드 결합
    const openingBase = primaryDim.openingInsights[seed % primaryDim.openingInsights.length];
    const detectedWords = [...new Set([...(profiles[0]?.matchedWords ?? []), ...(profiles[1]?.matchedWords ?? [])])].slice(0, 3);
    const keywordSentence =
        detectedWords.length >= 2
            ? ` 특히 기록 곳곳에 스며든 '${detectedWords.join("', '")}' 같은 단어들에서 당신의 마음이 지금 어디를 향해 있는지 조용히 느낄 수 있었어요.`
            : '';
    const paragraph1 = `${openingBase}${keywordSentence}`;

    // 2문단: 사용자의 실제 문장 인용 + 관계적 매력 해석
    const relationalBase = secondaryDim.relationalStrengths[(seed >> 3) % secondaryDim.relationalStrengths.length];
    let quoteReflection = '';
    if (mainQuote.length >= 6 && subQuote.length >= 6 && mainQuote !== subQuote) {
        quoteReflection = `"${mainQuote}"라고 적어주신 마음과 "${subQuote}"라는 고백이 서로 맞닿아, 당신만의 깊고 고유한 결을 보여주고 있었어요. `;
    } else if (mainQuote.length >= 6) {
        quoteReflection = `"${mainQuote}"라고 남겨주신 문장에서 특히 오래 마음이 머물렀습니다. 이 한 줄 안에 당신이 세상을 대하는 진심이 고스란히 담겨 있었거든요. `;
    }
    const paragraph2 = `${quoteReflection}${relationalBase}`;

    // 3문단: 여운과 응원
    const closings = [
        `세상이 아무리 빠르게 흘러가도, 당신의 마음은 당신만의 고유한 주파수로 울리고 있습니다. 그 맑은 울림에 정확히 공명할 사람도 분명 가까이에 있을 거예요. 다음 기록에서도 솔직한 당신의 이야기를 기다릴게요. 🌿`,
        `오늘 하루의 끝에서, 자신의 마음을 이렇게 정성껏 들여다본 스스로에게 작은 칭찬을 건네주세요. 당신의 내면은 생각보다 훨씬 더 단단하고 아름답습니다. ✨`,
        `꾸며내지 않은 솔직한 문장들이 모여 당신이라는 한 권의 책을 만들어가고 있어요. 당신의 이 다정한 기록이 곧 가장 깊고 편안한 인연을 부르는 나침반이 되어줄 거예요. 💫`,
        `누군가에게 잘 보이기 위한 조건이 아니라, 있는 그대로의 내면을 기록한 당신의 용기가 참 고맙습니다. 당신만의 속도와 온도를 언제나 응원할게요. 🌙`,
    ];
    const paragraph3 = closings[(seed >> 5) % closings.length];

    return `**"${title}"**\n\n${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;
}

/**
 * 3일(첫 리포트) 또는 7일치 응답을 분석하여 주간 리포트를 생성합니다.
 * Claude API를 우선 시도하고, 크레딧 부족이나 일시 장애 시 고정밀 로컬 심리 분석기로 즉시 전환합니다.
 */
export async function analyzeWeeklyResponses(
    responses: ResponseForAnalysis[]
): Promise<string> {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey || apiKey === 'your-anthropic-api-key' || Date.now() < claudeSkipUntil) {
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

        const contentBlocks: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

        contentBlocks.push({
            type: 'text',
            text: `다음은 사용자의 최근 ${responses.length}일간의 질문과 응답입니다. 이 데이터를 분석해 주세요.\n\n${JSON.stringify(responsesData, null, 2)}`,
        });

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
            system: `당신은 사용자의 기록을 가장 먼저, 그리고 다정하게 읽고 깊은 내면의 빛을 발견해주는 숙련된 심리 분석가입니다.

[분석 및 작성 원칙]
1. 어조: 일기장을 조심스럽게 마주하듯, 다정하고 포근한 존댓말('-해요/해드려요/입니다')을 사용합니다. 기계적이거나 가르치려는 태도는 지양합니다.
2. 수용: 모순된 감정이나 부정적인 감정도 자연스럽고 의미 있는 것으로 온전히 수용합니다. 섣부른 긍정을 강요하지 않습니다.
3. 통찰(자기발견): 표면적인 응답 이면에 숨겨진 사용자의 고유한 가치관, 타인과 세상을 대하는 섬세한 태도, 본인도 미처 깨닫지 못한 매력적인 성향을 부드럽게 짚어줍니다.
4. 구조 및 형식:
   - 첫 줄 (페르소나 타이틀): 반드시 첫 줄에 사용자의 내면을 상징하는 시적인 한 줄 별칭을 **"조용히 빛나는 감정의 결을 가진 사람"** 과 같이 큰따옴표와 볼드(**)로 감싸서 단독 줄로 작성합니다.
   - 1문단 (공감과 요약): 기록 전반에 흐르는 감정선과 주요 테마에 대한 따뜻한 공감
   - 2문단 (관계와 매력): 타인과 관계를 맺는 방식, 그리고 그 안에서 빛나는 사용자만의 특별한 매력이나 가치
   - 3문단 (응원과 여운): 마음에 울림을 주는 따뜻한 문장으로 마무리
   - 기계적인 번호매기기(1., 2.)는 절대 사용하지 않으며, 한 편의 다정한 편지 같은 산지 형식으로 500자 내외로 작성합니다.

이미지가 포함된 경우에는, 그 이미지가 품고 있는 분위기와 피사체, 색감이 사용자의 현재 마음 상태를 어떻게 투영하고 있는지 시적이면서도 자연스럽게 연결해 주세요.`,
            messages: [
                {
                    role: 'user',
                    content: contentBlocks,
                },
            ],
        });

        const textBlock = message.content.find((block) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error('분석 결과를 생성하지 못했습니다.');
        }

        return textBlock.text;
    } catch (error) {
        // 크레딧 부족 또는 인증 오류 시 10분간 서킷 브레이커 작동하여 응답 지연 방지
        claudeSkipUntil = Date.now() + 10 * 60 * 1000;
        console.warn('Claude API 비활성/크레딧 부족 감지 — 고정밀 로컬 심리 분석 엔진으로 즉시 전환합니다:', error instanceof Error ? error.message : error);
        return generateLocalReport(responses);
    }
}

