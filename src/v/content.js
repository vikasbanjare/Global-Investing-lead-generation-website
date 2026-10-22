// The reviewed copy (brief/copy/v3-reviewed.txt), once, for every design variation (/v2/–/v5/).
// Variations differ in layout, colour and motion only; wording changes go here so all of them stay in step.

export const nav = [['#product', 'Product'], ['#how', 'How it works'], ['#pricing', 'Pricing'], ['#tax', 'Tax'], ['#faq', 'FAQs']];

export const hero = {
  eyebrow: 'Global investing',
  h1: 'US stocks:',
  h1b: 'New possibilities for your portfolio.',
  lead: 'Invest in US-listed companies and ETFs from India. With fractional shares, you invest for as low as $1.',
  points: [
    'Explore US stocks and ETFs through the GIFT City route.',
    'Start with eligible fractional shares from USD 1.',
    'Open a dedicated global investing account online.',
  ],
  cta: 'Start investing',
  how: 'How it works',
  formTitle: 'Get started with US investing',
};

export const highlights = [
  { fig: '5,000+', label: 'US stocks & ETFs', note: 'Explore individual shares & ETFs' },
  { fig: '$1', label: 'Fractional investing', note: 'For eligible securities' },
  { fig: '₹0', label: 'Account opening', note: 'No account-opening fee' },
  { fig: 'GIFT City', label: 'Access framework', note: 'IFSCA-regulated route' },
];

export const brands = {
  title: 'Recognise the brand? Now own the stock',
  sub: 'Invest in US-listed businesses across technology, commerce, entertainment and more',
  list: [['Apple', 'AAPL', 'apple'], ['Microsoft', 'MSFT', 'microsoft'], ['Alphabet', 'GOOGL', 'google'], ['Amazon', 'AMZN', 'amazon'],
    ['Tesla', 'TSLA', 'tesla'], ['NVIDIA', 'NVDA', 'nvidia'], ['Meta', 'META', 'meta'], ['Netflix', 'NFLX', 'netflix']],
};

export const features = {
  eyebrow: 'Fractional investing',
  title: 'Global investing made simple',
  items: [
    ['Fractional stocks & ETFs', 'Buy a portion of eligible US stocks and ETFs from $1'],
    ['Find what interests you', 'Search by company, sector or theme before you invest'],
    ['A clearer view of holdings', 'Check US positions, balances and transaction history in your dedicated portal'],
    ['INR to USD funding', 'Send INR through your bank. View USD buying power after conversion and credit'],
  ],
};

export const why = {
  title: 'Why look beyond Indian markets?',
  more: 'Read more',
  items: [
    ['Diversify, diversify, diversify…', 'Add exposure to businesses and sectors outside India to your portfolio. Diversification cannot eliminate market risk.'],
    ['Access global leaders', 'Consider US-listed businesses shaping industries you follow, from AI to semiconductors.'],
    ['Dollarise your portfolio', 'US dollar assets bring currency exposure. Rupee movements can lift or reduce returns when measured in INR.'],
  ],
};

export const whyUs = {
  title: 'Why m.Stock for US investing?',
  items: ['A clear route from India to US markets', 'Straightforward charges you can check upfront', 'A dedicated US investing portal to track your holdings', 'Access backed by the Mirae Asset Group'],
};

export const who = {
  title: 'Who can start investing?',
  items: [
    ['Resident Indians', 'Eligible resident individuals can remit under RBI’s LRS, subject to the $250,000 annual limit.'],
    ['What you will need', 'Keep PAN, identity and address details ready. Additional KYC and declarations may apply.'],
    ['Who else can apply?', 'Eligible NRIs may apply, subject to residence-country restrictions and verification.'],
  ],
};

export const orders = {
  title: 'Choose how you place your US stocks’ order',
  cols: ['Order type', 'What it does', 'Best for'],
  rows: [
    ['Market', 'Buys or sells at the available market price', 'Placing an order quickly'],
    ['Limit', 'Executes at your chosen price or better, if available', 'More control over price'],
    ['Stop / Stop-limit', 'Activates an order after a specified trigger', 'Setting conditional instructions'],
    ['Fractional by amount', 'Invests a US dollar amount in an eligible security', 'Starting without buying a whole share'],
  ],
};

