/**
 * 사용방법 안내 페이지
 * 서비스 사용 흐름과 주요 기능을 시각적으로 안내
 */
import { Link } from 'react-router-dom'
import {
  Sparkles, Search, MousePointerClick, ShoppingBasket, Bot,
  ArrowRight, ChevronRight, BookOpen, Link2, Zap, Grid3x3,
  HelpCircle, Lightbulb, Wand2, Brain, Filter, Copy, Send,
  MessageSquare, BarChart3, Layers
} from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Search,
    color: 'blue',
    title: '검색하기',
    subtitle: '자연어로 수업 주제를 하이브리드 검색합니다',
    description: '검색창에 관심 있는 수업 주제를 자연어로 입력하세요. 하이브리드 검색이 AI 의미 분석(70%)과 정확한 키워드 매칭(30%)을 결합하여, 의미적으로 관련된 성취기준과 정확히 일치하는 성취기준을 모두 찾아줍니다.',
    tips: [
      '🔮🔍 하이브리드 검색 — 벡터 의미 + 키워드 정확도를 결합합니다',
      '결과는 관련도가 높은 교과군이 자동으로 맨 위에 표시됩니다',
      '학교급(초/중/고)과 교과군 필터로 검색 범위를 좁힐 수 있어요',
      '추천 검색어를 클릭하면 바로 검색을 시작할 수 있습니다',
    ],
    visual: 'search',
  },
  {
    number: '02',
    icon: MousePointerClick,
    color: 'purple',
    title: '성취기준 탐색',
    subtitle: '교과를 넘나드는 의미 연결을 발견합니다',
    description: '검색 결과에서 성취기준을 클릭하면 오른쪽에 상세 정보가 열립니다. 해당 성취기준의 본문, 해설, 키워드를 확인하고, 하이브리드 유사도 기반으로 다른 교과의 관련 성취기준을 자동 발견합니다.',
    tips: [
      '유사도 %가 높을수록 의미적+키워드 연관성이 모두 높은 성취기준입니다',
      '의미 연결은 같은 교과를 제외한 타교과 기준만 표시합니다',
      '연결된 성취기준을 다시 클릭하면 꼬리에 꼬리를 무는 탐색이 가능해요',
      '벡터 의미와 키워드 매칭을 종합적으로 분석한 결과입니다',
    ],
    visual: 'explore',
  },
  {
    number: '03',
    icon: ShoppingBasket,
    color: 'amber',
    title: '바구니에 담기',
    subtitle: '융합할 성취기준을 모읍니다',
    description: '마음에 드는 성취기준의 "바구니에 추가" 버튼을 눌러 융합 바구니에 담으세요. 여러 교과의 성취기준을 2개 이상 담으면 AI 융합 수업 설계가 활성화됩니다.',
    tips: [
      '화면 오른쪽 아래의 바구니 아이콘에서 담은 목록을 확인하세요',
      '2개 이상의 서로 다른 교과군이 포함되어야 융합 설계가 가능합니다',
      '검색 결과와 의미 연결 모두에서 성취기준을 담을 수 있어요',
      '바구니에서 개별 항목을 제거하거나 전체를 비울 수 있습니다',
    ],
    visual: 'basket',
  },
  {
    number: '04',
    icon: Bot,
    color: 'emerald',
    title: 'AI 융합 수업 설계',
    subtitle: 'AI가 맞춤형 프로젝트 수업 설계안을 생성합니다',
    description: '"AI 융합 수업 설계" 버튼을 클릭하면, Claude AI가 선택한 성취기준들을 종합 분석하여 프로젝트 기반 융합 수업 설계안을 실시간 스트리밍으로 생성합니다.',
    tips: [
      'AI가 프로젝트명, 수업 흐름, 차시별 계획, 평가 방법을 제안합니다',
      '생성된 설계안은 복사 버튼으로 클립보드에 복사할 수 있어요',
      '추가 요청 메시지를 보내 설계안을 수정·보완할 수 있습니다 (예: "평가 루브릭도 만들어줘")',
      '"다시 생성" 버튼으로 새로운 버전의 설계안을 받을 수 있어요',
    ],
    visual: 'design',
  },
]

