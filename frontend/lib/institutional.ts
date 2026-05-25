export interface MarketExample {
  question: string;
  intel: {
    previousData:       string;
    nextRelease:        string;
    officialSource:     string;
    relatedFactors:     string[];
    resolutionCriteria: string;
  };
}

export interface InstitutionalCategory {
  id:          string;
  title:       string;
  subtitle:    string;
  description: string;
  color:       string;        // tailwind text color
  bg:          string;        // tailwind bg/border classes for card accent
  iconName:    string;        // lucide icon name
  examples:    MarketExample[];
}

export const INSTITUTIONAL_CATEGORIES: InstitutionalCategory[] = [
  {
    id:          "inflation",
    title:       "Inflation Markets",
    subtitle:    "CPI · PPI · PCE",
    description: "Trade forecasts on consumer price index releases, inflation trajectories and central bank targets across major economies.",
    color:       "text-orange-400",
    bg:          "border-orange-600/30 bg-orange-600/5 hover:border-orange-600/50",
    iconName:    "TrendingUp",
    examples: [
      {
        question: "Will US CPI be above 3.2% in June 2026?",
        intel: {
          previousData:       "May 2026 CPI: placeholder",
          nextRelease:        "June 2026 CPI — expected mid-July 2026",
          officialSource:     "U.S. Bureau of Labor Statistics (bls.gov)",
          relatedFactors:     ["FED monetary policy", "Oil prices", "Labor market", "Consumer demand", "Housing costs"],
          resolutionCriteria: "Resolves YES if the official BLS CPI year-over-year reading for June 2026 exceeds 3.2%. Resolves NO otherwise.",
        },
      },
      {
        question: "Will Turkey annual inflation fall below 30% by Q4 2026?",
        intel: {
          previousData:       "Latest TUIK reading: placeholder",
          nextRelease:        "Monthly TUIK release — first week of each month",
          officialSource:     "Turkish Statistical Institute (tuik.gov.tr)",
          relatedFactors:     ["TCMB rate decisions", "TRY exchange rate", "Energy imports", "Domestic demand"],
          resolutionCriteria: "Resolves YES if any official TUIK monthly CPI release in Q4 2026 shows annual inflation below 30%.",
        },
      },
    ],
  },
  {
    id:          "rates",
    title:       "Interest Rate Markets",
    subtitle:    "FED · ECB · BOE · BOJ",
    description: "Forecast central bank rate decisions, policy pivots and the trajectory of global monetary tightening or easing cycles.",
    color:       "text-blue-400",
    bg:          "border-blue-600/30 bg-blue-600/5 hover:border-blue-600/50",
    iconName:    "Percent",
    examples: [
      {
        question: "Will the FED cut interest rates before September 2026?",
        intel: {
          previousData:       "Current FED Funds Rate: placeholder",
          nextRelease:        "Next FOMC meeting: placeholder",
          officialSource:     "Federal Reserve (federalreserve.gov)",
          relatedFactors:     ["US CPI trajectory", "Non-Farm Payrolls", "PCE inflation", "FOMC dot plot"],
          resolutionCriteria: "Resolves YES if the FOMC announces a rate cut at or before the September 2026 meeting.",
        },
      },
      {
        question: "Will the ECB keep rates unchanged at its next meeting?",
        intel: {
          previousData:       "Current ECB Deposit Rate: placeholder",
          nextRelease:        "Next ECB Governing Council meeting: placeholder",
          officialSource:     "European Central Bank (ecb.europa.eu)",
          relatedFactors:     ["Eurozone HICP", "EUR/USD", "Euro area growth", "Wage inflation"],
          resolutionCriteria: "Resolves YES if the ECB Governing Council maintains its key rates at the announced level.",
        },
      },
    ],
  },
  {
    id:          "macro",
    title:       "Macro Data Markets",
    subtitle:    "GDP · Unemployment · PMI",
    description: "Price discrete outcomes on macroeconomic data releases including GDP prints, labor market reports and business activity surveys.",
    color:       "text-arc-400",
    bg:          "border-arc-600/30 bg-arc-600/5 hover:border-arc-600/50",
    iconName:    "BarChart3",
    examples: [
      {
        question: "Will US unemployment rise above 4.5% this year?",
        intel: {
          previousData:       "Latest US unemployment rate: placeholder",
          nextRelease:        "Non-Farm Payrolls — first Friday each month",
          officialSource:     "U.S. Bureau of Labor Statistics (bls.gov)",
          relatedFactors:     ["FED policy", "Corporate hiring plans", "Technology sector layoffs", "Immigration"],
          resolutionCriteria: "Resolves YES if any official BLS monthly unemployment reading exceeds 4.5% before December 31, 2026.",
        },
      },
      {
        question: "Will Eurozone GDP growth exceed 1.5% in 2026?",
        intel: {
          previousData:       "2025 Eurozone GDP: placeholder",
          nextRelease:        "Eurostat Q1 2026 GDP Flash Estimate: placeholder",
          officialSource:     "Eurostat (ec.europa.eu/eurostat)",
          relatedFactors:     ["German industrial output", "ECB rates", "Energy prices", "Export demand"],
          resolutionCriteria: "Resolves YES if the full-year 2026 Eurozone GDP growth rate published by Eurostat exceeds 1.5%.",
        },
      },
    ],
  },
  {
    id:          "geopolitical",
    title:       "Geopolitical Risk Markets",
    subtitle:    "Conflict · Diplomacy · Sanctions",
    description: "Aggregate institutional views on political risk, diplomatic outcomes, conflict escalation and cross-border policy developments.",
    color:       "text-red-400",
    bg:          "border-red-600/30 bg-red-600/5 hover:border-red-600/50",
    iconName:    "Globe",
    examples: [
      {
        question: "Will a new ceasefire agreement be announced before July 2026?",
        intel: {
          previousData:       "Current conflict status: ongoing negotiations",
          nextRelease:        "UN Security Council session: placeholder",
          officialSource:     "United Nations (un.org)",
          relatedFactors:     ["UN mediation progress", "US foreign policy", "Regional actor positions", "Civilian corridor status"],
          resolutionCriteria: "Resolves YES if a formal, publicly announced ceasefire agreement is confirmed by the UN or recognized governments before July 1, 2026.",
        },
      },
      {
        question: "Will oil prices exceed $100/barrel following regional tensions?",
        intel: {
          previousData:       "Current Brent crude: placeholder",
          nextRelease:        "EIA Weekly Petroleum Report — every Wednesday",
          officialSource:     "U.S. Energy Information Administration (eia.gov)",
          relatedFactors:     ["OPEC+ production decisions", "Strait of Hormuz traffic", "US SPR levels", "Demand from China"],
          resolutionCriteria: "Resolves YES if Brent crude closing price exceeds $100 on any trading day before the market end date.",
        },
      },
    ],
  },
  {
    id:          "corporate",
    title:       "Corporate Forecast Markets",
    subtitle:    "Earnings · Revenue · Guidance",
    description: "Trade on corporate event outcomes — earnings beats, revenue guidance, analyst estimate comparisons and major business milestones.",
    color:       "text-purple-400",
    bg:          "border-purple-600/30 bg-purple-600/5 hover:border-purple-600/50",
    iconName:    "Building2",
    examples: [
      {
        question: "Will Nvidia revenue beat analyst expectations next quarter?",
        intel: {
          previousData:       "Last quarter revenue: placeholder",
          nextRelease:        "Nvidia Q2 FY2027 earnings: placeholder",
          officialSource:     "Nvidia Investor Relations (investor.nvidia.com)",
          relatedFactors:     ["AI chip demand", "Data center spending", "Competition from AMD/Intel", "Export restrictions"],
          resolutionCriteria: "Resolves YES if Nvidia reports quarterly revenue above the consensus analyst estimate at time of market creation.",
        },
      },
      {
        question: "Will Tesla deliver more than 500,000 vehicles in Q3 2026?",
        intel: {
          previousData:       "Q2 2026 deliveries: placeholder",
          nextRelease:        "Q3 2026 delivery report — early October 2026",
          officialSource:     "Tesla Investor Relations (ir.tesla.com)",
          relatedFactors:     ["Production capacity", "China demand", "Model refresh cycle", "EV incentive policy"],
          resolutionCriteria: "Resolves YES if Tesla's official Q3 2026 delivery report shows global deliveries exceeding 500,000 units.",
        },
      },
    ],
  },
  {
    id:          "energy",
    title:       "Energy & Commodities",
    subtitle:    "Oil · Gas · Gold · Metals",
    description: "Price commodities outcome markets including crude oil benchmarks, natural gas, precious metals and agricultural commodity thresholds.",
    color:       "text-yellow-400",
    bg:          "border-yellow-600/30 bg-yellow-600/5 hover:border-yellow-600/50",
    iconName:    "Flame",
    examples: [
      {
        question: "Will Brent crude oil close above $95 this quarter?",
        intel: {
          previousData:       "Current Brent crude: placeholder",
          nextRelease:        "EIA Short-Term Energy Outlook — monthly",
          officialSource:     "U.S. Energy Information Administration (eia.gov)",
          relatedFactors:     ["OPEC+ quota compliance", "US shale production", "China demand recovery", "Seasonal demand"],
          resolutionCriteria: "Resolves YES if Brent crude closing price exceeds $95 on any trading day before end of current quarter.",
        },
      },
      {
        question: "Will gold reach a new all-time high before year-end?",
        intel: {
          previousData:       "Current gold ATH: placeholder",
          nextRelease:        "FOMC decision (gold-correlated): placeholder",
          officialSource:     "LBMA Gold Price (lbma.org.uk)",
          relatedFactors:     ["US Dollar index", "Real interest rates", "Central bank gold buying", "Geopolitical safe-haven demand"],
          resolutionCriteria: "Resolves YES if the LBMA afternoon gold price fix sets a new all-time high before December 31, 2026.",
        },
      },
    ],
  },
  {
    id:          "policy",
    title:       "Policy & Election Markets",
    subtitle:    "Regulation · Legislation · Elections",
    description: "Forecast regulatory outcomes, legislative milestones, election results and major policy shifts affecting financial markets.",
    color:       "text-green-400",
    bg:          "border-green-600/30 bg-green-600/5 hover:border-green-600/50",
    iconName:    "Landmark",
    examples: [
      {
        question: "Will a major crypto regulation bill pass before year-end?",
        intel: {
          previousData:       "Current legislative status: placeholder",
          nextRelease:        "US Senate Committee hearing: placeholder",
          officialSource:     "US Congress (congress.gov)",
          relatedFactors:     ["SEC crypto enforcement", "Stablecoin regulation", "Bipartisan support", "Lobbying activity"],
          resolutionCriteria: "Resolves YES if a comprehensive federal crypto regulation bill is signed into law before December 31, 2026.",
        },
      },
      {
        question: "Will any G7 central bank change its inflation target in 2026?",
        intel: {
          previousData:       "Current G7 inflation targets: all at 2%",
          nextRelease:        "Annual central bank strategic reviews: various",
          officialSource:     "Individual central bank websites",
          relatedFactors:     ["Persistent above-target inflation", "Academic consensus shift", "Political pressure", "IMF recommendations"],
          resolutionCriteria: "Resolves YES if any G7 central bank officially announces a change to its primary inflation target before December 31, 2026.",
        },
      },
    ],
  },
];

