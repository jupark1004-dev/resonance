// RESONANCE 앱 전체 TypeScript 타입 정의

// ===== 데이터베이스 테이블 타입 =====

/** 사용자 프로필 */
export interface User {
    id: string;
    nickname: string | null;
    birth_year: number | null;
    gender: 'male' | 'female' | 'other' | null;
    region: string | null;
    created_at: string;
}

/** 데일리 질문 */
export interface DailyQuestion {
    id: string;
    question_text: string;
    category: 'emotion' | 'relationship' | 'space' | 'time';
    created_at: string;
}

/** 사용자 응답 */
export interface Response {
    id: string;
    user_id: string;
    question_id: string;
    text_response: string | null;
    image_url: string | null;
    responded_at: string;
}

/** AI 분석 리포트 */
export interface AnalysisReport {
    id: string;
    user_id: string;
    report_text: string;
    week_number: number;
    created_at: string;
}

/** 매칭 */
export interface Match {
    id: string;
    user_a_id: string;
    user_b_id: string;
    resonance_score: number;
    match_reason?: string | null;
    status: 'pending' | 'gatekeeper' | 'matched' | 'missed';
    created_at: string;
}

/** 관문 질문 (동적) */
export interface GatekeeperQuestion {
    id: string;
    option_a: string;
    option_b: string;
    is_active: boolean;
    created_at: string;
}

/** 관문 답변 */
export interface GatekeeperAnswer {
    id: string;
    match_id: string;
    user_id: string;
    answers: Record<string, string>; // { "question_id": "option_a" }
}

/** 채팅 메시지 */
export interface Message {
    id: string;
    match_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

// ===== API 요청/응답 타입 =====

/** 온보딩 입력 데이터 */
export interface OnboardingInput {
    nickname: string;
    birth_year: number;
    gender: 'male' | 'female' | 'other';
    region: string;
}

/** 응답 제출 데이터 */
export interface ResponseInput {
    question_id: string;
    text_response?: string;
    image_url?: string;
}

/** API 응답 공통 래퍼 */
export interface ApiResponse<T = undefined> {
    success: boolean;
    data?: T;
    error?: string;
}

// ===== 응답과 질문이 조인된 뷰 타입 =====

/** 타임라인에서 사용 — 응답 + 질문 정보 */
export interface ResponseWithQuestion extends Response {
    question: DailyQuestion;
}
