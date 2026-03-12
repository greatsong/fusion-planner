/**
 * 사용방법 안내 페이지
 * 서비스 사용 흐름과 주요 기능을 시각적으로 안내
 */
import { Link } from 'react-router-dom'
import {
  Sparkles, Search, MousePointerClick, ShoppingBasket, Bot,
  ArrowRight, ChevronRight, BookOpen, Link2, Zap, Grid3x3,
  HelpCircle, Lightbulb, ArrowLeft
} from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Search,
    color: 'blue',
    title: '검색하기',
    subtitle: '자연어로 수업 주제를 검색합니다',
    description: '검색창에 관심 있는 수업 주제를 자연어로 입력하세요. 예를 들어 "인공지능과 윤리", "기후변화와 환경", "데이터 분석" 등 자유롭게 검색할 수 있습니다.',
    tips: [
      '추천 검색어를 클릭하면 바로 검색됩니다',
      '학교급(초/중/고)과 교과군 필터로 범위를 좁힐 수 있어요',
      '검색 결과는 교과군별로 묶여 관련도 순으로 표시됩니다',
    ],
    visual: 'search',
  },
  {
    number: '02',
    icon: MousePointerClick,
    color: 'purple',
    title: '성취기준 탐색',
    subtitle: '교과를 넘나드는 연결을 발견합니다',
    description: '검색 결과에서 성취기준을 클릭하면 오른쪽에 상세 정보와 함께 다른 교과의 유사한 성취기준(의미 연결)이 표시됩니다.',
    tips: [
      '유사도 %가 높을수록 의미적으로 가까운 성취기준입니다',
      '의미 연결은 같은 교과를 제외한 타교과 기준만 표시합니다',
      '연결된 성취기준을 다시 클릭하면 그 기준의 연결도 탐색할 수 있어요',
    ],
    visual: 'explore',
  },
  {
    number: '03',
    icon: ShoppingBasket,
    color: 'amber',
    title: '바구니에 담기',
    subtitle: '융합할 성취기준을 모읍니다',
    description: '마음에 드는 성취기준의 + 버튼을 눌러 융합 바구니에 담으세요. 여러 교과의 성취기준을 2개 이상 담으면 AI 융합 수업 설계가 가능합니다.',
    tips: [
      '화면 오른쪽 아래의 바구니 아이콘에서 담은 목록을 확인하세요',
      '2개 이상의 서로 다른 교과가 포함되어야 융합 설계가 가능합니다',
      '바구니에서 개별 항목을 제거하거나 전체를 비울 수 있어요',
    ],
    visual: 'basket',
  },
  {
    number: '04',
    icon: Bot,
    color: 'emerald',
    title: 'AI 융합 수업 설계',
    subtitle: 'AI가 맞춤형 수업 설계안을 생성합니다',
    description: '"AI 융합 수업 설계" 버튼을 클릭하면, AI가 선택한 성취기준들을 분석하여 프로젝트 기반 융합 수업 설계안을 실시간으로 생성합니다.',
    tips: [
      'AI가 프로젝트명, 수업 흐름, 차시별 계획, 평가 방법을 제안합니다',
      '생성된 설계안은 마크다운 형식으로 복사할 수 있어요',
      '추가 요청 메시지를 보내 설계안을 수정·보완할 수 있습니다',
    ],
    visual: 'design',
  },
]

const FAQ = [
  {
    q: '검색 결과가 적거나 없을 때는?',
    a: '더 일반적인 키워드로 검색해보세요. 필터를 해제하면 더 많은 결과를 볼 수 있습니다. 추천 검색어도 활용해보세요.',
  },
  {
    q: '의미 연결이 교육적으로 맞지 않는 것 같아요',
    a: '현재 키워드 기반 검색 모드에서는 일부 부정확한 연결이 있을 수 있습니다. 벡터 검색 모드가 활성화되면 의미 기반으로 더 정확한 연결을 제공합니다.',
  },
  {
    q: 'AI 설계 버튼이 비활성화되어 있어요',
    a: '2개 이상의 서로 다른 교과군에서 성취기준을 바구니에 담아야 AI 설계가 가능합니다. 같은 교과만 담으면 융합 수업으로 볼 수 없어 비활성 상태입니다.',
  },
  {
    q: '어떤 교과가 포함되어 있나요?',
    a: '2022 개정 교육과정의 초·중·고 전 교과 성취기준 2,796개가 포함되어 있습니다. 국어, 수학, 영어, 사회, 과학, 정보, 도덕, 체육, 음악, 미술, 기술·가정, 제2외국어, 한문, 교양 등 14개 교과군을 다룹니다.',
  },
  {
    q: '매트릭스 보기는 무엇인가요?',
    a: '상단의 "매트릭스" 링크를 클릭하면 교과군 간 연결 관계를 히트맵으로 시각화한 화면을 볼 수 있습니다. 어떤 교과들이 서로 연결 가능성이 높은지 한눈에 파악할 수 있어요.',
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">정보</span>
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
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600">도덕</span>
            <span className="text-xs text-gray-400">2건</span>
            <span className="ml-auto text-xs text-emerald-500 font-medium">68%</span>
          </div>
        </div>
      </div>
    )
  }
  if (type === 'explore') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <code className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">[9과02-01]</code>
          <span className="text-xs text-gray-400">과학</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">기후 변화의 원인과 영향을 분석하고...</p>
        <div className="border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Link2 size={12} /> 의미 연결</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-600">사회 [9사01-03]</span>
              <span className="ml-auto text-emerald-500">81%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">도덕 [9도02-05]</span>
              <span className="ml-auto text-emerald-500">76%</span>
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
        <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-xs text-center font-medium">
          AI 융합 수업 설계
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
        </div>
        <div className="space-y-1.5 text-xs text-gray-600">
          <p className="font-semibold text-gray-700">🌍 프로젝트: "우리 동네 기후 리포트"</p>
          <p className="text-gray-400">관련 성취기준: 과학, 사회, 도덕</p>
          <div className="border-l-2 border-purple-300 pl-2 space-y-1 mt-2">
            <p>1~2차시: 기후 데이터 조사 및 분석</p>
            <p>3~4차시: 사회적 영향 보고서 작성</p>
            <p>5차시: 윤리적 대응 방안 토론</p>
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
            2,796개 성취기준을 의미 기반으로 탐색하고, AI의 도움을 받아
            교과를 넘나드는 융합 수업을 설계하세요.
          </p>
          <Link to="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-shadow">
            바로 시작하기 <ArrowRight size={16} />
          </Link>
        </div>

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
          2022 개정 교육과정 기반 · AI 융합교육 설계 도구
        </p>
      </footer>
    </div>
  )
}