export const TRUST_POINTS = [
  { title: "USDC Settlement on Arc",          desc: "All markets settle in native USDC on Arc Network. No volatile gas tokens required." },
  { title: "Transparent Resolution",          desc: "Every market has clearly defined resolution criteria published before it goes live." },
  { title: "On-Chain History",                desc: "All market activity, bets and resolutions are permanently recorded on Arc." },
  { title: "Official Data Sources",           desc: "Institutional markets resolve based on publicly verifiable, official data sources." },
  { title: "Arc-Native Infrastructure",       desc: "Sub-second finality and fiat-denominated fees remove settlement uncertainty." },
  { title: "Multi-Currency Ready",            desc: "Future support for EURC and other stablecoins for non-USD denominated markets." },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Choose a Market Category",
    desc:  "Select from inflation, interest rates, macro data, geopolitical risk, corporate forecasts, energy or policy markets.",
  },
  {
    step: "02",
    title: "Review Market Context",
    desc:  "Each market includes key data context, the official source, expected release date and explicit resolution criteria.",
  },
  {
    step: "03",
    title: "Trade with USDC on Arc",
    desc:  "Participate using native USDC on Arc Network with fast, transparent on-chain settlement and no gas token friction.",
  },
  {
    step: "04",
    title: "Resolve on Verified Sources",
    desc:  "Markets resolve according to official data releases or clearly defined, publicly verifiable outcomes.",
  },
];