const FEATURES = [
  {
    icon: Layers,
    title: '하이브리드 검색',
    desc: '벡터 의미 검색(70%)과 키워드 매칭(30%)을 결합합니다. 의미적으로 관련된 결과를 찾으면서도 정확한 단어 매칭을 놓치지 않습니다.',
  },
  {
    icon: Link2,
    title: '교차 교과 연결',
    desc: '하이브리드 유사도 기반으로 교과 간 의미적 연결을 실시간 계산합니다. 키워드 우연 일치가 아닌 진짜 교육적 관련성을 발견합니다.',
  },
  {
    icon: Wand2,
    title: 'AI 수업 설계',
    desc: 'Claude AI가 선택한 성취기준을 분석하여 프로젝트 기반 융합 수업안을 생성합니다. 실시간 스트리밍으로 바로 확인하세요.',
  },
  {
    icon: Filter,
    title: '스마트 필터링',
    desc: '학교급, 교과군 필터를 조합하여 원하는 범위의 성취기준만 검색할 수 있습니다. 결과는 관련도순으로 자동 정렬됩니다.',
  },
]

const FAQ = [
  {
    q: '하이브리드 검색이란 무엇인가요?',
    a: '🔮🔍 하이브리드 검색은 두 가지 검색 방식을 결합합니다. AI 벡터 검색(70%)이 문장의 의미를 분석하여 "인공지능"을 검색하면 "머신러닝", "데이터 분석" 등 관련 개념까지 찾고, 키워드 검색(30%)이 정확히 일치하는 단어를 부스트합니다. 두 방식의 장점을 모두 활용하여 최적의 검색 결과를 제공합니다.',
  },
  {
    q: '벡터 검색, 키워드 검색과 차이점은?',
    a: '🔮 벡터 검색은 의미는 잘 잡지만 정확한 단어 매칭을 놓칠 수 있습니다. 🔍 키워드 검색은 정확한 단어를 잡지만 동의어나 유사 개념을 놓칩니다. 🔮🔍 하이브리드는 두 점수를 가중 결합하여 의미적 관련성과 정확한 매칭을 동시에 보장합니다. 벡터 데이터가 없을 때만 키워드 검색으로 자동 대체됩니다.',
  },
  {
    q: '유사도 퍼센트(%)는 무엇을 의미하나요?',
    a: '성취기준 간의 종합 유사도를 0~100%로 표시합니다. 벡터 의미 유사도(70%)와 키워드 매칭 점수(30%)를 결합한 값입니다. 70% 이상이면 높은 연관성, 50~70%이면 중간 수준, 50% 이하면 약한 연관성으로 볼 수 있습니다.',
  },
  {
    q: '검색 결과가 적거나 없을 때는?',
    a: '더 일반적인 키워드로 검색해보세요. 예를 들어 "CRISPR 유전자 편집"보다 "유전자와 생명윤리"가 더 많은 결과를 찾습니다. 학교급이나 교과군 필터를 해제하면 더 넓은 범위에서 검색됩니다. 추천 검색어도 활용해보세요.',
  },
  {
    q: 'AI 설계 버튼이 비활성화되어 있어요',
    a: '2개 이상의 서로 다른 교과군에서 성취기준을 바구니에 담아야 AI 설계가 가능합니다. 같은 교과만 담으면 융합 수업으로 볼 수 없어 비활성 상태입니다. 검색 결과나 의미 연결에서 다양한 교과의 성취기준을 추가해보세요.',
  },
  {
    q: '어떤 교과가 포함되어 있나요?',
    a: '2022 개정 교육과정의 초·중·고 전 교과 성취기준 2,796개가 포함되어 있습니다. 국어, 수학, 영어, 사회, 과학, 정보, 도덕, 체육, 음악, 미술, 기술·가정, 제2외국어, 한문, 교양 등 14개 교과군을 다룹니다.',
  },
  {
    q: '교과군 정렬 기준은 무엇인가요?',
    a: '검색 결과에서 교과군은 관련도 순으로 자동 정렬됩니다. 각 교과군의 상위 3개 성취기준의 평균 유사도를 계산하여, 가장 관련성 높은 교과가 맨 위에 표시됩니다. 단일 고유사도 항목보다 여러 관련 항목이 있는 교과가 우선됩니다.',
  },
  {
    q: 'AI가 생성한 수업 설계안을 수정할 수 있나요?',
    a: '네! AI 설계 패널 하단의 입력창에 추가 요청을 보낼 수 있습니다. "평가 루브릭도 추가해줘", "수업 시간을 10차시로 늘려줘", "초등학생 수준으로 낮춰줘" 등 자유롭게 요청하세요. "다시 생성" 버튼으로 처음부터 새로 만들 수도 있습니다.',
  },
  {
    q: '매트릭스 보기는 무엇인가요?',
    a: '상단의 "매트릭스" 링크를 클릭하면 교과군 간 연결 관계를 히트맵으로 시각화한 화면을 볼 수 있습니다. 어떤 교과들이 서로 융합 가능성이 높은지 한눈에 파악할 수 있어요.',
  },
]