export const supports = {
  title: 'What does m.Stock support?',
  items: [
    ['Order types', 'Market, limit, stop and fractional orders are supported with m.Stock'],
    ['Execution', 'Orders are handled through ViewTrade’s US-market execution arrangements, subject to market conditions & order eligibility'],
    ['Custody', 'Holdings are maintained through the appointed custody and clearing arrangements'],
  ],
};

export const steps = {
  title: 'From India to US markets in 4 steps',
  cta: 'Start now',
  items: [
    ['Open your account', 'Apply online and complete the required checks.'],
    ['Get verified', 'Submit documents and await account approval.'],
    ['Add USD buying power', 'Remit INR through your bank for USD conversion.'],
    ['Find, invest, track', 'Explore securities and monitor your US investments.'],
  ],
};

export const routes = [
  {
    title: 'How your INR becomes USD buying power', tag: 'INR → USD',
    steps: ['Start an LRS remittance from your Indian bank', 'Bank verifies the request and converts INR to USD', 'Funds are routed through the GIFT City account', 'USD buying power becomes available to invest'],
    note: 'Transfer times depend on the bank, applicable checks and processing schedules',
  },
  {
    title: 'How you bring your money back to India', tag: 'USD → INR',
    steps: ['Request a withdrawal (minimum USD 20)', 'Your request goes through the required review', 'USD is converted to INR after approval', 'INR reaches your linked Indian bank account'],
    note: 'Indicative processing: 1-2 working days after approval, bank timelines may vary',
  },
];

export const sectors = {
  title: 'Explore US stocks by sector',
  cols: ['Company', 'Ticker', 'Price (USD)', '1D %', 'Action'],
  cta: 'View all US stocks & ETFs',
  note: 'Illustrative prices, not live quotes. In the app, market prices may be delayed; check the timestamp displayed with each quote. Not investment advice.',
  list: {
    Technology: [['Apple', 'AAPL', 'apple'], ['Microsoft', 'MSFT', 'microsoft'], ['NVIDIA', 'NVDA', 'nvidia'], ['Alphabet', 'GOOGL', 'google'], ['Amazon', 'AMZN', 'amazon']],
    Healthcare: [['Eli Lilly', 'LLY'], ['Johnson & Johnson', 'JNJ'], ['UnitedHealth', 'UNH'], ['AbbVie', 'ABBV'], ['Merck', 'MRK']],
    Financials: [['Visa', 'V', 'visa'], ['Mastercard', 'MA', 'mastercard'], ['Goldman Sachs', 'GS', 'goldmansachs'], ['Bank of America', 'BAC', 'bankofamerica'], ['American Express', 'AXP', 'americanexpress']],
    Consumer: [['Tesla', 'TSLA', 'tesla'], ['Netflix', 'NFLX', 'netflix'], ['Coca-Cola', 'KO', 'cocacola'], ['Starbucks', 'SBUX', 'starbucks'], ['McDonald’s', 'MCD', 'mcdonalds']],
    Energy: [['Exxon Mobil', 'XOM'], ['Chevron', 'CVX'], ['ConocoPhillips', 'COP'], ['NextEra Energy', 'NEE'], ['SLB', 'SLB']],
    ETFs: [['S&P 500 ETF', 'SPY'], ['Nasdaq-100 ETF', 'QQQ'], ['Vanguard S&P 500', 'VOO'], ['Total Stock Market', 'VTI'], ['Core S&P 500', 'IVV']],
  },
};

export const tax = {
  title: 'US investing comes with tax questions',
  sub: 'General information only. Tax rules can change; consult a qualified advisor.',
  more: 'Learn more',
  cta: 'Download tax guide (PDF)',
  items: [
    ['Capital gains', 'Understand how holding periods and sale proceeds can affect tax in India'],
    ['Dividends', 'Learn about US withholding and potential foreign tax credits'],
    ['TCS on remittances', 'Check when Indian tax collection rules apply to overseas transfers'],
    ['ITR reporting', 'Know which overseas assets and income may need to be declared'],
  ],
};

export const charges = {
  title: 'What you will be charged?', // ₹0 account opening sits in the centre, highlighted (user request)
  items: [
    { label: 'Brokerage', fig: '0.25%', note: 'Of trade value · Check applicable levies and charges.', cta: 'Start investing' },
    { label: 'Account opening', fig: '₹0', note: 'One-time opening fee: Nil · Annual platform fee: Nil', cta: 'Open account', hot: true, tag: 'No account-opening fee' },
    { label: 'Funds & withdrawals', fig: 'USD 0 / USD 10*', note: 'Resident / NRI withdrawal transaction fee · Bank and FX charges may apply.', cta: 'Know more' },
  ],
  foot: '*Withdrawal transaction charges: USD 0 for resident Indians; USD 10 for NRIs. Bank, conversion and third-party charges, if there are any, are additional.',
};

export const closing = {
  title: 'Go global with m.Stock',
  sub: 'Investing in US stocks is just a start…',
  benefits: ['Digital onboarding', 'Fractional entry from USD 1*', 'GIFT City route'],
  cta: 'Open account',
  expert: 'Talk to an expert',
  fine: '*For eligible securities.',
};

export const faq = {
  title: 'FAQs',
  items: [
    ['Can Indians invest in US stocks?', 'Yes. Eligible resident individuals can use RBI’s Liberalised Remittance Scheme (LRS) to invest in permitted overseas securities, subject to its $250,000 annual aggregate limit and applicable rules. Eligible NRIs may apply subject to location and onboarding restrictions.'],
    ['What is the LRS limit?', 'RBI’s Liberalised Remittance Scheme generally allows eligible resident individuals to remit up to $250,000 per financial year across permitted LRS purposes. This is an overall limit, not a separate US stocks allowance.'],
    ['How much money do I need to start?', 'Eligible fractional US stocks and ETFs can be purchased starting from $1, subject to the supported instrument and order rules. Bank remittance minimums, charges and foreign-exchange conversion may affect the amount you choose to transfer.'],
    ['What are the trading hours (IST)?', 'Regular US market hours are 9:30 AM to 4:00 PM Eastern Time. That is usually 7:00 PM to 1:30 AM IST during US daylight saving time, or 8:00 PM to 2:30 AM IST during US standard time, excluding market holidays.'],
    ['How are gains taxed?', 'For Indian tax residents, profits on sale and dividends may be taxable in India. Broadly, relevant long-term US share gains may fall under the 24-month holding rule, with applicable capital-gains rates; US dividend withholding and foreign tax credits may also matter. Please consult the approved tax guide and a qualified advisor for current rules.'],
    ['How do I withdraw money?', 'Place a withdrawal request in the dedicated US investing portal. After review, funds are converted from USD to INR and sent to your linked Indian bank account. The product note specifies a USD 20 minimum request and stated transaction charges of USD 0 for resident Indians and USD 10 for NRIs. Additional bank or FX costs may apply.'],
  ],
};

export const footer = {
  about: 'Co-powered by ViewTrade. Offered by Mirae Asset Capital Markets (IFSC) Pvt Ltd, regulated by IFSCA, GIFT City.',
  cols: [
    ['Invest', [['#product', 'US stocks'], ['#product', 'US ETFs'], ['#india', 'Indian stocks'], ['#mf', 'Mutual funds']]],
    ['Learn', [['#how', 'How it works'], ['#tax', 'Tax guide'], ['#faq', 'FAQs']]],
    ['Legal', [['#terms', 'Terms'], ['#privacy', 'Privacy'], ['#disclosures', 'Disclosures'], ['#charges', 'Schedule of charges']]],
  ],
  fine: 'IFSCA Broker Dealer Registration No. [REGISTRATION NUMBER] · [REGISTERED OFFICE ADDRESS]. Investments in securities markets are subject to market risks. Read all related documents carefully before investing. Brand names and logos are for identification only and do not imply endorsement. © 2026 Mirae Asset Capital Markets (IFSC) Private Limited.',
};