function StepVisual({ type }) {
  if (type === 'search') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center px-3">
            <Search size={16} className="text-blue-400 mr-2" />
            <span className="text-sm text-blue-400">인공지능과 환경</span>
          </div>
          <div className="px-3 py-2 bg-blue-600 rounded-lg text-white text-xs font-medium">검색</div>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">🔮🔍 하이브리드</span>
          <span className="text-xs text-gray-400">0.3초</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600 font-medium">정보</span>
            <span className="text-xs text-gray-400">5건</span>
            <span className="ml-auto text-xs text-emerald-500 font-medium">89%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">과학</span>
            <span className="text-xs text-gray-400">3건</span>
            <span className="ml-auto text-xs text-emerald-500 font-medium">74%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-600">도덕</span>
            <span className="text-xs text-gray-400">2건</span>
            <span className="ml-auto text-xs text-emerald-500 font-medium">68%</span>
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-2 text-center">↑ 관련도순 자동 정렬</p>
      </div>
    )
  }
  if (type === 'explore') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-xs text-white bg-red-500">과학</span>
          <code className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">[9과02-01]</code>
        </div>
        <p className="text-xs text-gray-600 mb-3">기후 변화의 원인과 영향을 분석하고...</p>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs text-gray-400">키워드:</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">기후</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">환경</span>
        </div>
        <div className="border-t border-gray-100 pt-2 mt-2">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Link2 size={12} /> 의미 연결 (🔮🔍 하이브리드 유사도)</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-600">사회 [9사01-03]</span>
              <span className="ml-auto text-emerald-500 font-medium">81%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">도덕 [9도02-05]</span>
              <span className="ml-auto text-emerald-500 font-medium">76%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">정보 [9정01-02]</span>
              <span className="ml-auto text-amber-500 font-medium">63%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (type === 'basket') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBasket size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700">융합 바구니</span>
          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">3개</span>
        </div>
        <div className="space-y-2">
          {[
            { code: '[9과02-01]', subject: '과학', color: 'bg-red-500' },
            { code: '[9사01-03]', subject: '사회', color: 'bg-orange-400' },
            { code: '[9도02-05]', subject: '도덕', color: 'bg-emerald-500' },
          ].map(item => (
            <div key={item.code} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <code className="font-mono text-blue-600">{item.code}</code>
              <span className="text-gray-400">{item.subject}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-emerald-600 mt-2">✓ 3개 교과 — AI 설계 가능!</p>
        <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-xs text-center font-medium flex items-center justify-center gap-1.5">
          <Sparkles size={14} /> AI 융합 수업 설계
        </div>
      </div>
    )
  }
  if (type === 'design') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={16} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700">AI 설계 결과</span>
          <div className="ml-auto flex gap-1">
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
              <Copy size={10} className="text-gray-400" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5 text-xs text-gray-600">
          <p className="font-semibold text-gray-700">🌍 프로젝트: "우리 동네 기후 리포트"</p>
          <p className="text-gray-400">관련: 과학 · 사회 · 도덕</p>
          <div className="border-l-2 border-purple-300 pl-2 space-y-1 mt-2">
            <p>1~2차시: 기후 데이터 조사 및 분석</p>
            <p>3~4차시: 사회적 영향 보고서 작성</p>
            <p>5차시: 윤리적 대응 방안 토론</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-7 bg-gray-50 border border-gray-200 rounded-lg flex items-center px-2">
              <span className="text-xs text-gray-300">평가 루브릭도 만들어줘</span>
            </div>
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Send size={10} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-700">융합교육 설계도구</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              <Search size={16} />
              검색
            </Link>
            <Link to="/matrix"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              <Grid3x3 size={16} />
              매트릭스
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* 히어로 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-600 mb-4">
            <HelpCircle size={16} />
            사용방법 안내
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            검색에서 AI 융합 수업 설계까지
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            2,796개 성취기준을 하이브리드 검색(벡터 의미 + 키워드)으로 탐색하고,
            교과를 넘나드는 융합 수업을 AI와 함께 설계하세요.
          </p>
          <Link to="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-shadow">
            바로 시작하기 <ArrowRight size={16} />
          </Link>
        </div>

        {/* 핵심 기능 */}
        <section className="mb-20">
          <h2 className="text-xl font-bold text-gray-700 mb-8 text-center">핵심 기능</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1">{f.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 검색 모드 비교 */}
        <section className="mb-20">
          <h2 className="text-xl font-bold text-gray-700 mb-8 text-center">검색 모드 비교</h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* 하이브리드 (기본) — 강조 */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-5 relative">
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">기본 모드</div>
              <div className="flex items-center gap-2 mb-3 mt-1">
                <span className="text-lg">🔮🔍</span>
                <h3 className="font-semibold text-indigo-700">하이브리드 검색</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                벡터 의미 검색(70%)과 키워드 정확 매칭(30%)을 가중 결합합니다. 의미적으로 관련된 결과를 찾으면서도 정확한 단어 일치를 부스트하여, 두 방식의 장점을 모두 제공합니다.
              </p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-medium text-indigo-600 mb-1">벡터 (70%)</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li>✓ 의미/맥락 이해</li>
                    <li>✓ 동의어·유사 개념</li>
                  </ul>
                </div>
                <div className="border-l border-indigo-200" />
                <div>
                  <p className="text-xs font-medium text-indigo-600 mb-1">키워드 (30%)</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li>✓ 정확한 단어 매칭</li>
                    <li>✓ 특정 용어 부스트</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 하위 모드 2개 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-purple-50/50 rounded-xl border border-purple-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔮</span>
                  <h3 className="font-semibold text-purple-600 text-sm">벡터 검색</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">·</span> AI가 문장의 의미를 분석</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">·</span> 동의어·유사 개념도 찾음</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">·</span> Voyage AI 512차원 임베딩</li>
                </ul>
                <p className="mt-2 text-xs text-purple-400">하이브리드의 70% 비중</p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔍</span>
                  <h3 className="font-semibold text-gray-500 text-sm">키워드 검색</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">·</span> 입력 단어를 직접 매칭</li>
                  <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">·</span> 한국어 조사 자동 제거</li>
                  <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">·</span> 벡터 없을 때 단독 폴백</li>
                </ul>
                <p className="mt-2 text-xs text-gray-400">하이브리드의 30% 비중</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4단계 사용 흐름 */}
        <section className="mb-20">
          <h2 className="text-xl font-bold text-gray-700 mb-8 text-center">사용 흐름</h2>
          <div className="space-y-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const colorClasses = {
                blue: { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-100' },
                purple: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-100' },
                amber: { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-100' },
                emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-100' },
              }[step.color]

              return (
                <div key={step.number} className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
                  {/* 텍스트 */}
                  <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${colorClasses.bg} rounded-xl flex items-center justify-center ring-4 ${colorClasses.ring}`}>
                        <Icon size={20} className={colorClasses.text} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-300 tracking-wider">STEP {step.number}</span>
                        <h3 className="text-lg font-bold text-gray-800">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 font-medium mb-2">{step.subtitle}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.description}</p>
                    <div className="space-y-2">
                      {step.tips.map((tip, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <Lightbulb size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">{tip}</span>
                        </div>
                      ))}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="hidden md:flex items-center gap-1 mt-6 text-gray-300">
                        <ChevronRight size={16} />
                        <ChevronRight size={16} />
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                  {/* 시각적 예시 */}
                  <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                    <StepVisual type={step.visual} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 데이터 규모 */}
        <section className="mb-20">
          <h2 className="text-xl font-bold text-gray-700 mb-8 text-center">데이터 규모</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '2,796', label: '성취기준', icon: BookOpen, color: 'blue' },
              { value: '14', label: '교과군', icon: BarChart3, color: 'purple' },
              { value: '512', label: '벡터 차원', icon: Brain, color: 'emerald' },
              { value: 'AI', label: '융합 설계', icon: Sparkles, color: 'amber' },
            ].map((stat, i) => {
              const Icon = stat.icon
              const bg = `bg-${stat.color}-100`
              const text = `text-${stat.color}-600`
              return (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className={text} />
                  </div>
                  <p className="text-2xl font-bold text-gray-700">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            2022 개정 교육과정 · 초·중·고 전 교과 · 하이브리드 검색 (벡터 + 키워드)
          </p>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gray-700 mb-8 text-center">자주 묻는 질문</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ.map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <HelpCircle size={18} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{item.q}</span>
                  <ChevronRight size={16} className="ml-auto text-gray-300 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-4 pl-12">
                  <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
          <BookOpen size={40} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">준비되셨나요?</h2>
          <p className="text-sm text-gray-500 mb-6">지금 바로 융합 수업 아이디어를 발견해보세요</p>
          <Link to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow">
            <Search size={18} />
            검색 시작하기
          </Link>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="max-w-5xl mx-auto px-4 py-8 mt-8 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          2022 개정 교육과정 기반 · 하이브리드 검색 · AI 융합교육 설계 도구
        </p>
      </footer>
    </div>
  )
}
